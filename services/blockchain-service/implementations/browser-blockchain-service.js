const Web3 = require('web3');
const BlockchainServiceBase = require('../blockchain-service-base.js');
const { WEBSOCKET_PROVIDER_OPTIONS } = require('../../../constants.js');

class BrowserBlockchainService extends BlockchainServiceBase {
    async initializeWeb3(blockchainName, blockchainRpc) {
        if (typeof window.web3 === 'undefined' || !window.web3) {
            console.error(
                'No web3 implementation injected, please inject your own Web3 implementation.',
            );
            return;
        }
        if (window.ethereum) {
            this[blockchainName].web3 = new Web3(window.ethereum);

            try {
                // Request account access if needed
                await window.ethereum.enable();
            } catch (error) {
                console.error(error);
            }
        } else if (blockchainRpc.startsWith('ws')) {
            const provider = new Web3().providers.WebsocketProvider(
                blockchainRpc,
                WEBSOCKET_PROVIDER_OPTIONS,
            );
            this[blockchainName].web3 = new Web3(provider);
        } else {
            this[blockchainName].web3 = new Web3(blockchainRpc);
        }
    }

    async decodeEventLogs(receipt, eventName, blockchain) {
        const web3Instance = await this.getWeb3Instance(blockchain);
        let result;
        const { hash, inputs } = this.events[eventName];
        Object.values(receipt.events).forEach((row) => {
            if (row.raw.topics[0] === hash)
                result = web3Instance.eth.abi.decodeLog(
                    inputs,
                    row.raw.data,
                    row.raw.topics.slice(1),
                );
        });
        return result;
    }

    async executeContractFunction(contractName, functionName, args, blockchain) {
        const contractInstance = await this.getContractInstance(contractName, blockchain);
        const tx = await this.prepareTransaction(contractInstance, functionName, args, blockchain);

        return contractInstance.methods[functionName](...args).send(tx);
    }

    async getPublicKey() {
        return this.getAccount();
    }

    async getAccount() {
        if (!this.account) {
            if (!window.ethereum) {
                throw Error('This operation can be performed only by using Metamask accounts.');
            }
            const accounts = await window.ethereum
                .request({
                    method: 'eth_requestAccounts',
                })
                .catch(() => console.error('There was an error fetching your accounts'));

            [this.account] = accounts;
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
