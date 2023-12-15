const Web3 = require('web3');
const { TRANSACTION_RETRY_ERRORS, WEBSOCKET_PROVIDER_OPTIONS } = require('../../../constants.js');
const BlockchainServiceBase = require('../blockchain-service-base.js');

class NodeBlockchainService extends BlockchainServiceBase {
    constructor(config = {}) {
        super(config);
        this.config = config;
        this.events = {};

        this.abis.ContentAsset.filter((obj) => obj.type === 'event').forEach((event) => {
            const concatInputs = event.inputs.map((input) => input.internalType);

            this.events[event.name] = {
                hash: Web3.utils.keccak256(`${event.name}(${concatInputs})`),
                inputs: event.inputs,
            };
        });
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
        const web3Instance = await this.getWeb3Instance(blockchain);
        let result;
        const { hash, inputs } = this.events[eventName];
        receipt.logs.forEach((row) => {
            if (row.topics[0] === hash)
                result = web3Instance.eth.abi.decodeLog(inputs, row.data, row.topics.slice(1));
        });
        return result;
    }

    async getPublicKey(blockchain) {
        return blockchain?.publicKey;
    }

    async executeContractFunction(contractName, functionName, args, blockchain) {
        const web3Instance = await this.getWeb3Instance(blockchain);
        let result;
        let previousTxGasPrice;
        let transactionRetried = false;

        while (result === undefined) {
            try {
                // eslint-disable-next-line no-await-in-loop
                const contractInstance = await this.getContractInstance(contractName, blockchain);
                // eslint-disable-next-line no-await-in-loop
                const tx = await this.prepareTransaction(
                    contractInstance,
                    functionName,
                    args,
                    blockchain,
                );
                previousTxGasPrice = tx.gasPrice;
                // eslint-disable-next-line no-await-in-loop
                const createdTransaction = await web3Instance.eth.accounts.signTransaction(
                    tx,
                    blockchain.privateKey,
                );

                // eslint-disable-next-line no-await-in-loop
                result = await web3Instance.eth.sendSignedTransaction(
                    createdTransaction.rawTransaction,
                );
            } catch (error) {
                if (
                    !transactionRetried &&
                    blockchain.handleNotMinedError &&
                    TRANSACTION_RETRY_ERRORS.some((errorMsg) =>
                        error.message.toLowerCase().includes(errorMsg),
                    )
                ) {
                    transactionRetried = true;
                    // eslint-disable-next-line no-param-reassign
                    blockchain.retryTx = true;
                    // eslint-disable-next-line no-param-reassign
                    blockchain.previousTxGasPrice = previousTxGasPrice;
                } else {
                    throw error;
                }
            }
        }

        return result;
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

module.exports = NodeBlockchainService;
