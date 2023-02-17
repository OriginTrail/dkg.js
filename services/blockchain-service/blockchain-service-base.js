const Web3 = require('web3');
const HubAbi = require('dkg-evm-module/build/contracts/Hub.json').abi;
const ServiceAgreementV1Abi = require('dkg-evm-module/build/contracts/ServiceAgreementV1.json').abi;
const ContentAssetStorageAbi =
    require('dkg-evm-module/build/contracts/ContentAssetStorage.json').abi;
const ContentAssetAbi = require('dkg-evm-module/build/contracts/ContentAsset.json').abi;
const TokenAbi = require('dkg-evm-module/build/contracts/ERC20Token.json').abi;
const { BLOCKCHAINS, OPERATIONS_STEP_STATUS } = require('../../constants');
const emptyHooks = require('../../util/empty-hooks.js');

const FIXED_GAS_LIMIT_METHODS = {
    createAsset: 450000,
};

class BlockchainServiceBase {
    constructor() {
        this.abis = {};
        this.abis.Hub = HubAbi;
        this.abis.ServiceAgreementV1 = ServiceAgreementV1Abi;
        this.abis.ContentAssetStorage = ContentAssetStorageAbi;
        this.abis.ContentAsset = ContentAssetAbi;
        this.abis.Token = TokenAbi;

        for (const blockchainName of Object.keys(BLOCKCHAINS)) {
            this[blockchainName] = {
                contracts: { [BLOCKCHAINS[blockchainName].hubContract]: {} },
                contractAddresses: {
                    [BLOCKCHAINS[blockchainName].hubContract]: {
                        Hub: BLOCKCHAINS[blockchainName].hubContract,
                    },
                },
            };
        }
    }

    initializeWeb3() {
        // overridden by subclasses
        return {};
    }

    async decodeEventLogs() {
        // overridden by subclasses
        return {};
    }

    async callContractFunction(contractName, functionName, args, blockchain) {
        const contractInstance = await this.getContractInstance(contractName, blockchain);

        return contractInstance.methods[functionName](...args).call();
    }

    async prepareTransaction(contractInstance, functionName, args, blockchain) {
        const web3Instance = await this.getWeb3Instance(blockchain.name, blockchain.rpc);
        let gasLimit;
        if (FIXED_GAS_LIMIT_METHODS[functionName]) {
            gasLimit = FIXED_GAS_LIMIT_METHODS[functionName];
        } else {
            gasLimit = await contractInstance.methods[functionName](...args).estimateGas({
                from: blockchain.publicKey,
            });
        }

        const encodedABI = await contractInstance.methods[functionName](...args).encodeABI();

        let gasPrice;

        if (blockchain.name.startsWith('otp')) {
            gasPrice = await web3Instance.eth.getGasPrice();
        } else {
            gasPrice = Web3.utils.toWei('100', 'Gwei');
        }

        return {
            from: blockchain.publicKey,
            to: contractInstance.options.address,
            data: encodedABI,
            gasPrice,
            gas: gasLimit,
        };
    }

    async getWeb3Instance(blockchainName, blockchainRpc) {
        if (!this[blockchainName].web3) {
            this.initializeWeb3(blockchainName, blockchainRpc);
        }

        return this[blockchainName].web3;
    }

    async getContractAddress(contractName, blockchain) {
        if (!this[blockchain.name].contracts[blockchain.hubContract]) {
            this[blockchain.name].contracts[blockchain.hubContract] = {};
        }
        if (!this[blockchain.name].contracts[blockchain.hubContract].Hub) {
            const web3Instance = await this.getWeb3Instance(blockchain.name, blockchain.rpc);
            this[blockchain.name].contracts[blockchain.hubContract].Hub =
                new web3Instance.eth.Contract(this.abis.Hub, blockchain.hubContract);
        }

        if (!this[blockchain.name].contractAddresses[blockchain.hubContract][contractName]) {
            this[blockchain.name].contractAddresses[blockchain.hubContract][contractName] =
                await this.callContractFunction(
                    'Hub',
                    contractName.includes('AssetStorage')
                        ? 'getAssetStorageAddress'
                        : 'getContractAddress',
                    [contractName],
                    blockchain,
                );
        }
        return this[blockchain.name].contractAddresses[blockchain.hubContract][contractName];
    }

    async getContractInstance(contractName, blockchain) {
        if (!this[blockchain.name].contractAddresses[blockchain.hubContract][contractName]) {
            this[blockchain.name].contractAddresses[blockchain.hubContract][contractName] =
                await this.getContractAddress(contractName, blockchain);
        }
        if (!this[blockchain.name].contracts[blockchain.hubContract][contractName]) {
            const web3Instance = await this.getWeb3Instance(blockchain.name, blockchain.rpc);
            this[blockchain.name].contracts[blockchain.hubContract][contractName] =
                new web3Instance.eth.Contract(
                    this.abis[contractName],
                    this[blockchain.name].contractAddresses[blockchain.hubContract][contractName],
                );
        }

        return this[blockchain.name].contracts[blockchain.hubContract][contractName];
    }

    async createAsset(requestData, blockchain, stepHooks = emptyHooks) {
        const serviceAgreementV1Address = await this.getContractAddress(
            'ServiceAgreementV1',
            blockchain,
        );
        await this.executeContractFunction(
            'Token',
            'increaseAllowance',
            [serviceAgreementV1Address, requestData.tokenAmount],
            blockchain,
        );

        stepHooks.afterHook({
            status: OPERATIONS_STEP_STATUS.INCREASE_ALLOWANCE_COMPLETED,
        });

        try {
            const receipt = await this.executeContractFunction(
                'ContentAsset',
                'createAsset',
                [Object.values(requestData)],
                blockchain,
            );

            let { tokenId } = await this.decodeEventLogs(receipt, 'AssetMinted', blockchain);

            tokenId = parseInt(tokenId, 10);

            stepHooks.afterHook({
                status: OPERATIONS_STEP_STATUS.CREATE_ASSET_COMPLETED,
                data: { tokenId },
            });

            return tokenId;
        } catch (e) {
            await this.executeContractFunction(
                'Token',
                'decreaseAllowance',
                [serviceAgreementV1Address, requestData.tokenAmount],
                blockchain,
            );
            throw e;
        }
    }

    async updateAsset(tokenId, requestData, blockchain) {
        const serviceAgreementV1Address = await this.getContractAddress(
            'ServiceAgreementV1',
            blockchain,
        );

        await this.executeContractFunction(
            'Token',
            'increaseAllowance',
            [serviceAgreementV1Address, requestData.tokenAmount],
            blockchain,
        );

        try {
            return this.executeContractFunction(
                'ContentAsset',
                'updateAsset',
                [tokenId, Object.values(requestData)],
                blockchain,
            );
        } catch (e) {
            await this.executeContractFunction(
                'Token',
                'decreaseAllowance',
                [serviceAgreementV1Address, requestData.tokenAmount],
                blockchain,
            );
            throw e;
        }
    }

    async getLatestAssertionId(tokenId, blockchain) {
        return this.callContractFunction(
            'ContentAssetStorage',
            'getLatestAssertionId',
            [tokenId],
            blockchain,
        );
    }

    async getAssetOwner(tokenId, blockchain) {
        return this.callContractFunction('ContentAssetStorage', 'ownerOf', [tokenId], blockchain);
    }

    convertToWei(ether) {
        return Web3.utils.toWei(ether.toString(), 'ether');
    }
}
module.exports = BlockchainServiceBase;
