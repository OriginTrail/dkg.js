/* eslint-disable dot-notation */
/* eslint-disable no-await-in-loop */
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
const ParanetsRegistryAbi = require('dkg-evm-module/abi/ParanetsRegistry.json');
const ParanetIncentivesPoolFactoryAbi = require('dkg-evm-module/abi/ParanetIncentivesPoolFactory.json');
const ParanetNeuroIncentivesPoolAbi = require('dkg-evm-module/abi/ParanetNeuroIncentivesPool.json');
const ParanetKnowledgeMinersRegistryAbi = require('dkg-evm-module/abi/ParanetKnowledgeMinersRegistry.json');
const { OPERATIONS_STEP_STATUS, DEFAULT_GAS_PRICE } = require('../../constants');
const emptyHooks = require('../../util/empty-hooks.js');
const { sleepForMilliseconds } = require('../utilities.js');

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
        this.abis.ParanetsRegistry = ParanetsRegistryAbi;
        this.abis.ParanetIncentivesPoolFactory = ParanetIncentivesPoolFactoryAbi;
        this.abis.ParanetNeuroIncentivesPool = ParanetNeuroIncentivesPoolAbi;
        this.abis.ParanetKnowledgeMinersRegistry = ParanetKnowledgeMinersRegistryAbi;

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

    async ensureBlockchainInfo(blockchain) {
        if (!this[blockchain.name]) {
            this[blockchain.name] = {
                contracts: { [blockchain.hubContract]: {} },
                contractAddresses: {
                    [blockchain.hubContract]: {
                        Hub: blockchain.hubContract,
                    },
                },
            };

            const web3Instance = await this.getWeb3Instance(blockchain);
            this[blockchain.name].contracts[blockchain.hubContract].Hub =
                    new web3Instance.eth.Contract(this.abis.Hub, blockchain.hubContract, { from: blockchain.publicKey });
    
        }
    }

    async getWeb3Instance(blockchain) {
        if (!this[blockchain.name].web3) {
            const blockchainOptions = {
                transactionPollingTimeout: blockchain.transactionPollingTimeout,
            };
            await this.initializeWeb3(blockchain.name, blockchain.rpc, blockchainOptions);
        }

        return this[blockchain.name].web3;
    }

    async getNetworkGasPrice(blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);

        try {
            let gasPrice;

            if (blockchain.name.startsWith('otp')) {
                gasPrice = await web3Instance.eth.getGasPrice();
            } else if (blockchain.name.startsWith('base')) {
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
        await this.ensureBlockchainInfo(blockchain);
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

                if (!status && contractName !== 'ParanetNeuroIncentivesPool') {
                    await this.updateContractInstance(contractName, blockchain, true);
                    contractInstance = await this.getContractInstance(contractName, blockchain);

                    return contractInstance.methods[functionName](...args).call();
                }
            }

            throw error;
        }
    }

    async prepareTransaction(contractInstance, functionName, args, blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);
        const publicKey = await this.getPublicKey(blockchain);
        const encodedABI = await contractInstance.methods[functionName](...args).encodeABI();

        let gasLimit = Number(
            await contractInstance.methods[functionName](...args).estimateGas({
                from: publicKey,
            })
        );
        gasLimit = Math.round(gasLimit * blockchain.gasLimitMultiplier);

        let gasPrice;
        if (blockchain.previousTxGasPrice && blockchain.retryTx) {
            // Increase previous tx gas price by 20%
            gasPrice = Math.round(blockchain.previousTxGasPrice * 1.2);
        } else if (blockchain.forceReplaceTxs) {
            // Get the current transaction count (nonce) of the wallet, including pending transactions
            const currentNonce = await web3Instance.eth.getTransactionCount(publicKey, 'pending');

            // Get the transaction count of the wallet excluding pending transactions
            const confirmedNonce = await web3Instance.eth.getTransactionCount(publicKey, 'latest');

            // If there are any pending transactions
            if (currentNonce > confirmedNonce) {
                const pendingBlock = await web3Instance.eth.getBlock('pending', true);

                // Search for pending tx in the pending block
                const pendingTx = Object.values(pendingBlock.transactions).find(
                    tx => tx.from.toLowerCase() === publicKey.toLowerCase() && tx.nonce === confirmedNonce
                );

                if (pendingTx) {
                    // If found, increase gas price of pending tx by 20%
                    gasPrice = Math.round(Number(pendingTx.gasPrice) * 1.2);
                } else {
                    // If not found, use default/network gas price increased by 20%
                    // Theoretically this should never happen
                    gasPrice = Math.round((blockchain.gasPrice || (await this.getNetworkGasPrice(blockchain))) * 1.2);
                }
            }
        } else {
            gasPrice = blockchain.gasPrice || (await this.getNetworkGasPrice(blockchain));
        }

        if (blockchain.simulateTxs) {
            await web3Instance.eth.call({
                to: contractInstance.options.address,
                data: encodedABI,
                from: publicKey,
                gasPrice,
                gas: gasLimit,
            });
        }

        return {
            from: publicKey,
            to: contractInstance.options.address,
            data: encodedABI,
            gasPrice,
            gas: gasLimit,
        };
    }

    async waitForTransactionFinalization(initialReceipt, blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);

        const startTime = Date.now();
        let reminingTime = 0;
        let receipt = initialReceipt;
        let finalized = false;
      
        try {
            while (!finalized && (Date.now() - startTime + reminingTime) < blockchain.transactionFinalityMaxWaitTime) {
                try {
                    // Check if the block containing the transaction is finalized
                    const finalizedBlockNumber = (await web3Instance.eth.getBlock('finalized')).number;
                    if (finalizedBlockNumber >= receipt.blockNumber) {
                        finalized = true;
                        break;
                    } else {
                        let currentReceipt = await web3Instance.eth.getTransactionReceipt(receipt.transactionHash);
                        if (currentReceipt && currentReceipt.blockNumber === receipt.blockNumber) {
                            // Transaction is still in the same block, wait and check again
                        } else if (currentReceipt && currentReceipt.blockNumber !== receipt.blockNumber) {
                            // Transaction has been re-included in a different block
                            receipt = currentReceipt; // Update the receipt with the new block information
                        } else {
                            // Transaction is no longer mined, wait for it to be mined again
                            const reminingStartTime = Date.now();
                            while (!currentReceipt && (Date.now() - reminingStartTime) < blockchain.transactionReminingMaxWaitTime) {
                                await sleepForMilliseconds(blockchain.transactionReminingPollingInterval);
                                currentReceipt = await web3Instance.eth.getTransactionReceipt(receipt.transactionHash);
                            }
                            if (!currentReceipt) {
                                throw new Error('Transaction was not re-mined within the expected time frame.');
                            }
                            reminingTime = Date.now() - reminingStartTime;
                            receipt = currentReceipt; // Update the receipt
                        }
                        // Wait before the next check
                        await sleepForMilliseconds(blockchain.transactionFinalityPollingInterval);
                    }
                } catch (error) {
                    throw new Error(`Error during finality polling: ${error.message}`);
                }
            }
      
            if (!finalized) {
                throw new Error('Transaction was not finalized within the expected time frame.');
            }
      
            return receipt;
        } catch (error) {
            throw new Error(`Failed to wait for transaction finalization: ${error.message}`);
        }
    }

    async getContractAddress(contractName, blockchain, force = false) {
        await this.ensureBlockchainInfo(blockchain);

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
        await this.ensureBlockchainInfo(blockchain);
        await this.getContractAddress(contractName, blockchain, force);

        if (force || !this[blockchain.name].contracts[blockchain.hubContract][contractName]) {
            const web3Instance = await this.getWeb3Instance(blockchain);
            this[blockchain.name].contracts[blockchain.hubContract][contractName] =
                await new web3Instance.eth.Contract(
                    this.abis[contractName],
                    this[blockchain.name].contractAddresses[blockchain.hubContract][contractName],
                    { from: blockchain.publicKey },
                );
        }
    }

    async getContractInstance(contractName, blockchain) {
        await this.updateContractInstance(contractName, blockchain);
        return this[blockchain.name].contracts[blockchain.hubContract][contractName];
    }

    async increaseServiceAgreementV1Allowance(sender, serviceAgreementV1Address, tokenAmount, blockchain) {
        const allowance = await this.callContractFunction(
            'Token',
            'allowance',
            [sender, serviceAgreementV1Address],
            blockchain,
        );

        const allowanceGap = BigInt(tokenAmount) - BigInt(allowance);

        if (allowanceGap > 0) {
            await this.executeContractFunction(
                'Token',
                'increaseAllowance',
                [serviceAgreementV1Address, allowanceGap],
                blockchain,
            );

            return {
                allowanceIncreased: true,
                allowanceGap,
            };
        }

        return {
            allowanceIncreased: false,
            allowanceGap,
        }
    }

    // Knowledge assets operations

    async createAsset(requestData, paranetKaContract, paranetTokenId, blockchain, stepHooks = emptyHooks) {
        const sender = await this.getPublicKey(blockchain);
        let serviceAgreementV1Address;
        let allowanceIncreased = false;
        let allowanceGap = 0;

        try {
            serviceAgreementV1Address = await this.getContractAddress(
                'ServiceAgreementV1',
                blockchain,
            );

            ({ allowanceIncreased, allowanceGap } = await this.increaseServiceAgreementV1Allowance(
                sender,
                serviceAgreementV1Address,
                requestData.tokenAmount,
                blockchain
            ));

            stepHooks.afterHook({
                status: OPERATIONS_STEP_STATUS.INCREASE_ALLOWANCE_COMPLETED,
            });

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

            return { tokenId, receipt };
        } catch (error) {
            if (allowanceIncreased) {
                await this.executeContractFunction(
                    'Token',
                    'decreaseAllowance',
                    [serviceAgreementV1Address, allowanceGap],
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
        const sender = await this.getPublicKey(blockchain);
        let serviceAgreementV1Address;
        let allowanceIncreased = false;
        let allowanceGap = 0;

        try {
            serviceAgreementV1Address = await this.getContractAddress(
                'ServiceAgreementV1',
                blockchain,
            );

            ({ allowanceIncreased, allowanceGap } = await this.increaseServiceAgreementV1Allowance(
                sender,
                serviceAgreementV1Address,
                tokenAmount,
                blockchain
            ));

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
            if (allowanceIncreased) {
                await this.executeContractFunction(
                    'Token',
                    'decreaseAllowance',
                    [serviceAgreementV1Address, allowanceGap],
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
        const sender = await this.getPublicKey(blockchain);
        let serviceAgreementV1Address;
        let allowanceIncreased = false;
        let allowanceGap = 0;

        try {
            serviceAgreementV1Address = await this.getContractAddress(
                'ServiceAgreementV1',
                blockchain,
            );

            ({ allowanceIncreased, allowanceGap } = await this.increaseServiceAgreementV1Allowance(
                sender,
                serviceAgreementV1Address,
                tokenAmount,
                blockchain
            ));

            return this.executeContractFunction(
                'ContentAsset',
                'extendAssetStoringPeriod',
                [tokenId, epochsNumber, tokenAmount],
                blockchain,
            );
        } catch (error) {
            if (allowanceIncreased) {
                await this.executeContractFunction(
                    'Token',
                    'decreaseAllowance',
                    [serviceAgreementV1Address, allowanceGap],
                    blockchain,
                );
            }
            throw error;
        }
    }

    async addTokens(tokenId, tokenAmount, blockchain) {
        const sender = await this.getPublicKey(blockchain);
        let serviceAgreementV1Address;
        let allowanceIncreased = false;
        let allowanceGap = 0;

        try {
            serviceAgreementV1Address = await this.getContractAddress(
                'ServiceAgreementV1',
                blockchain,
            );

            ({ allowanceIncreased, allowanceGap } = await this.increaseServiceAgreementV1Allowance(
                sender,
                serviceAgreementV1Address,
                tokenAmount,
                blockchain
            ));

            return this.executeContractFunction(
                'ContentAsset',
                'increaseAssetTokenAmount',
                [tokenId, tokenAmount],
                blockchain,
            );
        } catch (error) {
            if (allowanceIncreased) {
                await this.executeContractFunction(
                    'Token',
                    'decreaseAllowance',
                    [serviceAgreementV1Address, allowanceGap],
                    blockchain,
                );
            }
            throw error;
        }
    }

    async addUpdateTokens(tokenId, tokenAmount, blockchain) {
        const sender = await this.getPublicKey(blockchain);
        let serviceAgreementV1Address;
        let allowanceIncreased = false;
        let allowanceGap = 0;

        try {
            serviceAgreementV1Address = await this.getContractAddress(
                'ServiceAgreementV1',
                blockchain,
            );

            ({ allowanceIncreased, allowanceGap } = await this.increaseServiceAgreementV1Allowance(
                sender,
                serviceAgreementV1Address,
                tokenAmount,
                blockchain
            ));

            return this.executeContractFunction(
                'ContentAsset',
                'increaseAssetUpdateTokenAmount',
                [tokenId, tokenAmount],
                blockchain,
            );
        } catch (error) {
            if (allowanceIncreased) {
                await this.executeContractFunction(
                    'Token',
                    'decreaseAllowance',
                    [serviceAgreementV1Address, allowanceGap],
                    blockchain,
                );
            }
            throw error;
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

    async deployNeuroIncentivesPool(requestData, blockchain) {
        return this.executeContractFunction(
            'ParanetIncentivesPoolFactory',
            'deployNeuroIncentivesPool',
            Object.values(requestData),
            blockchain,
        );
    }

    async registerParanetService(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'registerParanetService',
            Object.values(requestData),
            blockchain,
        );
    }

    async addParanetServices(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'addParanetServices',
            Object.values(requestData),
            blockchain,
        );
    }

    async submitToParanet(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'submitKnowledgeAsset',
            Object.values(requestData),
            blockchain,
        );
    }

    async getUpdatingKnowledgeAssetStates(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetKnowledgeMinersRegistry',
            'getUpdatingKnowledgeAssetStates',
            Object.values(requestData),
            blockchain,
        );
    }

    async updateClaimableRewards(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'processUpdatedKnowledgeAssetStatesMetadata',
            Object.values(requestData),
            blockchain,
        );
    }

    async getIncentivesPoolAddress(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetsRegistry',
            'getIncentivesPoolAddress',
            Object.values(requestData),
            blockchain,
        );
    }

    async getNeuroIncentivesPoolAddress(paranetId,blockchain) {
        return this.getIncentivesPoolAddress(
            {
                paranetId,
                incentivesPoolType: 'Neuroweb',
            },
            blockchain
        )
    }

    async setIncentivesPool(contractAddress, blockchain){
        await this.ensureBlockchainInfo(blockchain);

        if (this[blockchain.name].contractAddresses[blockchain.hubContract]['ParanetNeuroIncentivesPool'] !== contractAddress) {
            this[blockchain.name].contractAddresses[blockchain.hubContract]['ParanetNeuroIncentivesPool'] = contractAddress;
            const web3Instance = await this.getWeb3Instance(blockchain);
            this[blockchain.name].contracts[blockchain.hubContract]['ParanetNeuroIncentivesPool'] =
                await new web3Instance.eth.Contract(
                    this.abis['ParanetNeuroIncentivesPool'],
                    this[blockchain.name].contractAddresses[blockchain.hubContract]['ParanetNeuroIncentivesPool'],
                    { from: blockchain.publicKey },
                );
        }
    }

    async claimKnowledgeMinerReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(paranetId, blockchain);

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.executeContractFunction(
            'ParanetNeuroIncentivesPool',
            'claimKnowledgeMinerReward',
            [],
            blockchain,
        );
    }

    async claimVoterReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(paranetId, blockchain);

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.executeContractFunction(
            'ParanetNeuroIncentivesPool',
            'claimIncentivizationProposalVoterReward',
            [],
            blockchain,
        );
    }

    async claimOperatorReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(paranetId, blockchain);

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.executeContractFunction(
            'ParanetNeuroIncentivesPool',
            'claimParanetOperatorReward',
            [],
            blockchain,
        );
    }

    async getClaimableKnowledgeMinerReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(paranetId, blockchain);

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'getClaimableKnowledgeMinerRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableAllKnowledgeMinersReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(paranetId, blockchain);

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'getClaimableAllKnowledgeMinersRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableVoterReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(paranetId, blockchain);

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'getClaimableProposalVoterRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableAllVotersReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(paranetId, blockchain);

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'getClaimableAllProposalVotersRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableOperatorReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(paranetId, blockchain);

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'getClaimableParanetOperatorRewardAmount',
            [],
            blockchain,
        );
    }

    async isParanetKnowledgeMiner(address ,paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(paranetId, blockchain);

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'isKnowledgeMiner',
            [address],
            blockchain,
        );
    }

    async isParanetOperator(address ,paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(paranetId, blockchain);

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'isParanetOperator',
            [address],
            blockchain,
        );
    }

    async isParanetProposalVoter(address ,paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(paranetId, blockchain);

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'isProposalVoter',
            [address],
            blockchain,
        );
    }

    // Blockchain operations

    async getChainId(blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);

        return web3Instance.eth.getChainId();
    }

    async getBlockchainTimestamp(blockchain) {
        if (!blockchain.name.startsWith('hardhat')) return Math.floor(Date.now() / 1000);

        const latestBlock = await this.getLatestBlock(blockchain);
        return latestBlock.timestamp;
    }

    async getGasPrice(blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);
        try {
            let gasPrice;
            if (blockchain.name.startsWith('otp') || blockchain.name.startsWith('base')) {
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
        await this.ensureBlockchainInfo(blockchain);
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
        await this.ensureBlockchainInfo(blockchain);
        const web3 = await this.getWeb3Instance(blockchain);
        const blockNumber = await web3.eth.getBlockNumber();

        return web3.eth.getBlock(blockNumber);
    }

    convertToWei(ether) {
        return Web3.utils.toWei(ether.toString(), 'ether');
    }
}
module.exports = BlockchainServiceBase;
