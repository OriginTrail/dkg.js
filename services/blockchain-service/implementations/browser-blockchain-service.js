const ethers = require('ethers');
const BlockchainServiceBase = require('../blockchain-service-base.js');

class BrowserBlockchainService extends BlockchainServiceBase {
    initializeProvider(blockchainName, blockchainRpc) {
        if (typeof window.Web3 === 'undefined' || !window.Web3) {
            console.error(
                'No web3 implementation injected, please inject your own Web3 implementation.',
            );
            return;
        }
        if (typeof window.ethereum !== 'undefined') {
            this[blockchainName].provider = new ethers.BrowserProvider(window.ethereum);
        } else if (blockchainRpc.startsWith('ws')) {
            this[blockchainName].provider = new ethers.WebSocketProvider(blockchainRpc);
        } else {
            this[blockchainName].provider = new ethers.JsonRpcProvider(blockchainRpc);
        }
    }

    async executeContractFunction(contractName, functionName, args, blockchain) {
        const provider = await this.getProvider(blockchain);
        let contractInstance = await this.getContractInstance(contractName, blockchain);
        const options = await this.getTransactionOptions(
            contractInstance,
            functionName,
            args,
            blockchain,
        );

        const signer = await provider.getSigner();
        contractInstance = contractInstance.connect(signer);
        const tx = await contractInstance[functionName](...args, options);

        return tx.wait();
    }

    async getPublicKey(blockchain) {
        return this.getAccount(blockchain);
    }

    async getAccount(blockchain) {
        if (!this.account) {
            if (!window.ethereum) {
                throw Error('This operation can be performed only by using Metamask accounts.');
            }
            await window.ethereum
                .request({ method: 'eth_requestAccounts' })
                .catch(() => console.error('There was an error fetching your accounts'));
            const provider = await this.getProvider(blockchain);
            const signer = await provider.getSigner();
            this.account = await signer.getAddress();
        }
        return this.account;
    }

    async transferAsset(tokenId, to, blockchain) {
        return this.executeContractFunction(
            'ContentAssetStorage',
            'transferFrom',
            [await this.getAccount(blockchain), to, tokenId],
            blockchain,
        );
    }
}
module.exports = BrowserBlockchainService;
