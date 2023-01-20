const Web3 = require('web3');
const { BLOCKCHAINS, WEBSOCKET_PROVIDER_OPTIONS } = require('../../../constants.js');
const BlockchainServiceBase = require('../blockchain-service-base.js');

class NodeBlockchainService extends BlockchainServiceBase {
    constructor(config) {
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

    initializeWeb3(blockchainName, blockchainRpc) {
        if (blockchainRpc.startsWith('ws')) {
            const provider = new Web3.providers.WebsocketProvider(
                blockchainRpc,
                WEBSOCKET_PROVIDER_OPTIONS,
            );

            this[blockchainName].web3 = new Web3(provider);
        } else {
            this[blockchainName].web3 = new Web3(blockchainRpc);
        }
    }

    getBlockchain(options) {
        return {
            name: options.blockchain.name,
            rpc: options.blockchain.rpc ?? BLOCKCHAINS[options.blockchain.name].rpc,
            publicKey: this.config.blockchain?.publicKey ?? options.blockchain.publicKey,
            privateKey: this.config.blockchain?.privateKey ?? options.blockchain.privateKey,
        };
    }

    async executeContractFunction(contractName, functionName, args, blockchain) {
        const web3Instance = await this.getWeb3Instance(blockchain.name, blockchain.rpc);

        const contractInstance = await this.getContractInstance(
            blockchain.name,
            contractName,
            blockchain.rpc,
        );
        const tx = await this.prepareTransaction(contractInstance, functionName, args, blockchain);
        const createdTransaction = await web3Instance.eth.accounts.signTransaction(
            tx,
            blockchain.privateKey,
        );

        return web3Instance.eth.sendSignedTransaction(createdTransaction.rawTransaction);
    }

    async decodeEventLogs(receipt, eventName, blockchain) {
        const web3Instance = await this.getWeb3Instance(blockchain.name, blockchain.rpc);
        let result;
        const { hash, inputs } = this.events[eventName];
        receipt.logs.forEach((row) => {
            if (row.topics[0] === hash)
                result = web3Instance.eth.abi.decodeLog(inputs, row.data, row.topics.slice(1));
        });
        return result;
    }

    async transferAsset(tokenId, to, options) {
        const blockchain = this.getBlockchain(options);

        return this.executeContractFunction(
            'ContentAssetStorage',
            'transferFrom',
            [blockchain.publicKey, to, tokenId],
            blockchain,
        );
    }
}

module.exports = NodeBlockchainService;
