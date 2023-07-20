const ethers = require('ethers');
const BlockchainServiceBase = require('../blockchain-service-base.js');

class NodeBlockchainService extends BlockchainServiceBase {
    initializeProvider(blockchainName, blockchainRpc) {
        let provider;
        if (blockchainRpc.startsWith('ws')) {
            provider = new ethers.WebSocketProvider(blockchainRpc);
        } else {
            provider = new ethers.JsonRpcProvider(blockchainRpc);
        }
        this[blockchainName].provider = provider;
    }

    async getPublicKey(blockchain) {
        return blockchain?.publicKey;
    }

    async executeContractFunction(contractName, functionName, args, blockchain) {
        const provider = await this.getProvider(blockchain);
        let contractInstance = await this.getContractInstance(contractName, blockchain);
        const options = await this.getTransactionOptions(contractInstance, functionName, args, blockchain);
        const signer = new ethers.Wallet(blockchain.privateKey, provider);
        contractInstance = contractInstance.connect(signer);
        const tx = await contractInstance[functionName](...args, options);

        return tx.wait();
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
