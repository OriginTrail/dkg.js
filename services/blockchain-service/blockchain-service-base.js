/* eslint-disable dot-notation */
/* eslint-disable no-await-in-loop */
import Web3 from 'web3';
import axios from 'axios';
import { solidityPackedKeccak256 } from 'ethers';
import { createRequire } from 'module';
import {
    OPERATIONS_STEP_STATUS,
    DEFAULT_GAS_PRICE,
    DEFAULT_GAS_PRICE_WEI,
} from '../../constants.js';
import emptyHooks from '../../util/empty-hooks.js';
import { sleepForMilliseconds } from '../utilities.js';

const require = createRequire(import.meta.url);

const HubAbi = require('dkg-evm-module/abi/Hub.json');
const TokenAbi = require('dkg-evm-module/abi/Token.json');
const ParanetAbi = require('dkg-evm-module/abi/Paranet.json');
const ParanetsRegistryAbi = require('dkg-evm-module/abi/ParanetsRegistry.json');
const ParanetIncentivesPoolFactoryAbi = require('dkg-evm-module/abi/ParanetIncentivesPoolFactory.json');
const ParanetNeuroIncentivesPoolAbi = require('dkg-evm-module/abi/ParanetNeuroIncentivesPool.json');
const ParanetKnowledgeMinersRegistryAbi = require('dkg-evm-module/abi/ParanetKnowledgeMinersRegistry.json');
const IdentityStorageAbi = require('dkg-evm-module/abi/IdentityStorage.json');
const KnowledgeCollectionAbi = require('dkg-evm-module/abi/KnowledgeCollection.json');
const KnowledgeCollectionStorageAbi = require('dkg-evm-module/abi/KnowledgeCollectionStorage.json');
const AskStorageAbi = require('dkg-evm-module/abi/AskStorage.json');
const ChronosAbi = require('dkg-evm-module/abi/Chronos.json');
const PaymasterAbi = require('dkg-evm-module/abi/Paymaster.json');
const PaymasterManagerAbi = require('dkg-evm-module/abi/PaymasterManager.json');

export default class BlockchainServiceBase {
    constructor(config = {}) {
        this.config = config;
        this.events = {};
        this.abis = {};
        // this.abis.AssertionStorage = AssertionStorageAbi;
        this.abis.Hub = HubAbi;
        // this.abis.ServiceAgreementV1 = ServiceAgreementV1Abi;
        // this.abis.ServiceAgreementStorageProxy = ServiceAgreementStorageProxyAbi;
        // this.abis.ContentAssetStorage = ContentAssetStorageAbi;
        // this.abis.UnfinalizedStateStorage = UnfinalizedStateStorageAbi;
        // this.abis.ContentAsset = ContentAssetAbi;
        this.abis.Token = TokenAbi;
        this.abis.Paranet = ParanetAbi;
        this.abis.ParanetsRegistry = ParanetsRegistryAbi;
        this.abis.ParanetIncentivesPoolFactory = ParanetIncentivesPoolFactoryAbi;
        this.abis.ParanetNeuroIncentivesPool = ParanetNeuroIncentivesPoolAbi;
        this.abis.ParanetKnowledgeMinersRegistry = ParanetKnowledgeMinersRegistryAbi;
        this.abis.IdentityStorage = IdentityStorageAbi;
        this.abis.KnowledgeCollection = KnowledgeCollectionAbi;
        this.abis.KnowledgeCollectionStorage = KnowledgeCollectionStorageAbi;
        this.abis.AskStorage = AskStorageAbi;
        this.abis.Chronos = ChronosAbi;
        this.abis.Paymaster = PaymasterAbi;
        this.abis.PaymasterManager = PaymasterManagerAbi;

        this.abis.KnowledgeCollectionStorage.filter((obj) => obj.type === 'event').forEach(
            (event) => {
                const concatInputs = event.inputs.map((input) => input.internalType);

                this.events[event.name] = {
                    hash: Web3.utils.keccak256(`${event.name}(${concatInputs})`),
                    inputs: event.inputs,
                };
            },
        );

        this.abis.PaymasterManager.filter((obj) => obj.type === 'event').forEach(
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
            let gasPrice;

            if (blockchain.name.startsWith('otp')) {
                gasPrice = await web3Instance.eth.getGasPrice();
            } else if (blockchain.name.startsWith('base')) {
                gasPrice = await web3Instance.eth.getGasPrice();
            } else if (blockchain.name.startsWith('gnosis')) {
                try {
                    const response = await axios.get(blockchain.gasPriceOracleLink);
                    gasPrice =
                        Number(response?.data?.average) * 1e9 || DEFAULT_GAS_PRICE_WEI.GNOSIS;
                } catch (e) {
                    gasPrice = DEFAULT_GAS_PRICE_WEI.GNOSIS;
                }
            } else {
                if (blockchain.name.startsWith('otp')) {
                    gasPrice = Web3.utils.toWei(DEFAULT_GAS_PRICE.OTP, 'Gwei');
                } else if (blockchain.name.startsWith('base')) {
                    gasPrice = Web3.utils.toWei(DEFAULT_GAS_PRICE.BASE, 'Gwei');
                } else {
                    gasPrice = Web3.utils.toWei(DEFAULT_GAS_PRICE.GNOSIS, 'Gwei');
                }
            }
            return gasPrice;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(
                `Failed to fetch the gas price from the network: ${error}. Using default value.`,
            );
            return Web3.utils.toWei(
                blockchain.name.startsWith('otp')
                    ? DEFAULT_GAS_PRICE.OTP
                    : blockchain.name.startsWith('base')
                      ? DEFAULT_GAS_PRICE.BASE
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

    async callContractFunctionPaymaster(paymasterAddress, contractName, functionName, args, blockchain) {
        await this.ensureBlockchainInfo(blockchain);

        const web3Instance = await this.getWeb3Instance(blockchain);
        const publicKey = await this.getPublicKey(blockchain);

        // const account = web3Instance.eth.accounts.privateKeyToAccount("8ae4f7c247ad422913c1c60187856091ad2bcb4e53fb2936d7633d7d02bd180a");

        // web3Instance.eth.accounts.wallet.add(account); 
        
        let paymasterContractInstance = new web3Instance.eth.Contract(
            this.abis[contractName],
            paymasterAddress,
            { from: publicKey },                     
        )

        try {
            return await paymasterContractInstance.methods[functionName](...args).send({
                from: publicKey,
                gas: 100000,
            });
        
        } catch (error) {
            if (/revert|VM Exception/i.test(error.message)) {
                let status;
                try {
                    status = await paymasterContractInstance.methods.status().call();
                } catch (_) {
                    status = false;
                }

                if (!status && contractName !== 'ParanetNeuroIncentivesPool') {
                    await this.updateContractInstance(contractName, blockchain, true);
                    let paymasterContractInstance = new web3Instance.eth.Contract(
                        this.abis[contractName],
                        this[blockchain.name].contractAddress[blockchain.hubContract][contractName],
                        { from: blockchain.publicKey },
                    )

                    return paymasterContractInstance.methods[functionName](...args).call();
                }
            }

            throw error;
        }
    }

    async executeContractFunctionPaymaster(paymasterAddress, contractName, functionName, args, blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        
        const web3Instance = await this.getWeb3Instance(blockchain);
        const publicKey = await this.getPublicKey(blockchain);

        let paymasterContractInstance = new web3Instance.eth.Contract(
            this.abis[contractName],
            paymasterAddress,
            { from: publicKey },                     
        )

       // let paymasterContractInstance = await this.getContractInstance(contractName, blockchain);
        
       let tx;

        try {
       
            tx = await this.prepareTransaction(paymasterContractInstance, functionName, args, blockchain);
        
            let receipt = await paymasterContractInstance.methods[functionName](...args).send(tx);
            if (blockchain.name.startsWith('otp') && blockchain.waitNeurowebTxFinalization) {
                receipt = await this.waitForTransactionFinalization(receipt, blockchain);
            }

            console.log(receipt);
            return receipt;
        } catch (error) {
            if (/revert|VM Exception/i.test(error.message)) {
                let status;
                try {
                    status = await paymasterContractInstance.methods.status().call();
                } catch (_) {
                    status = false;
                }

                if (!status) {
                    await this.updateContractInstance(contractName, blockchain, true);
                    paymasterContractInstance = await this.getContractInstance(contractName, blockchain);
                    const web3Instance = await this.getWeb3Instance(blockchain);

                    await web3Instance.eth.call({
                        to: paymasterContractInstance.options.address,
                        data: tx.data,
                        from: tx.from,
                    });

                    return paymasterContractInstance.methods[functionName](...args).send(tx);
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

        console.log(contractInstance.methods)

        let gasLimit = Number(
            await contractInstance.methods[functionName](...args).estimateGas({
                from: publicKey,
            }),
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
                    (tx) =>
                        tx.from.toLowerCase() === publicKey.toLowerCase() &&
                        tx.nonce === confirmedNonce,
                );

                if (pendingTx) {
                    // If found, increase gas price of pending tx by 20%
                    gasPrice = Math.round(Number(pendingTx.gasPrice) * 1.2);
                } else {
                    // If not found, use default/network gas price increased by 20%
                    // Theoretically this should never happen
                    gasPrice = Math.round(
                        (blockchain.gasPrice || (await this.getNetworkGasPrice(blockchain))) * 1.2,
                    );
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

    async increaseKnowledgeCollectionAllowance(sender, tokenAmount, blockchain) {
        const knowledgeCollectionAddress = await this.getContractAddress(
            'KnowledgeCollection',
            blockchain,
        );

        const allowance = await this.callContractFunction(
            'Token',
            'allowance',
            [sender, knowledgeCollectionAddress],
            blockchain,
        );

        const allowanceGap = BigInt(tokenAmount) - BigInt(allowance);

        if (allowanceGap > 0) {
            await this.executeContractFunction(
                'Token',
                'increaseAllowance',
                [knowledgeCollectionAddress, allowanceGap],
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
        };
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
        let serviceAgreementV1Address;
        let allowanceIncreased = false;
        let allowanceGap = 0;

        try {
            let allowanceIncreased, allowanceGap;

            if (requestData?.payer) {
                // Handle the case when payer is passed
            } else {
                ({ allowanceIncreased, allowanceGap } =
                    await this.increaseKnowledgeCollectionAllowance(
                        sender,
                        requestData.tokenAmount,
                        blockchain,
                    ));
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
                    'mintKnowledgeAsset',
                    [paranetKaContract, paranetTokenId, Object.values(requestData)],
                    blockchain,
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

    async addParanetCuratedNodes(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'addParanetCuratedNodes',
            Object.values(requestData),
            blockchain,
        );
    }

    async removeParanetCuratedNodes(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'removeParanetCuratedNodes',
            Object.values(requestData),
            blockchain,
        );
    }

    async requestParanetCuratedNodeAccess(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'requestParanetCuratedNodeAccess',
            Object.values(requestData),
            blockchain,
        );
    }

    async approveCuratedNode(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'approveCuratedNode',
            Object.values(requestData),
            blockchain,
        );
    }

    async rejectCuratedNode(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'rejectCuratedNode',
            Object.values(requestData),
            blockchain,
        );
    }

    async getCuratedNodes(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetsRegistry',
            'getCuratedNodes',
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

    async addParanetCuratedMiners(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'addParanetCuratedMiners',
            Object.values(requestData),
            blockchain,
        );
    }

    async removeParanetCuratedMiners(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'removeParanetCuratedMiners',
            Object.values(requestData),
            blockchain,
        );
    }

    async requestParanetCuratedMinerAccess(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'requestParanetCuratedMinerAccess',
            Object.values(requestData),
            blockchain,
        );
    }

    async approveCuratedMiner(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'approveCuratedMiner',
            Object.values(requestData),
            blockchain,
        );
    }

    async rejectCuratedMiner(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'rejectCuratedMiner',
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

    async getNeuroIncentivesPoolAddress(paranetId, blockchain) {
        return this.getIncentivesPoolAddress(
            {
                paranetId,
                incentivesPoolType: 'Neuroweb',
            },
            blockchain,
        );
    }

    async setIncentivesPool(contractAddress, blockchain) {
        await this.ensureBlockchainInfo(blockchain);

        if (
            this[blockchain.name].contractAddresses[blockchain.hubContract][
                'ParanetNeuroIncentivesPool'
            ] !== contractAddress
        ) {
            this[blockchain.name].contractAddresses[blockchain.hubContract][
                'ParanetNeuroIncentivesPool'
            ] = contractAddress;
            const web3Instance = await this.getWeb3Instance(blockchain);
            this[blockchain.name].contracts[blockchain.hubContract]['ParanetNeuroIncentivesPool'] =
                await new web3Instance.eth.Contract(
                    this.abis['ParanetNeuroIncentivesPool'],
                    this[blockchain.name].contractAddresses[blockchain.hubContract][
                        'ParanetNeuroIncentivesPool'
                    ],
                    { from: blockchain.publicKey },
                );
        }
    }

    async claimKnowledgeMinerReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.executeContractFunction(
            'ParanetNeuroIncentivesPool',
            'claimKnowledgeMinerReward',
            [],
            blockchain,
        );
    }

    async claimVoterReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.executeContractFunction(
            'ParanetNeuroIncentivesPool',
            'claimIncentivizationProposalVoterReward',
            [],
            blockchain,
        );
    }

    async claimOperatorReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.executeContractFunction(
            'ParanetNeuroIncentivesPool',
            'claimParanetOperatorReward',
            [],
            blockchain,
        );
    }

    async getClaimableKnowledgeMinerReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'getClaimableKnowledgeMinerRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableAllKnowledgeMinersReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'getClaimableAllKnowledgeMinersRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableVoterReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'getClaimableProposalVoterRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableAllVotersReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'getClaimableAllProposalVotersRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableOperatorReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'getClaimableParanetOperatorRewardAmount',
            [],
            blockchain,
        );
    }

    async isParanetKnowledgeMiner(address, paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'isKnowledgeMiner',
            [address],
            blockchain,
        );
    }

    async isParanetOperator(address, paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'isParanetOperator',
            [address],
            blockchain,
        );
    }

    async isParanetProposalVoter(address, paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
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
            console.warn(`Failed to fetch the gas price from the network: ${error}. `);
            return Web3.utils.toWei(
                blockchain.name.startsWith('otp')
                    ? DEFAULT_GAS_PRICE.OTP
                    : blockchain.name.startsWith('base')
                      ? DEFAULT_GAS_PRICE.BASE
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

    //Paymaster functions
    async deployPaymasterContract(blockchain) {
        const paymasterAddressContract = await this.executeContractFunction(
            'PaymasterManager',
            'deployPaymaster',
            [],
            blockchain,
        );

      
        let { paymasterAddress } = await this.decodeEventLogs(paymasterAddressContract, 'PaymasterDeployed', blockchain); 

        return paymasterAddress;
    }

    async addAllowedAddress(blockchain, paymasterAddress, public_adress) {
        return this.executeContractFunctionPaymaster(
            paymasterAddress,
            'Paymaster',
            'addAllowedAddress',
            [public_adress],
            blockchain,
        );
    }

    async removeAllowedAddress(blockchain, paymasterAddress, public_adress) {
        return this.executeContractFunctionPaymaster(
            paymasterAddress,
            'Paymaster',
            'removeAllowedAddress',
            [public_adress],
            blockchain,
        );
    }

    async fundPaymaster(blockchain, paymasterAddress, tokenAmount) {
        return this.executeContractFunctionPaymaster(
            paymasterAddress,
            'Paymaster', 
            'fundPaymaster', 
            [tokenAmount], 
            blockchain);
    }

    async withdrawPaymaster(blockchain, paymasterAddress, recipient, tokenAmount) {

        return this.executeContractFunctionPaymaster(
            paymasterAddress,
            'Paymaster',
            'withdraw',
            [recipient, tokenAmount],
            blockchain,
        );
    }

}
