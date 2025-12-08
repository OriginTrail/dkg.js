/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
import Web3 from 'web3';
import {
    TRANSACTION_RETRY_ERRORS,
    WEBSOCKET_PROVIDER_OPTIONS,
} from '../../../constants/constants.js';
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

                // Log transaction details before sending
                console.log(
                    '\n======================== SENDING TRANSACTION ========================',
                );
                console.log('Contract:', contractName);
                console.log('Function:', functionName);
                console.log('Contract Address:', contractInstance.options.address);
                console.log('Blockchain:', blockchain.name);
                console.log('From:', tx.from);
                console.log('To:', tx.to);
                console.log('Gas Limit:', tx.gas);
                console.log(
                    'Gas Price:',
                    tx.gasPrice,
                    `(${Web3.utils.fromWei(tx.gasPrice.toString(), 'Gwei')} Gwei)`,
                );

                // Log function arguments with parameter names
                try {
                    const methodAbi = contractInstance.options.jsonInterface.find(
                        (item) => item.name === functionName && item.type === 'function',
                    );
                    if (methodAbi && methodAbi.inputs) {
                        console.log('Function Arguments:');
                        methodAbi.inputs.forEach((input, index) => {
                            const value = args[index];
                            const displayValue =
                                typeof value === 'bigint'
                                    ? value.toString()
                                    : Array.isArray(value)
                                    ? `[${value.length} items]`
                                    : value;
                            console.log(`  ${input.name} (${input.type}):`, displayValue);
                        });
                    } else {
                        console.log(
                            'Function Arguments:',
                            JSON.stringify(
                                args,
                                (key, value) =>
                                    typeof value === 'bigint' ? value.toString() : value,
                                2,
                            ),
                        );
                    }
                } catch (err) {
                    console.log(
                        'Function Arguments:',
                        JSON.stringify(
                            args,
                            (key, value) => (typeof value === 'bigint' ? value.toString() : value),
                            2,
                        ),
                    );
                }

                console.log('Encoded Data:', tx.data);
                console.log('Retry Transaction:', transactionRetried ? 'Yes' : 'No');
                if (transactionRetried) {
                    console.log(
                        'Previous Gas Price:',
                        previousTxGasPrice,
                        `(${Web3.utils.fromWei(previousTxGasPrice.toString(), 'Gwei')} Gwei)`,
                    );
                    console.log('Gas Price Increased By: 20%');
                }
                console.log(
                    '=====================================================================\n',
                );

                const createdTransaction = await web3Instance.eth.accounts.signTransaction(
                    tx,
                    blockchain.privateKey,
                );

                receipt = await web3Instance.eth.sendSignedTransaction(
                    createdTransaction.rawTransaction,
                );

                // Log transaction receipt
                console.log(
                    '\n===================== TRANSACTION SUCCESSFUL ========================',
                );
                console.log('Transaction Hash:', receipt.transactionHash);
                console.log('Block Number:', receipt.blockNumber);
                console.log('Gas Used:', receipt.gasUsed);
                console.log('Status:', receipt.status ? 'Success' : 'Failed');
                console.log(
                    '=====================================================================\n',
                );

                if (blockchain.name.startsWith('otp') && blockchain.waitNeurowebTxFinalization) {
                    receipt = await this.waitForTransactionFinalization(receipt, blockchain);
                }
            } catch (error) {
                console.log(
                    '\n======================= TRANSACTION ERROR ===========================',
                );
                console.log('Contract:', contractName);
                console.log('Function:', functionName);
                console.log('Error Type:', error.constructor.name);
                console.log('Error Message:', error.message);

                // Log revert reason if available
                if (error.reason) {
                    console.log('Revert Reason:', error.reason);
                }

                // Log error code if available
                if (error.code) {
                    console.log('Error Code:', error.code);
                }

                // Log transaction hash if it exists (for mined but reverted transactions)
                if (error.receipt?.transactionHash) {
                    console.log('Transaction Hash:', error.receipt.transactionHash);
                    console.log('Block Number:', error.receipt.blockNumber);
                    console.log('Gas Used:', error.receipt.gasUsed);
                }

                // Log inner error if available
                if (error.innerError) {
                    console.log('Inner Error:', error.innerError.message || error.innerError);
                }

                // Log error data if available (can contain revert data)
                if (error.data) {
                    console.log(
                        'Error Data:',
                        typeof error.data === 'string' ? error.data : JSON.stringify(error.data),
                    );
                }

                // Log full stack trace for debugging
                if (error.stack) {
                    console.log('\nStack Trace:');
                    console.log(error.stack);
                }

                console.log(
                    '=====================================================================\n',
                );

                if (
                    simulationSucceeded &&
                    !transactionRetried &&
                    blockchain.handleNotMinedError &&
                    TRANSACTION_RETRY_ERRORS.some((errorMsg) =>
                        error.message.toLowerCase().includes(errorMsg),
                    )
                ) {
                    console.log('Retrying transaction with increased gas price...\n');
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

                    if (!status && contractName !== 'ParanetIncentivesPool') {
                        console.log(
                            'Contract status check failed. Updating contract instance and retrying...\n',
                        );
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
            'KnowledgeCollectionStorage',
            'safeTransferFrom',
            [blockchain.publicKey, to, tokenId, 1, '0x'],
            blockchain,
        );
    }
}
