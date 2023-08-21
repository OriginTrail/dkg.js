const Web3 = require('web3');
const { WEBSOCKET_PROVIDER_OPTIONS } = require('../../../constants.js');
const BlockchainServiceBase = require('../blockchain-service-base.js');

class NodeBlockchainService extends BlockchainServiceBase {
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

    async getPublicKey(blockchain) {
        return blockchain?.publicKey;
    }

    async executeContractFunction(contractName, functionName, args, blockchain) {
        const web3Instance = await this.getWeb3Instance(blockchain);

        const contractInstance = await this.getContractInstance(contractName, blockchain);
        const tx = await this.prepareTransaction(contractInstance, functionName, args, blockchain);
        const createdTransaction = await web3Instance.eth.accounts.signTransaction(
            tx,
            blockchain.privateKey,
        );

        return web3Instance.eth.sendSignedTransaction(createdTransaction.rawTransaction);
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
