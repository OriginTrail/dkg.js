const Web3 = require('web3');
const axios = require('axios');
const AssertionStorageAbi = require('dkg-evm-module/abi/AssertionStorage.json');
const HubAbi = require('dkg-evm-module/abi/Hub.json');
const ServiceAgreementV1Abi = require('dkg-evm-module/abi/ServiceAgreementV1.json');
const ServiceAgreementStorageProxyAbi = require('dkg-evm-module/abi/ServiceAgreementStorageProxy.json');
const ContentAssetStorageAbi = require('dkg-evm-module/abi/ContentAssetStorage.json');
const UnfinalizedStateStorageAbi = require('dkg-evm-module/abi/UnfinalizedStateStorage.json');
const ContentAssetAbi = require('dkg-evm-module/abi/ContentAsset.json');
const TokenAbi = require('dkg-evm-module/abi/Token.json');
const ParanetAbi = require('dkg-evm-module/abi/Paranet.json');
const { OPERATIONS_STEP_STATUS, DEFAULT_GAS_PRICE } = require('../../constants');
const emptyHooks = require('../../util/empty-hooks.js');

class BlockchainServiceBase {
    constructor(config = {}) {
        this.config = config;
        this.events = {};
        this.abis = {};
        this.abis.AssertionStorage = AssertionStorageAbi;
        this.abis.Hub = HubAbi;
        this.abis.ServiceAgreementV1 = ServiceAgreementV1Abi;
        this.abis.ServiceAgreementStorageProxy = ServiceAgreementStorageProxyAbi;
        this.abis.ContentAssetStorage = ContentAssetStorageAbi;
        this.abis.UnfinalizedStateStorage = UnfinalizedStateStorageAbi;
        this.abis.ContentAsset = ContentAssetAbi;
        this.abis.Token = TokenAbi;
        this.abis.Paranet = ParanetAbi;

        this.abis.ContentAsset.filter((obj) => obj.type === 'event').forEach((event) => {
            const concatInputs = event.inputs.map((input) => input.internalType);

            this.events[event.name] = {
                hash: Web3.utils.keccak256(`${event.name}(${concatInputs})`),
                inputs: event.inputs,
            };
        });
    }

    initializeWeb3() {
        // overridden by subclasses
        return {};
    }

    async decodeEventLogs() {
        // overridden by subclasses
    }

    async getPublicKey() {
        // overridden by subclasses
    }

    async getNetworkGasPrice(blockchain) {
        const web3Instance = await this.getWeb3Instance(blockchain);

        try {
            let gasPrice;

            if (blockchain.name.startsWith('otp')) {
                gasPrice = await web3Instance.eth.getGasPrice();
            } else if (blockchain.name.startsWith('gnosis')) {
                const response = await axios.get(blockchain.gasPriceOracleLink);
                if (blockchain.name.split(':')[1] === '100') {
                    gasPrice = Number(response.data.result, 10);
                } else if (blockchain.name.split(':')[1] === '10200') {
                    gasPrice = Math.round(response.data.average * 1e9);
                }
            } else {
                gasPrice = Web3.utils.toWei(
                    blockchain.name.startsWith('otp')
                        ? DEFAULT_GAS_PRICE.OTP
                        : DEFAULT_GAS_PRICE.GNOSIS,
                    'Gwei',
                );
            }
            return gasPrice;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(
                `Failed to fetch the gas price from the network: ${error}. Using default value: 2 Gwei.`,
            );
            return Web3.utils.toWei(
                blockchain.name.startsWith('otp')
                    ? DEFAULT_GAS_PRICE.OTP
                    : DEFAULT_GAS_PRICE.GNOSIS,
                'Gwei',
            );
        }
    }

    async callContractFunction(contractName, functionName, args, blockchain) {
        let contractInstance = await this.getContractInstance(contractName, blockchain);
        try {
            return await contractInstance.methods[functionName](...args).call();
        } catch (error) {
            if (/revert|VM Exception/i.test(error.message)) {
                let status;
                try {
                    status = await contractInstance.methods.status().call();
                } catch (_) {
                    status = false;
                }

                if (!status) {
                    await this.updateContractInstance(contractName, blockchain, true);
                    contractInstance = await this.getContractInstance(contractName, blockchain);

                    return contractInstance.methods[functionName](...args).call();
                }
            }

            throw error;
        }
    }

    async prepareTransaction(contractInstance, functionName, args, blockchain) {
        const publicKey = await this.getPublicKey(blockchain);
        const gasLimit = await contractInstance.methods[functionName](...args).estimateGas({
            from: publicKey,
        });

        const encodedABI = await contractInstance.methods[functionName](...args).encodeABI();

        let gasPrice = Number(
            blockchain.previousTxGasPrice ||
                blockchain.gasPrice ||
                (await this.getNetworkGasPrice(blockchain)),
        );

        if (blockchain.retryTx) {
            // Increase gas price by 20%
            gasPrice = Math.round(gasPrice * 1.2);
        }

        return {
            from: publicKey,
            to: contractInstance.options.address,
            data: encodedABI,
            gasPrice,
            gas: gasLimit,
        };
    }

    ensureBlockchainInfo(blockchain) {
        if (!this[blockchain.name]) {
            this[blockchain.name] = {
                contracts: { [blockchain.hubContract]: {} },
                contractAddresses: {
                    [blockchain.hubContract]: {
                        Hub: blockchain.hubContract,
                    },
                },
            };
        }
    }

    async getWeb3Instance(blockchain) {
        this.ensureBlockchainInfo(blockchain);
        if (!this[blockchain.name].web3) {
            const blockchainOptions = {
                transactionPollingTimeout: blockchain.transactionPollingTimeout,
            };
            await this.initializeWeb3(blockchain.name, blockchain.rpc, blockchainOptions);
        }

        return this[blockchain.name].web3;
    }

    async getContractAddress(contractName, blockchain, force = false) {
        this.ensureBlockchainInfo(blockchain);
        if (!this[blockchain.name].contracts[blockchain.hubContract]) {
            this[blockchain.name].contracts[blockchain.hubContract] = {};
        }
        if (!this[blockchain.name].contracts[blockchain.hubContract].Hub) {
            const web3Instance = await this.getWeb3Instance(blockchain);
            this[blockchain.name].contracts[blockchain.hubContract].Hub =
                new web3Instance.eth.Contract(this.abis.Hub, blockchain.hubContract);
        }

        if (
            force ||
            !this[blockchain.name].contractAddresses[blockchain.hubContract][contractName]
        ) {
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

    async updateContractInstance(contractName, blockchain, force = false) {
        this.ensureBlockchainInfo(blockchain);
        if (
            force ||
            !this[blockchain.name].contractAddresses[blockchain.hubContract][contractName]
        ) {
            console.log('Getting contract name');
            let contractname = await this.getContractAddress(contractName, blockchain, force);
            console.log(contractname);
            this[blockchain.name].contractAddresses[blockchain.hubContract][contractName] = contractname;

        }
        if (force || !this[blockchain.name].contracts[blockchain.hubContract][contractName]) {
            const web3Instance = await this.getWeb3Instance(blockchain);
            this[blockchain.name].contracts[blockchain.hubContract][contractName] =
                await new web3Instance.eth.Contract(
                    this.abis[contractName],
                    this[blockchain.name].contractAddresses[blockchain.hubContract][contractName],
                );
        }
    }

    async getContractInstance(contractName, blockchain) {
        await this.updateContractInstance(contractName, blockchain);
        return this[blockchain.name].contracts[blockchain.hubContract][contractName];
    }

    // Knowledge assets operations

    async createAsset(requestData, paranetKaContract, paranetTokenId, blockchain, stepHooks = emptyHooks) {
        const serviceAgreementV1Address = await this.getContractAddress(
            'ServiceAgreementV1',
            blockchain,
        );

        const allowance = await this.callContractFunction(
            'Token',
            'allowance',
            [await this.getPublicKey(blockchain), serviceAgreementV1Address],
            blockchain,
        );

        const tokensNeeded = BigInt(requestData.tokenAmount) - BigInt(allowance);

        if (tokensNeeded > 0) {
            await this.executeContractFunction(
                'Token',
                'increaseAllowance',
                [serviceAgreementV1Address, tokensNeeded],
                blockchain,
            );

            stepHooks.afterHook({
                status: OPERATIONS_STEP_STATUS.INCREASE_ALLOWANCE_COMPLETED,
            });
        }

        try {
            let receipt;
            if(paranetKaContract == null && paranetTokenId == null) {
                receipt = await this.executeContractFunction(
                    'ContentAsset',
                    'createAsset',
                    [Object.values(requestData)],
                    blockchain,
                );
            } else {
                receipt = await this.executeContractFunction(
                    'Paranet',
                    'mintKnowledgeAsset',
                    [paranetKaContract, paranetTokenId, Object.values(requestData)],
                    blockchain,
                );
            }

            let { tokenId } = await this.decodeEventLogs(receipt, 'AssetMinted', blockchain);

            tokenId = parseInt(tokenId, 10);

            stepHooks.afterHook({
                status: OPERATIONS_STEP_STATUS.CREATE_ASSET_COMPLETED,
                data: { tokenId },
            });

            return tokenId;
        } catch (error) {
            if (tokensNeeded > 0) {
                await this.executeContractFunction(
                    'Token',
                    'decreaseAllowance',
                    [serviceAgreementV1Address, tokensNeeded],
                    blockchain,
                );
            }
            throw error;
        }
    }

    async updateAsset(
        tokenId,
        publicAssertionId,
        assertionSize,
        triplesNumber,
        chunksNumber,
        tokenAmount,
        blockchain,
    ) {
        const serviceAgreementV1Address = await this.getContractAddress(
            'ServiceAgreementV1',
            blockchain,
        );

        const allowance = await this.callContractFunction(
            'Token',
            'allowance',
            [await this.getPublicKey(blockchain), serviceAgreementV1Address],
            blockchain,
        );

        const tokensNeeded = BigInt(tokenAmount) - BigInt(allowance);

        if (tokensNeeded > 0) {
            await this.executeContractFunction(
                'Token',
                'increaseAllowance',
                [serviceAgreementV1Address, tokensNeeded],
                blockchain,
            );
        }

        try {
            return this.executeContractFunction(
                'ContentAsset',
                'updateAssetState',
                [
                    tokenId,
                    publicAssertionId,
                    assertionSize,
                    triplesNumber,
                    chunksNumber,
                    tokenAmount,
                ],
                blockchain,
            );
        } catch (error) {
            if (tokensNeeded > 0) {
                await this.executeContractFunction(
                    'Token',
                    'decreaseAllowance',
                    [serviceAgreementV1Address, tokensNeeded],
                    blockchain,
                );
            }
            throw error;
        }
    }

    async hasPendingUpdate(tokenId, blockchain) {
        return this.callContractFunction(
            'UnfinalizedStateStorage',
            'hasPendingUpdate',
            [tokenId],
            blockchain,
        );
    }

    async cancelAssetUpdate(tokenId, blockchain) {
        return this.executeContractFunction(
            'ContentAsset',
            'cancelAssetStateUpdate',
            [tokenId],
            blockchain,
        );
    }

    async getLatestAssertionId(tokenId, blockchain) {
        return this.callContractFunction(
            'ContentAssetStorage',
            'getLatestAssertionId',
            [tokenId],
            blockchain,
        );
    }

    async getUnfinalizedState(tokenId, blockchain) {
        return this.callContractFunction(
            'UnfinalizedStateStorage',
            'getUnfinalizedState',
            [tokenId],
            blockchain,
        );
    }

    async getAssetOwner(tokenId, blockchain) {
        return this.callContractFunction('ContentAssetStorage', 'ownerOf', [tokenId], blockchain);
    }

    async burnAsset(tokenId, blockchain) {
        return this.executeContractFunction('ContentAsset', 'burnAsset', [tokenId], blockchain);
    }

    async extendAssetStoringPeriod(tokenId, epochsNumber, tokenAmount, blockchain) {
        const serviceAgreementV1Address = await this.getContractAddress(
            'ServiceAgreementV1',
            blockchain,
        );

        await this.executeContractFunction(
            'Token',
            'increaseAllowance',
            [serviceAgreementV1Address, tokenAmount],
            blockchain,
        );

        try {
            return this.executeContractFunction(
                'ContentAsset',
                'extendAssetStoringPeriod',
                [tokenId, epochsNumber, tokenAmount],
                blockchain,
            );
        } catch (e) {
            await this.executeContractFunction(
                'Token',
                'decreaseAllowance',
                [serviceAgreementV1Address, tokenAmount],
                blockchain,
            );
            throw e;
        }
    }

    async addTokens(tokenId, tokenAmount, blockchain) {
        const serviceAgreementV1Address = await this.getContractAddress(
            'ServiceAgreementV1',
            blockchain,
        );

        await this.executeContractFunction(
            'Token',
            'increaseAllowance',
            [serviceAgreementV1Address, tokenAmount],
            blockchain,
        );

        try {
            return this.executeContractFunction(
                'ContentAsset',
                'increaseAssetTokenAmount',
                [tokenId, tokenAmount],
                blockchain,
            );
        } catch (e) {
            await this.executeContractFunction(
                'Token',
                'decreaseAllowance',
                [serviceAgreementV1Address, tokenAmount],
                blockchain,
            );
            throw e;
        }
    }

    async addUpdateTokens(tokenId, tokenAmount, blockchain) {
        const serviceAgreementV1Address = await this.getContractAddress(
            'ServiceAgreementV1',
            blockchain,
        );

        await this.executeContractFunction(
            'Token',
            'increaseAllowance',
            [serviceAgreementV1Address, tokenAmount],
            blockchain,
        );

        try {
            return this.executeContractFunction(
                'ContentAsset',
                'increaseAssetUpdateTokenAmount',
                [tokenId, tokenAmount],
                blockchain,
            );
        } catch (e) {
            await this.executeContractFunction(
                'Token',
                'decreaseAllowance',
                [serviceAgreementV1Address, tokenAmount],
                blockchain,
            );
            throw e;
        }
    }

    async getAssertionIdByIndex(tokenId, index, blockchain) {
        return this.callContractFunction(
            'ContentAssetStorage',
            'getAssertionIdByIndex',
            [tokenId, index],
            blockchain,
        );
    }

    async getAssertionIds(tokenId, blockchain) {
        return this.callContractFunction(
            'ContentAssetStorage',
            'getAssertionIds',
            [tokenId],
            blockchain,
        );
    }

    async getAssertionIssuer(tokenId, assertionId, assertionIndex, blockchain) {
        return this.callContractFunction(
            'ContentAssetStorage',
            'getAssertionIssuer',
            [tokenId, assertionId, assertionIndex],
            blockchain,
        );
    }

    async getAgreementData(agreementId, blockchain) {
        const result = await this.callContractFunction(
            'ServiceAgreementStorageProxy',
            'getAgreementData',
            [agreementId],
            blockchain,
        );

        return {
            startTime: Number(result['0']),
            epochsNumber: Number(result['1']),
            epochLength: Number(result['2']),
            tokenAmount: result['3'][0],
            addedTokenAmount: result['3'][1],
            scoreFunctionId: result['4'][0],
            proofWindowOffsetPerc: result['4'][1],
        };
    }

    async getAssertionSize(assertionId, blockchain) {
        return this.callContractFunction(
            'AssertionStorage',
            'getAssertionSize',
            [assertionId],
            blockchain,
        );
    }

    // Paranets operations

    async registerParanet(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'registerParanet',
            Object.values(requestData),
            blockchain,
        );
    }

    // Blockchain operations

    async getChainId(blockchain) {
        const web3Instance = await this.getWeb3Instance(blockchain);

        return web3Instance.eth.getChainId();
    }

    async getBlockchainTimestamp(blockchain) {
        if (!blockchain.name.startsWith('hardhat')) return Math.floor(Date.now() / 1000);

        const latestBlock = await this.getLatestBlock(blockchain);
        return latestBlock.timestamp;
    }

    async getGasPrice(blockchain) {
        const web3Instance = await this.getWeb3Instance(blockchain);
        try {
            let gasPrice;
            if (blockchain.name.startsWith('otp')) {
                gasPrice = await web3Instance.eth.getGasPrice();
            } else if (blockchain.name.startsWith('gnosis')) {
                const response = await axios.get(blockchain.gasPriceOracleLink);
                if (blockchain.name.split(':')[1] === '100') {
                    gasPrice = Number(response.result, 10);
                } else if (blockchain.name.split(':')[1] === '10200') {
                    gasPrice = Math.round(response.data.average * 1e9);
                }
            } else {
                gasPrice = Web3.utils.toWei(
                    blockchain.name.startsWith('otp')
                        ? DEFAULT_GAS_PRICE.OTP
                        : DEFAULT_GAS_PRICE.GNOSIS,
                    'Gwei',
                );
            }
            return gasPrice;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(
                `Failed to fetch the gas price from the network: ${error}. Using default value: 2 Gwei.`,
            );
            return Web3.utils.toWei(
                blockchain.name.startsWith('otp')
                    ? DEFAULT_GAS_PRICE.OTP
                    : DEFAULT_GAS_PRICE.GNOSIS,
                'Gwei',
            );
        }
    }

    async getWalletBalances(blockchain) {
        const web3Instance = await this.getWeb3Instance(blockchain);
        const publicKey = await this.getPublicKey(blockchain);

        const blockchainTokenBalance = await web3Instance.eth.getBalance(publicKey);
        const tracBalance = await this.callContractFunction(
            'Token',
            'balanceOf',
            [await this.getPublicKey(blockchain)],
            blockchain,
        );

        return {
            blockchainToken: blockchainTokenBalance,
            trac: tracBalance,
        };
    }

    async getLatestBlock(blockchain) {
        const web3 = await this.getWeb3Instance(blockchain);
        const blockNumber = await web3.eth.getBlockNumber();

        return web3.eth.getBlock(blockNumber);
    }

    convertToWei(ether) {
        return Web3.utils.toWei(ether.toString(), 'ether');
    }
}
module.exports = BlockchainServiceBase;
