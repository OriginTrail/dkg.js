const ethers = require('ethers');
const BlockchainServiceBase = require('../blockchain-service-base.js');

class BrowserBlockchainService extends BlockchainServiceBase {
    initializeProvider(blockchainName, blockchainRpc) {
        if (typeof window.Web3 === 'undefined' || !window.Web3) {
            this.logger.error(
                'No web3 implementation injected, please inject your own Web3 implementation.',
            );
            return;
        }
        if (typeof window.ethereum !== 'undefined') {
            this[blockchainName].provider = new ethers.Web3Provider(window.ethereum);
        } else if (blockchainRpc.startsWith('ws')) {
            this[blockchainName].provider = new ethers.WebSocketProvider(blockchainRpc);
        } else {
            this[blockchainName].provider = new ethers.JsonRpcProvider(blockchainRpc);
        }
    }

    async executeContractFunction(contractName, functionName, args, blockchain) {
        const contractInstance = await this.getContractInstance(contractName, blockchain);
        const options = await this.getTransactionOptions(contractInstance, functionName, args, {
            name: blockchain.name,
            publicKey: await this.getAccount(),
        });

        return contractInstance[functionName](...args, options);
    }

    async getAccount() {
        if (!this.account) {
            if (!window.ethereum) {
                throw Error('This operation can be performed only by using Metamask accounts.');
            }
            const signer = this.provider.getSigner();
            this.account = await signer.getAddress();
        }
        return this.account;
    }

    async transferAsset(tokenId, to, blockchain) {
        return this.executeContractFunction(
            'ContentAssetStorage',
            'transferFrom',
            [await this.getAccount(), to, tokenId],
            blockchain,
        );
    }
}
module.exports = BrowserBlockchainService;
