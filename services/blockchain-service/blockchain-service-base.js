/* eslint-disable dot-notation */
/* eslint-disable no-await-in-loop */
import Web3 from 'web3';
import axios from 'axios';
import { solidityPackedKeccak256 } from 'ethers';
import { createRequire } from 'module';
import {
    OPERATIONS_STEP_STATUS,
    DEFAULT_GAS_PRICE,
    ZERO_ADDRESS,
    NEUROWEB_INCENTIVE_TYPE_CHAINS,
    FEE_HISTORY_BLOCK_COUNT,
    GAS_MODES,
    DEFAULT_PARAMETERS,
} from '../../constants/constants.js';
import emptyHooks from '../../util/empty-hooks.js';
import { sleepForMilliseconds } from '../utilities.js';

const require = createRequire(import.meta.url);

const HubAbi = require('dkg-evm-module/abi/Hub.json');
const TokenAbi = require('dkg-evm-module/abi/Token.json');
const ParanetAbi = require('dkg-evm-module/abi/Paranet.json');
const ParanetsRegistryAbi = require('dkg-evm-module/abi/ParanetsRegistry.json');
const ParanetIncentivesPoolFactoryAbi = require('dkg-evm-module/abi/ParanetIncentivesPoolFactory.json');
const ParanetIncentivesPoolAbi = require('dkg-evm-module/abi/ParanetIncentivesPool.json');
const ParanetIncentivesPoolStorageAbi = require('dkg-evm-module/abi/ParanetIncentivesPoolStorage.json');
const ParanetKnowledgeMinersRegistryAbi = require('dkg-evm-module/abi/ParanetKnowledgeMinersRegistry.json');
const ParanetStagingRegistryAbi = require('dkg-evm-module/abi/ParanetStagingRegistry.json');
const IdentityStorageAbi = require('dkg-evm-module/abi/IdentityStorage.json');
const KnowledgeCollectionAbi = require('dkg-evm-module/abi/KnowledgeCollection.json');
const KnowledgeCollectionStorageAbi = require('dkg-evm-module/abi/KnowledgeCollectionStorage.json');
const AskStorageAbi = require('dkg-evm-module/abi/AskStorage.json');
const ChronosAbi = require('dkg-evm-module/abi/Chronos.json');
const IERC20ExtendedAbi = require('dkg-evm-module/abi/IERC20Extended.json');

export default class BlockchainServiceBase {
    constructor(config = {}) {
        this.config = config;
        this.events = {};
        this.abis = {};
        this.abis.Hub = HubAbi;
        this.abis.Token = TokenAbi;
        this.abis.Paranet = ParanetAbi;
        this.abis.ParanetsRegistry = ParanetsRegistryAbi;
        this.abis.ParanetIncentivesPoolFactory = ParanetIncentivesPoolFactoryAbi;
        this.abis.ParanetIncentivesPool = ParanetIncentivesPoolAbi;
        this.abis.ParanetIncentivesPoolStorage = ParanetIncentivesPoolStorageAbi;
        this.abis.ParanetKnowledgeMinersRegistry = ParanetKnowledgeMinersRegistryAbi;
        this.abis.IdentityStorage = IdentityStorageAbi;
        this.abis.KnowledgeCollection = KnowledgeCollectionAbi;
        this.abis.KnowledgeCollectionStorage = KnowledgeCollectionStorageAbi;
        this.abis.AskStorage = AskStorageAbi;
        this.abis.Chronos = ChronosAbi;
        this.abis.ParanetStagingRegistry = ParanetStagingRegistryAbi;
        this.abis.IERC20Extended = IERC20ExtendedAbi;
        this.abis.KnowledgeCollectionStorage.filter((obj) => obj.type === 'event').forEach(
            (event) => {
                const concatInputs = event.inputs.map((input) => input.internalType);

                this.events[event.name] = {
                    hash: Web3.utils.keccak256(`${event.name}(${concatInputs})`),
                    inputs: event.inputs,
                };
            },
        );
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
                new web3Instance.eth.Contract(this.abis.Hub, blockchain.hubContract, {
                    from: blockchain.publicKey,
                });
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
            if (this.isOtpOrBase(blockchain.name)) {
                return await web3Instance.eth.getGasPrice();
            }

            return this.getDefaultGasPrice(blockchain.name);
        } catch (error) {
            console.warn(
                `Failed to fetch the gas price from the network: ${error}. Using default value.`,
            );
            return this.getDefaultGasPrice(blockchain.name);
        }
    }

    isOtpOrBase(name) {
        return name.startsWith('otp') || name.startsWith('base');
    }

    isGnosis(name) {
        return name.startsWith('gnosis');
    }

    getDefaultGasPrice(name) {
        let defaultGasPrice;
        if (name.startsWith('otp')) {
            defaultGasPrice = DEFAULT_GAS_PRICE.OTP;
        } else if (name.startsWith('base')) {
            defaultGasPrice = DEFAULT_GAS_PRICE.BASE;
        } else {
            defaultGasPrice = DEFAULT_GAS_PRICE.GNOSIS;
        }
        return Web3.utils.toWei(defaultGasPrice, 'Gwei');
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

                if (!status && contractName !== 'ParanetIncentivesPool') {
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
            }),
        );
        gasLimit = Math.round(gasLimit * blockchain.gasLimitMultiplier);

        // Retry bumping is disabled by default. If you want to re-enable it, consider bumping
        // legacy gasPrice or EIP-1559 maxFeePerGas/maxPriorityFeePerGas with retryTxGasPriceMultiplier.
        // Example (legacy-only):
        // let gasPrice;
        // if (blockchain.previousTxGasPrice && blockchain.retryTx) {
        //     gasPrice = Math.round(blockchain.previousTxGasPrice * blockchain.retryTxGasPriceMultiplier);
        // } else if (blockchain.forceReplaceTxs) {
        //     const currentNonce = await web3Instance.eth.getTransactionCount(publicKey, 'pending');
        //     const confirmedNonce = await web3Instance.eth.getTransactionCount(publicKey, 'latest');
        //     if (currentNonce > confirmedNonce) {
        //         const pendingBlock = await web3Instance.eth.getBlock('pending', true);
        //         const pendingTx = Object.values(pendingBlock.transactions).find(
        //             (tx) => tx.from.toLowerCase() === publicKey.toLowerCase() && tx.nonce === confirmedNonce,
        //         );
        //         if (pendingTx) {
        //             gasPrice = Math.round(Number(pendingTx.gasPrice) * blockchain.retryTxGasPriceMultiplier);
        //         } else {
        //             gasPrice = Math.round(
        //                 (blockchain.gasPrice || (await this.getGasPriceWeiWithFallback(blockchain))) *
        //                     blockchain.retryTxGasPriceMultiplier,
        //             );
        //         }
        //     } else {
        //         gasPrice = blockchain.gasPrice || (await this.getGasPriceWeiWithFallback(blockchain));
        //     }
        // } else {
        //     gasPrice = blockchain.gasPrice || (await this.getGasPriceWeiWithFallback(blockchain));
        // }

        const gasFeeOptions = await this.getGasFeeOptions(blockchain);

        if (blockchain.simulateTxs) {
            const simulationTx = {
                to: contractInstance.options.address,
                data: encodedABI,
                from: publicKey,
                gas: gasLimit,
            };

            if (gasFeeOptions.type === GAS_MODES.EIP1559) {
                simulationTx.maxFeePerGas = gasFeeOptions.maxFeePerGas;
                simulationTx.maxPriorityFeePerGas = gasFeeOptions.maxPriorityFeePerGas;
            } else {
                simulationTx.gasPrice = gasFeeOptions.gasPrice;
            }

            await web3Instance.eth.call(simulationTx);
        }

        return {
            from: publicKey,
            to: contractInstance.options.address,
            data: encodedABI,
            gas: gasLimit,
            ...(gasFeeOptions.type === GAS_MODES.EIP1559
                ? {
                      maxFeePerGas: gasFeeOptions.maxFeePerGas,
                      maxPriorityFeePerGas: gasFeeOptions.maxPriorityFeePerGas,
                  }
                : { gasPrice: gasFeeOptions.gasPrice }),
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
            while (
                !finalized &&
                Date.now() - startTime + reminingTime < blockchain.transactionFinalityMaxWaitTime
            ) {
                try {
                    // Check if the block containing the transaction is finalized
                    const finalizedBlockNumber = (await web3Instance.eth.getBlock('finalized'))
                        .number;
                    if (finalizedBlockNumber >= receipt.blockNumber) {
                        finalized = true;
                        break;
                    } else {
                        let currentReceipt = await web3Instance.eth.getTransactionReceipt(
                            receipt.transactionHash,
                        );
                        if (currentReceipt && currentReceipt.blockNumber === receipt.blockNumber) {
                            // Transaction is still in the same block, wait and check again
                        } else if (
                            currentReceipt &&
                            currentReceipt.blockNumber !== receipt.blockNumber
                        ) {
                            // Transaction has been re-included in a different block
                            receipt = currentReceipt; // Update the receipt with the new block information
                        } else {
                            // Transaction is no longer mined, wait for it to be mined again
                            const reminingStartTime = Date.now();
                            while (
                                !currentReceipt &&
                                Date.now() - reminingStartTime <
                                    blockchain.transactionReminingMaxWaitTime
                            ) {
                                await sleepForMilliseconds(
                                    blockchain.transactionReminingPollingInterval,
                                );
                                currentReceipt = await web3Instance.eth.getTransactionReceipt(
                                    receipt.transactionHash,
                                );
                            }
                            if (!currentReceipt) {
                                throw new Error(
                                    'Transaction was not re-mined within the expected time frame.',
                                );
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
                try {
                    const lastReceipt = await web3Instance.eth.getTransactionReceipt(
                        receipt.transactionHash,
                    );
                    if (lastReceipt) {
                        const finalizedBlock = await web3Instance.eth.getBlock('finalized');
                        if (finalizedBlock && finalizedBlock.number >= lastReceipt.blockNumber) {
                            return lastReceipt;
                        }
                    }
                } catch (_finalCheck) {
                    // Final receipt check failed; throw the original timeout error
                }
                throw new Error('Transaction was not finalized within the expected time frame.');
            }

            return receipt;
        } catch (error) {
            throw new Error(`Failed to wait for transaction finalization: ${error.message}`);
        }
    }

    async waitForEventFinality(
        initialReceipt,
        eventName,
        expectedEventId,
        blockchain,
        confirmations = 1,
    ) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);

        // Guaranteed to be defined for OTP chains
        const polling = blockchain.transactionFinalityPollingInterval;
        const reminingPollingInterval = blockchain.transactionReminingPollingInterval;

        let receipt = initialReceipt;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            // 1. Wait until the block containing the tx is at the required depth
            while (
                (await web3Instance.eth.getBlockNumber()) <
                receipt.blockNumber + confirmations
            ) {
                await sleepForMilliseconds(polling);
            }

            // 2. Verify the tx is still in that block
            const block = await web3Instance.eth.getBlock(receipt.blockNumber, true);

            const txStillIncluded =
                block &&
                block.transactions.some(
                    (tx) => tx.hash.toLowerCase() === receipt.transactionHash.toLowerCase(),
                );

            if (txStillIncluded) {
                const currentReceipt = await web3Instance.eth.getTransactionReceipt(
                    receipt.transactionHash,
                );

                const eventData = await this.decodeEventLogs(currentReceipt, eventName, blockchain);

                const idMatches =
                    expectedEventId == null ||
                    (eventData &&
                        eventData.id != null &&
                        eventData.id.toString() === expectedEventId.toString());

                if (eventData && idMatches) {
                    return { receipt: currentReceipt, eventData };
                }
            }

            // 3. Re-org detected: wait for tx to appear again
            const timeoutMs = 60 * 1000; // 1 minute
            const startTime = Date.now();
            let newReceipt = null;
            // eslint-disable-next-line no-await-in-loop
            while (!newReceipt) {
                if (Date.now() - startTime >= timeoutMs) {
                    throw new Error(
                        `Timeout: Transaction receipt for ${receipt.transactionHash} not found after 1 minute of re-mining polling.`,
                    );
                }
                await sleepForMilliseconds(reminingPollingInterval);
                newReceipt = await web3Instance.eth.getTransactionReceipt(receipt.transactionHash);
            }
            receipt = newReceipt;
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
                    contractName.includes('AssetStorage') ||
                        contractName.includes('CollectionStorage')
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

    async decreaseKnowledgeCollectionAllowance(allowanceGap, blockchain) {
        const knowledgeCollectionAddress = await this.getContractAddress(
            'KnowledgeCollection',
            blockchain,
        );

        await this.executeContractFunction(
            'Token',
            'decreaseAllowance',
            [knowledgeCollectionAddress, allowanceGap],
            blockchain,
        );
    }

    async needsMoreAllowance(sender, tokenAmount, blockchain, knowledgeCollectionAddress) {
        const allowance = await this.callContractFunction(
            'Token',
            'allowance',
            [sender, knowledgeCollectionAddress],
            blockchain,
        );

        if (BigInt(allowance) < BigInt(tokenAmount)) return true;

        return false;
    }

    async maxAllowancePerTransaction(sender, blockchain) {
        if (blockchain.maxAllowance) {
            return blockchain.maxAllowance;
        } else {
            return await this.callContractFunction('Token', 'balanceOf', [sender], blockchain);
        }
    }

    async increaseKnowledgeCollectionAllowance(sender, tokenAmount, blockchain) {
        const knowledgeCollectionAddress = await this.getContractAddress(
            'KnowledgeCollection',
            blockchain,
        );

        const needsMoreAllowance = await this.needsMoreAllowance(
            sender,
            tokenAmount,
            blockchain,
            knowledgeCollectionAddress,
        );

        if (needsMoreAllowance) {
            const allowanceThreshold = await this.maxAllowancePerTransaction(sender, blockchain);
            await this.executeContractFunction(
                'Token',
                'approve',
                [knowledgeCollectionAddress, allowanceThreshold],
                blockchain,
            );
        }
    }

    // Knowledge assets operations

    async createKnowledgeCollection(
        requestData,
        paranetKaContract,
        paranetTokenId,
        blockchain,
        stepHooks = emptyHooks,
    ) {
        const sender = await this.getPublicKey(blockchain);

        try {
            if (requestData?.paymaster && requestData?.paymaster !== ZERO_ADDRESS) {
                // Handle the case when payer is passed
            } else {
                const senderBalance = await this.callContractFunction(
                    'Token',
                    'balanceOf',
                    [sender],
                    blockchain,
                );

                if (BigInt(senderBalance) < BigInt(requestData.tokenAmount)) {
                    const balance = Number(senderBalance) / 1e18;
                    const required = Number(requestData.tokenAmount) / 1e18;

                    throw new Error(
                        `Insufficient TRAC token balance to publish. ` +
                            `Wallet ${sender} has ${balance} TRAC, ` +
                            `but the publish operation requires ${required} TRAC. ` +
                            `Please fund your wallet with more TRAC tokens to proceed.`,
                    );
                }

                await this.increaseKnowledgeCollectionAllowance(
                    sender,
                    requestData.tokenAmount,
                    blockchain,
                );
            }

            stepHooks.afterHook({
                status: OPERATIONS_STEP_STATUS.INCREASE_ALLOWANCE_COMPLETED,
            });

            let receipt;
            if (paranetKaContract == null && paranetTokenId == null) {
                receipt = await this.executeContractFunction(
                    'KnowledgeCollection',
                    'createKnowledgeCollection',
                    [...Object.values(requestData)],
                    blockchain,
                );
            } else {
                receipt = await this.executeContractFunction(
                    'Paranet',
                    'mintKnowledgeCollection',
                    [paranetKaContract, paranetTokenId, Object.values(requestData)],
                    blockchain,
                );
            }

            if (receipt == null) {
                throw new Error(
                    'Transaction returned a null receipt. The RPC may be unreliable.',
                );
            }

            let { id } = await this.decodeEventLogs(
                receipt,
                'KnowledgeCollectionCreated',
                blockchain,
            );

            id = parseInt(id, 10);

            stepHooks.afterHook({
                status: OPERATIONS_STEP_STATUS.CREATE_ASSET_COMPLETED,
                data: { id },
            });

            return { knowledgeCollectionId: id, receipt };
        } catch (error) {
            console.error('createKnowledgeCollection failed:', error);
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

    // async extendAssetStoringPeriod(tokenId, epochsNumber, tokenAmount, blockchain) {
    //     const sender = await this.getPublicKey(blockchain);
    //     let serviceAgreementV1Address;
    //     let allowanceIncreased = false;
    //     let allowanceGap = 0;

    //     try {
    //         serviceAgreementV1Address = await this.getContractAddress(
    //             'ServiceAgreementV1',
    //             blockchain,
    //         );

    //         ({ allowanceIncreased, allowanceGap } = await this.increaseServiceAgreementV1Allowance(
    //             sender,
    //             serviceAgreementV1Address,
    //             tokenAmount,
    //             blockchain,
    //         ));

    //         return this.executeContractFunction(
    //             'ContentAsset',
    //             'extendAssetStoringPeriod',
    //             [tokenId, epochsNumber, tokenAmount],
    //             blockchain,
    //         );
    //     } catch (error) {
    //         if (allowanceIncreased) {
    //             await this.executeContractFunction(
    //                 'Token',
    //                 'decreaseAllowance',
    //                 [serviceAgreementV1Address, allowanceGap],
    //                 blockchain,
    //             );
    //         }
    //         throw error;
    //     }
    // }

    // async addTokens(tokenId, tokenAmount, blockchain) {
    //     const sender = await this.getPublicKey(blockchain);
    //     let serviceAgreementV1Address;
    //     let allowanceIncreased = false;
    //     let allowanceGap = 0;

    //     try {
    //         serviceAgreementV1Address = await this.getContractAddress(
    //             'ServiceAgreementV1',
    //             blockchain,
    //         );

    //         ({ allowanceIncreased, allowanceGap } = await this.increaseServiceAgreementV1Allowance(
    //             sender,
    //             serviceAgreementV1Address,
    //             tokenAmount,
    //             blockchain,
    //         ));

    //         return this.executeContractFunction(
    //             'ContentAsset',
    //             'increaseAssetTokenAmount',
    //             [tokenId, tokenAmount],
    //             blockchain,
    //         );
    //     } catch (error) {
    //         if (allowanceIncreased) {
    //             await this.executeContractFunction(
    //                 'Token',
    //                 'decreaseAllowance',
    //                 [serviceAgreementV1Address, allowanceGap],
    //                 blockchain,
    //             );
    //         }
    //         throw error;
    //     }
    // }

    // async addUpdateTokens(tokenId, tokenAmount, blockchain) {
    //     const sender = await this.getPublicKey(blockchain);
    //     let serviceAgreementV1Address;
    //     let allowanceIncreased = false;
    //     let allowanceGap = 0;

    //     try {
    //         serviceAgreementV1Address = await this.getContractAddress(
    //             'ServiceAgreementV1',
    //             blockchain,
    //         );

    //         ({ allowanceIncreased, allowanceGap } = await this.increaseServiceAgreementV1Allowance(
    //             sender,
    //             serviceAgreementV1Address,
    //             tokenAmount,
    //             blockchain,
    //         ));

    //         return this.executeContractFunction(
    //             'ContentAsset',
    //             'increaseAssetUpdateTokenAmount',
    //             [tokenId, tokenAmount],
    //             blockchain,
    //         );
    //     } catch (error) {
    //         if (allowanceIncreased) {
    //             await this.executeContractFunction(
    //                 'Token',
    //                 'decreaseAllowance',
    //                 [serviceAgreementV1Address, allowanceGap],
    //                 blockchain,
    //             );
    //         }
    //         throw error;
    //     }
    // }

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

    async isKnowledgeCollectionRegistered(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetsRegistry',
            'isKnowledgeCollectionRegistered',
            Object.values(requestData),
            blockchain,
        );
    }

    async addCurator(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'addCurator',
            Object.values(requestData),
            blockchain,
        );
    }

    async stageKnowledgeCollection(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'stageKnowledgeCollection',
            Object.values(requestData),
            blockchain,
        );
    }

    async reviewKnowledgeCollection(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'reviewKnowledgeCollection',
            Object.values(requestData),
            blockchain,
        );
    }

    async isKnowledgeCollectionStaged(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetStagingRegistry',
            'isKnowledgeCollectionStaged',
            Object.values(requestData),
            blockchain,
        );
    }

    async isKnowledgeCollectionApproved(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetStagingRegistry',
            'isKnowledgeCollectionApproved',
            Object.values(requestData),
            blockchain,
        );
    }

    async getKnowledgeCollectionApprovalStatus(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetStagingRegistry',
            'getKnowledgeCollectionStatus',
            Object.values(requestData),
            blockchain,
        );
    }

    async removeCurator(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'removeCurator',
            Object.values(requestData),
            blockchain,
        );
    }

    async addParanetPermissionedNodes(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'addParanetPermissionedNodes',
            Object.values(requestData),
            blockchain,
        );
    }

    async removeParanetPermissionedNodes(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'removeParanetPermissionedNodes',
            Object.values(requestData),
            blockchain,
        );
    }

    async requestParanetPermissionedNodeAccess(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'requestParanetPermissionedNodeAccess',
            Object.values(requestData),
            blockchain,
        );
    }

    async approvePermissionedNode(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'approvePermissionedNode',
            Object.values(requestData),
            blockchain,
        );
    }

    async rejectPermissionedNode(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'rejectPermissionedNode',
            Object.values(requestData),
            blockchain,
        );
    }

    async getPermissionedNodes(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetsRegistry',
            'getPermissionedNodes',
            Object.values(requestData),
            blockchain,
        );
    }

    async getKnowledgeMiners(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetsRegistry',
            'getKnowledgeMiners',
            Object.values(requestData),
            blockchain,
        );
    }

    async addParanetPermissionedMiners(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'addParanetPermissionedMiners',
            Object.values(requestData),
            blockchain,
        );
    }

    async removeParanetPermissionedMiners(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'removeParanetPermissionedMiners',
            Object.values(requestData),
            blockchain,
        );
    }

    async requestParanetPermissionedMinerAccess(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'requestParanetPermissionedMinerAccess',
            Object.values(requestData),
            blockchain,
        );
    }

    async approvePermissionedMiner(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'approvePermissionedMiner',
            Object.values(requestData),
            blockchain,
        );
    }

    async rejectPermissionedMiner(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'rejectPermissionedMiner',
            Object.values(requestData),
            blockchain,
        );
    }

    async deployIncentivesPool(requestData, blockchain) {
        return this.executeContractFunction(
            'ParanetIncentivesPoolFactory',
            'deployIncentivesPool',
            Object.values(requestData),
            blockchain,
        );
    }

    async redeployIncentivesPool(requestData, blockchain) {
        return this.executeContractFunction(
            'ParanetIncentivesPoolFactory',
            'redeployIncentivesPool',
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
            'submitKnowledgeCollection',
            Object.values(requestData),
            blockchain,
        );
    }

    async getUpdatingKnowledgeAssetStates(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetKnowledgeMinersRegistry',
            'getUpdatingKnowledgeCollectionStates',
            Object.values(requestData),
            blockchain,
        );
    }

    // async updateClaimableRewards(requestData, blockchain) {
    //     return this.executeContractFunction(
    //         'Paranet',
    //         'processUpdatedKnowledgeCollectionStatesMetadata',
    //         Object.values(requestData),
    //         blockchain,
    //     );
    // }

    async getParanetIncentivesPoolAddress(blockchain) {
        return this.callContractFunction(
            'ParanetIncentivesPoolStorage',
            'paranetIncentivesPoolAddress',
            [],
            blockchain,
        );
    }

    async getIncentivesPoolByPoolName(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetsRegistry',
            'getIncentivesPoolByPoolName',
            Object.values(requestData),
            blockchain,
        );
    }

    async getIncentivesPoolByStorageAddress(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetsRegistry',
            'getIncentivesPoolByStorageAddress',
            Object.values(requestData),
            blockchain,
        );
    }

    async getAllIncentivesPools(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetsRegistry',
            'getAllIncentivesPools',
            Object.values(requestData),
            blockchain,
        );
    }

    async setIncentivesPoolStorage(contractAddress, blockchain) {
        await this.ensureBlockchainInfo(blockchain);

        if (
            this[blockchain.name].contractAddresses[blockchain.hubContract][
                'ParanetIncentivesPoolStorage'
            ] !== contractAddress
        ) {
            this[blockchain.name].contractAddresses[blockchain.hubContract][
                'ParanetIncentivesPoolStorage'
            ] = contractAddress;
            const web3Instance = await this.getWeb3Instance(blockchain);
            this[blockchain.name].contracts[blockchain.hubContract][
                'ParanetIncentivesPoolStorage'
            ] = await new web3Instance.eth.Contract(
                this.abis['ParanetIncentivesPoolStorage'],
                this[blockchain.name].contractAddresses[blockchain.hubContract][
                    'ParanetIncentivesPoolStorage'
                ],
                { from: blockchain.publicKey },
            );
        }
    }

    async getIncentivesPoolAddress(paranetId, blockchain, options = {}) {
        const { incentivesPoolName } = options;
        let { incentivesPoolStorageAddress } = options;

        if (!incentivesPoolStorageAddress && !incentivesPoolName) {
            throw new Error(
                'Either incentivesPoolName or incentivesPoolStorageAddress must be provided to get the incentives pool address.',
            );
        }

        // If storage address is not provided, get it from pool name
        if (!incentivesPoolStorageAddress) {
            const incentivesPool = await this.getIncentivesPoolByPoolName(
                { paranetId, incentivesPoolName },
                blockchain,
            );
            incentivesPoolStorageAddress = incentivesPool.storageAddr;
        }

        await this.setIncentivesPoolStorage(incentivesPoolStorageAddress, blockchain);
        return await this.getParanetIncentivesPoolAddress(blockchain);
    }

    async setIncentivesPool(contractAddress, blockchain) {
        await this.ensureBlockchainInfo(blockchain);

        if (
            this[blockchain.name].contractAddresses[blockchain.hubContract][
                'ParanetIncentivesPool'
            ] !== contractAddress
        ) {
            this[blockchain.name].contractAddresses[blockchain.hubContract][
                'ParanetIncentivesPool'
            ] = contractAddress;
            const web3Instance = await this.getWeb3Instance(blockchain);
            this[blockchain.name].contracts[blockchain.hubContract]['ParanetIncentivesPool'] =
                await new web3Instance.eth.Contract(
                    this.abis['ParanetIncentivesPool'],
                    this[blockchain.name].contractAddresses[blockchain.hubContract][
                        'ParanetIncentivesPool'
                    ],
                    { from: blockchain.publicKey },
                );
        }
    }

    async getIncentivesPoolStorageAddress(paranetId, blockchain, options = {}) {
        let { incentivesPoolAddress } = options;
        const { incentivesPoolName } = options;

        if (!incentivesPoolAddress) {
            const incentivesPool = await this.getIncentivesPoolByPoolName(
                { paranetId, incentivesPoolName },
                blockchain,
            );
            return incentivesPool.storageAddr;
        }

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
            'paranetIncentivesPoolStorage',
            [],
            blockchain,
        );
    }

    async claimKnowledgeMinerReward(paranetId, amount, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.executeContractFunction(
            'ParanetIncentivesPool',
            'claimKnowledgeMinerReward',
            [amount],
            blockchain,
        );
    }

    async claimVoterReward(paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.executeContractFunction(
            'ParanetIncentivesPool',
            'claimIncentivizationProposalVoterReward',
            [],
            blockchain,
        );
    }

    async claimOperatorReward(paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.executeContractFunction(
            'ParanetIncentivesPool',
            'claimParanetOperatorReward',
            [],
            blockchain,
        );
    }

    async getClaimableKnowledgeMinerReward(paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
            'getClaimableKnowledgeMinerRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableAllKnowledgeMinersReward(paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
            'getClaimableAllKnowledgeMinersRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableVoterReward(paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
            'getClaimableProposalVoterRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableAllVotersReward(paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
            'getClaimableAllProposalVotersRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableOperatorReward(paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
            'getClaimableParanetOperatorRewardAmount',
            [],
            blockchain,
        );
    }

    async isParanetKnowledgeMiner(address, paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
            'isKnowledgeMiner',
            [address],
            blockchain,
        );
    }

    async isParanetOperator(address, paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
            'isParanetOperator',
            [address],
            blockchain,
        );
    }

    async isParanetProposalVoter(address, paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
            'isProposalVoter',
            [address],
            blockchain,
        );
    }

    // Identity operations
    async getIdentityId(operationalWallet, blockchain) {
        return this.callContractFunction(
            'IdentityStorage',
            'getIdentityId',
            [operationalWallet],
            blockchain,
        );
    }

    // Get ask operations
    // To get price, multiply with size in bytes and epochs
    async getStakeWeightedAverageAsk(blockchain) {
        return this.callContractFunction(
            'AskStorage',
            'getStakeWeightedAverageAsk',
            [],
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
            } else {
                gasPrice = Web3.utils.toWei(DEFAULT_GAS_PRICE.GNOSIS, 'Gwei');
            }
            return gasPrice;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(`Failed to fetch the gas price from the network: ${error}. `);
            let defaultGasPrice;

            if (blockchain.name.startsWith('otp')) {
                defaultGasPrice = DEFAULT_GAS_PRICE.OTP;
            } else if (blockchain.name.startsWith('base')) {
                defaultGasPrice = DEFAULT_GAS_PRICE.BASE;
            } else {
                defaultGasPrice = DEFAULT_GAS_PRICE.GNOSIS;
            }

            return Web3.utils.toWei(defaultGasPrice, 'Gwei');
        }
    }

    /**
     * Get fee history from the last N blocks using eth_feeHistory RPC call
     * @param {Object} blockchain - Blockchain configuration
     * @param {number} blockCount - Number of blocks to fetch (default: 5)
     * @returns {Promise<Object>} Fee history data with baseFeePerGas and priorityFees arrays
     */
    async getFeeHistory(blockchain, blockCount = 5) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);

        try {
            // eth_feeHistory params: blockCount, newestBlock, rewardPercentiles
            // [50] = median priority fee per block
            const priorityFeePercentile = blockchain.priorityFeePercentile ?? 80;
            const feeHistory = await web3Instance.eth.getFeeHistory(blockCount, 'latest', [
                priorityFeePercentile,
            ]);

            // Extract median priority fees from each block (reward[blockIndex][percentileIndex])
            const priorityFees = feeHistory.reward
                ? feeHistory.reward.map((blockRewards) => BigInt(blockRewards[0] || 0))
                : [];

            return {
                supported: true,
                oldestBlock: parseInt(feeHistory.oldestBlock, 16),
                baseFeePerGas: feeHistory.baseFeePerGas.map((bf) => BigInt(bf)),
                priorityFees,
            };
        } catch (error) {
            // eth_feeHistory not supported on this network
            return {
                supported: false,
                error: error.message,
            };
        }
    }

    /**
     * Apply buffer percentage to a gas price
     * @param {BigInt} maxBaseFee - base fee in wei
     * @param {BigInt} maxPriorityFee - priority fee in wei
     * @param {number} gasPriceBufferPercent - Buffer percentage to add
     * @returns {BigInt} Gas price with buffer applied
     */
    applyGasPriceBuffer(maxBaseFee, maxPriorityFee, gasPriceBufferPercent) {
        if (!gasPriceBufferPercent) return maxBaseFee + maxPriorityFee;
        return (maxBaseFee * BigInt(100 + Number(gasPriceBufferPercent))) / 100n + maxPriorityFee;
    }

    buildEip1559FeesFromHistory(feeHistory, gasPriceBufferPercent = 0) {
        const baseFees = Array.from(feeHistory.baseFeePerGas ?? []);
        const priorityFees = Array.from(feeHistory.priorityFees ?? []);

        if (baseFees.length === 0 || priorityFees.length === 0) {
            throw new Error('Fee history data is empty');
        }

        const maxBaseFee = baseFees.reduce((max, bf) => (bf > max ? bf : max), 0n);
        const maxPriorityFeePerGas = priorityFees.reduce((max, pf) => (pf > max ? pf : max), 0n);

        const maxFeePerGas = this.applyGasPriceBuffer(
            maxBaseFee,
            maxPriorityFeePerGas,
            gasPriceBufferPercent,
        );

        return {
            maxFeePerGas,
            maxPriorityFeePerGas,
        };
    }

    /**
     * Estimate safe gas fees using eth_feeHistory (EIP-1559 style)
     * @param {Object} blockchain - Blockchain configuration
     * @returns {Promise<{maxFeePerGas: bigint, maxPriorityFeePerGas: bigint}>}
     */
    async estimateEip1559Fees(blockchain) {
        const feeHistory = await this.getFeeHistory(blockchain, FEE_HISTORY_BLOCK_COUNT);
        if (!feeHistory.supported) {
            throw new Error('eth_feeHistory not supported');
        }

        return this.buildEip1559FeesFromHistory(feeHistory, blockchain.gasPriceBufferPercent ?? 0);
    }

    /**
     * Get preferred gas price in wei: try EIP-1559 fee history, fall back to legacy network gas price.
     * @param {Object} blockchain - Blockchain configuration
     * @returns {Promise<string>} Gas price in wei (as string for web3 compatibility)
     */
    async getGasPriceWeiWithFallback(blockchain) {
        try {
            const { maxFeePerGas } = await this.estimateEip1559Fees(blockchain);
            return maxFeePerGas.toString();
        } catch (eip1559Error) {
            try {
                return await this.getNetworkGasPrice(blockchain);
            } catch (fallbackError) {
                throw new Error(
                    `All gas price estimation methods failed. ` +
                        `EIP-1559: ${eip1559Error?.message || 'N/A'}. ` +
                        `Fallback: ${fallbackError.message}`,
                );
            }
        }
    }

    normalizeGasMode(gasMode) {
        const requested = (gasMode || '').toLowerCase();
        if (Object.values(GAS_MODES).includes(requested)) {
            return requested;
        }
        return DEFAULT_PARAMETERS.GAS_MODE;
    }

    /**
     * Resolve gas fee fields based on configured gas mode and network support
     * @param {Object} blockchain - Blockchain configuration
     * @returns {Promise<Object>} Gas fee fields to merge into tx (legacy or EIP-1559)
     */
    async getGasFeeOptions(blockchain) {
        const desiredMode = this.normalizeGasMode(blockchain.gasMode);
        const feeHistory = await this.getFeeHistory(blockchain, FEE_HISTORY_BLOCK_COUNT);
        const supportsEip1559 =
            feeHistory.supported &&
            feeHistory.baseFeePerGas?.length &&
            feeHistory.priorityFees?.length;

        if (desiredMode === GAS_MODES.EIP1559 && supportsEip1559) {
            const { maxFeePerGas, maxPriorityFeePerGas } = this.buildEip1559FeesFromHistory(
                feeHistory,
                blockchain.gasPriceBufferPercent ?? 0,
            );

            return {
                type: GAS_MODES.EIP1559,
                maxFeePerGas: maxFeePerGas.toString(),
                maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
            };
        }

        if (desiredMode === GAS_MODES.EIP1559 && !supportsEip1559) {
            // eslint-disable-next-line no-console
            console.warn(
                'EIP-1559 gas mode requested but eth_feeHistory is unsupported; skipping feeHistory retry and falling back to legacy gasPrice',
            );
        }

        const legacyGasPrice =
            blockchain.gasPrice ??
            (supportsEip1559
                ? await this.getGasPriceWeiWithFallback(blockchain)
                : await this.getNetworkGasPrice(blockchain));

        return {
            type: GAS_MODES.LEGACY,
            gasPrice: legacyGasPrice?.toString?.() ?? legacyGasPrice,
        };
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

    async timeUntilNextEpoch(blockchain) {
        return this.callContractFunction('Chronos', 'timeUntilNextEpoch', [], blockchain);
    }

    async epochLength(blockchain) {
        return this.callContractFunction('Chronos', 'epochLength', [], blockchain);
    }

    async keyIsOperationalWallet(blockchain, identityId, signer) {
        const result = await this.callContractFunction(
            'IdentityStorage',
            'keyHasPurpose',
            [
                identityId,
                solidityPackedKeccak256(['address'], [signer]),
                2, // IdentityLib.OPERATIONAL_KEY
            ],
            blockchain,
        );

        return result;
    }

    convertToWei(ether) {
        return Web3.utils.toWei(ether.toString(), 'ether');
    }

    async adjustEmissionMultiplier(rewardTokenAddress, tracToTokenEmissionMultiplier, blockchain) {
        if (rewardTokenAddress !== ZERO_ADDRESS) {
            // Create contract instance for ERC20 token
            await this.ensureBlockchainInfo(blockchain);
            const web3Instance = await this.getWeb3Instance(blockchain);
            const tokenContract = new web3Instance.eth.Contract(
                this.abis.IERC20Extended,
                rewardTokenAddress,
            );

            try {
                const decimals = await tokenContract.methods.decimals().call();
                return BigInt(tracToTokenEmissionMultiplier) * BigInt(10) ** BigInt(decimals);
            } catch (error) {
                console.log(
                    'ERC20 token is missing decimals function, adding 18 decimals as default',
                );
                return BigInt(tracToTokenEmissionMultiplier) * BigInt(10) ** BigInt(18);
            }
        } else {
            // Neuroweb chains use 12 decimals
            if (NEUROWEB_INCENTIVE_TYPE_CHAINS.includes(blockchain.name)) {
                return BigInt(tracToTokenEmissionMultiplier) * BigInt(10) ** BigInt(12);
            } else {
                // Other chains use 18 decimals (e.g., ETH)
                return BigInt(tracToTokenEmissionMultiplier) * BigInt(10) ** BigInt(18);
            }
        }
    }
}
