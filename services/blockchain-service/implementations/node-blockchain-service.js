/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
import Web3 from 'web3';
import { TRANSACTION_RETRY_ERRORS, WEBSOCKET_PROVIDER_OPTIONS } from '../../../constants.js';
import BlockchainServiceBase from '../blockchain-service-base.js';

export default class NodeBlockchainService extends BlockchainServiceBase {
    constructor(config = {}) {
        super(config);
        this.config = config;
        this.events = {};

        this.abis.KnowledgeCollectionStorage.filter((obj) => obj.type === 'event').forEach(
            (event) => {
                const concatInputs = event.inputs.map((input) => input.internalType);

                this.events[event.name] = {
                    hash: Web3.utils.keccak256(`${event.name}(${concatInputs})`),
                    inputs: event.inputs,
                };
            },
        );

        this.abis.PaymasterManager.filter((obj) => obj.type === 'event').forEach(
            (event) => {
                const concatInputs = event.inputs.map((input) => input.internalType);

                this.events[event.name] = {
                    hash: Web3.utils.keccak256(`${event.name}(${concatInputs})`),
                    inputs: event.inputs,
                };

            },
        );        
    }

    initializeWeb3(blockchainName, blockchainRpc, blockchainOptions) {
        if (blockchainRpc.startsWith('ws')) {
            const provider = new Web3.providers.WebsocketProvider(
                blockchainRpc,
                WEBSOCKET_PROVIDER_OPTIONS,
            );

            this[blockchainName].web3 = new Web3(provider);
        } else {
            this[blockchainName].web3 = new Web3(blockchainRpc);
        }

        if (blockchainOptions.transactionPollingTimeout) {
            this[blockchainName].web3.eth.transactionPollingTimeout =
                blockchainOptions.transactionPollingTimeout;
        }
    }

    async decodeEventLogs(receipt, eventName, blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);
        let result;
        const { hash, inputs } = this.events[eventName];

        for (const log of receipt.logs) {
            if (log.topics && log.topics.length > 0 && log.topics[0] === hash) {
                result = web3Instance.eth.abi.decodeLog(inputs, log.data, log.topics.slice(1));
                break;
            }
        }
        return result;
    }

    async getPublicKey(blockchain) {
        return blockchain?.publicKey;
    }

    async executeContractFunction(contractName, functionName, args, blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);
        let contractInstance = await this.getContractInstance(contractName, blockchain);

        let receipt;
        let previousTxGasPrice;
        let simulationSucceeded = false;
        let transactionRetried = false;

        while (receipt === undefined) {
            try {
                const tx = await this.prepareTransaction(
                    contractInstance,
                    functionName,
                    args,
                    blockchain,
                );
                previousTxGasPrice = tx.gasPrice;
                simulationSucceeded = true;

                const createdTransaction = await web3Instance.eth.accounts.signTransaction(
                    tx,
                    blockchain.privateKey,
                );

                receipt = await web3Instance.eth.sendSignedTransaction(
                    createdTransaction.rawTransaction,
                );
                if (blockchain.name.startsWith('otp') && blockchain.waitNeurowebTxFinalization) {
                    receipt = await this.waitForTransactionFinalization(receipt, blockchain);
                }
            } catch (error) {
                if (
                    simulationSucceeded &&
                    !transactionRetried &&
                    blockchain.handleNotMinedError &&
                    TRANSACTION_RETRY_ERRORS.some((errorMsg) =>
                        error.message.toLowerCase().includes(errorMsg),
                    )
                ) {
                    transactionRetried = true;
                    blockchain.retryTx = true;
                    blockchain.previousTxGasPrice = previousTxGasPrice;
                } else if (!transactionRetried && /revert|VM Exception/i.test(error.message)) {
                    let status;
                    try {
                        status = await contractInstance.methods.status().call();
                    } catch (_) {
                        status = false;
                    }

                    if (!status && contractName !== 'ParanetNeuroIncentivesPool') {
                        await this.updateContractInstance(contractName, blockchain, true);
                        contractInstance = await this.getContractInstance(contractName, blockchain);
                        transactionRetried = true;
                        blockchain.retryTx = true;
                    } else {
                        throw error;
                    }
                } else {
                    throw error;
                }
            }
        }

        return receipt;
    }

    async transferAsset(tokenId, to, blockchain) {
        return this.executeContractFunction(
            'ContentAssetStorage',
            'transferFrom',
            [blockchain.publicKey, to, tokenId],
            blockchain,
        );
    }
}
