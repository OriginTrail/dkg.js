import { kaTools, kcTools } from 'assertion-tools';
import { ethers, hashMessage, getBytes } from 'ethers';
import {
    deriveUAL,
    getOperationStatusObject,
    resolveUAL,
    toNQuads,
    toJSONLD,
} from '../services/utilities.js';
import {
    OPERATIONS,
    OPERATION_STATUSES,
    CHUNK_BYTE_SIZE,
    PRIVATE_RESOURCE_PREDICATE,
    PRIVATE_HASH_SUBJECT_PREFIX,
    PRIVATE_ASSERTION_PREDICATE,
    GET_OUTPUT_FORMATS,
} from '../constants/constants.js';
import emptyHooks from '../util/empty-hooks.js';

export default class AssetOperationsManager {
    constructor(services) {
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
    }

    /**
     * Sets allowance to a given quantity of tokens.
     * @async
     * @param {BigInt} tokenAmount - The amount of tokens (Wei) to set the allowance.
     * @param {Object} [options={}] - Additional options for increasing allowance - currently only blockchain option expected.
     * @returns {Object} Object containing hash of blockchain transaction and status.
     */
    async setAllowance(tokenAmount, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateSetAllowance(blockchain);

        const serviceAgreementV1Address = await this.blockchainService.getContractAddress(
            'ServiceAgreementV1',
            blockchain,
        );

        const currentAllowance = BigInt(
            await this.blockchainService.callContractFunction(
                'Token',
                'allowance',
                [blockchain.publicKey, serviceAgreementV1Address],
                blockchain,
            ),
        );

        const allowanceDifference = tokenAmount - currentAllowance;

        let receipt;
        if (allowanceDifference > 0) {
            receipt = await this.blockchainService.executeContractFunction(
                'Token',
                'increaseAllowance',
                [serviceAgreementV1Address, allowanceDifference],
                blockchain,
            );
        } else if (allowanceDifference < 0) {
            receipt = await this.blockchainService.executeContractFunction(
                'Token',
                'decreaseAllowance',
                [serviceAgreementV1Address, -allowanceDifference],
                blockchain,
            );
        }

        if (receipt) {
            return {
                operation: receipt,
                transactionHash: receipt.transactionHash,
                status: receipt.status,
            };
        }

        return { status: 'Skipped: Allowance is already equal to the requested amount.' };
    }

    /**
     * Increases allowance for a set quantity of tokens.
     * @async
     * @param {BigInt} tokenAmount - The amount of tokens (Wei) to increase the allowance for.
     * @param {Object} [options={}] - Additional options for increasing allowance - currently only blockchain option expected.
     * @returns {Object} Object containing hash of blockchain transaction and status.
     */
    async increaseAllowance(tokenAmount, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateIncreaseAllowance(blockchain);

        const knowledgeCollectionAddress = await this.blockchainService.getContractAddress(
            'KnowledgeCollection',
            blockchain,
        );

        const receipt = await this.blockchainService.executeContractFunction(
            'Token',
            'increaseAllowance',
            [knowledgeCollectionAddress, tokenAmount],
            blockchain,
        );

        return {
            operation: receipt,
            transactionHash: receipt.transactionHash,
            status: receipt.status,
        };
    }

    /**
     * Decreases allowance for a set quantity of tokens.
     * @async
     * @param {BigInt} tokenAmount - The amount of tokens (Wei) to decrease the allowance for.
     * @param {Object} [options={}] - Additional options for decreasing allowance - currently only blockchain option expected.
     * @returns {Object} Object containing hash of blockchain transaction and status.
     */
    async decreaseAllowance(tokenAmount, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateDecreaseAllowance(blockchain);

        const serviceAgreementV1Address = await this.blockchainService.getContractAddress(
            'ServiceAgreementV1',
            blockchain,
        );

        const allowance = await this.blockchainService.callContractFunction(
            'Token',
            'allowance',
            [blockchain.publicKey, serviceAgreementV1Address],
            blockchain,
        );

        const receipt = await this.blockchainService.executeContractFunction(
            'Token',
            'decreaseAllowance',
            [
                serviceAgreementV1Address,
                BigInt(tokenAmount) > BigInt(allowance) ? allowance : tokenAmount,
            ], // So Error 'ERC20: decreased allowance below zero' is not emitted
            blockchain,
        );

        return {
            operation: receipt,
            transactionHash: receipt.transactionHash,
            status: receipt.status,
        };
    }

    /**
     * Gets current allowance in Wei.
     * @async
     * @param {Object} [options={}] - Additional options for decreasing allowance - currently only blockchain option expected.
     * @returns {BigInt} Current allowance (Wei).
     */
    async getCurrentAllowance(options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        const knowledgeCollectionAddress = await this.blockchainService.getContractAddress(
            'KnowledgeCollection',
            blockchain,
        );

        const allowance = await this.blockchainService.callContractFunction(
            'Token',
            'allowance',
            [blockchain.publicKey, knowledgeCollectionAddress],
            blockchain,
        );

        return BigInt(allowance);
    }

    /**
     * Helper function to process content by splitting, trimming, and filtering lines.
     * @param {string} str - The content string to process.
     * @returns {string[]} - Processed array of strings.
     */
    processContent(str) {
        return str
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line !== '');
    }

    insertTripleSorted(triplesArray, newTriple) {
        // Assuming triplesArray is already sorted
        let left = 0;
        let right = triplesArray.length;
        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (triplesArray[mid].localeCompare(newTriple) < 0) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        triplesArray.splice(left, 0, newTriple);
        return left;
    }

    /**
     * Creates a new knowledge collection.
     * @async
     * @param {Object} content - The content of the knowledge collection to be created, contains public, private or both keys.
     * @param {Object} [options={}] - Additional options for knowledge collection creation.
     * @param {Object} [stepHooks=emptyHooks] - Hooks to execute during knowledge collection creation.
     * @returns {Object} Object containing UAL, publicAssertionId and operation status.
     */
    async create(content, options = {}, stepHooks = emptyHooks) {
        this.validationService.validateJsonldOrNquads(content);
        const {
            blockchain,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            epochsNum,
            hashFunctionId,
            scoreFunctionId,
            immutable,
            tokenAmount,
            authToken,
            payer,
            minimumNumberOfFinalizationConfirmations,
            minimumNumberOfNodeReplications,
        } = this.inputService.getAssetCreateArguments(options);

        this.validationService.validateAssetCreate(
            content,
            blockchain,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            epochsNum,
            hashFunctionId,
            scoreFunctionId,
            immutable,
            tokenAmount,
            authToken,
            payer,
            minimumNumberOfFinalizationConfirmations,
            minimumNumberOfNodeReplications,
        );

        let dataset = {};
        if (typeof content === 'string') {
            dataset.public = this.processContent(content);
        } else if (
            typeof content.public === 'string' ||
            (!content.public && content.private && typeof content.private === 'string')
        ) {
            if (content.public) {
                dataset.public = this.processContent(content.public);
            } else {
                dataset.public = [];
            }
            if (content.private && typeof content.private === 'string') {
                dataset.private = this.processContent(content.private);
            }
        } else {
            dataset = await kcTools.formatDataset(content);
        }

        let publicTriplesGrouped = [];
        // Assign IDs to blank nodes

        dataset.public = kcTools.generateMissingIdsForBlankNodes(dataset.public);

        if (dataset.private?.length) {
            dataset.private = kcTools.generateMissingIdsForBlankNodes(dataset.private);

            // Group private triples by subject and flatten
            const privateTriplesGrouped = kcTools.groupNquadsBySubject(dataset.private, false).sort();
            dataset.private = privateTriplesGrouped.flat();

            // Compute private root and add to public
            const privateRoot = kcTools.calculateMerkleRoot(dataset.private);
            dataset.public.push(
                `<${kaTools.generateNamedNode()}> <${PRIVATE_ASSERTION_PREDICATE}> "${privateRoot}" .`,
            );

            // Group public triples by subject
            publicTriplesGrouped = kcTools.groupNquadsBySubject(dataset.public, true);

            // Create a map of public subject -> index for quick lookup
            const publicSubjectMap = new Map();
            for (let i = 0; i < publicTriplesGrouped.length; i += 1) {
                const [publicSubject] = publicTriplesGrouped[i][0].split(' ');
                publicSubjectMap.set(publicSubject, i);
            }

            const privateTripleSubjectHashesGroupedWithoutPublicPair = [];

            // Integrate private subjects into public or store separately if no match to be appended later
            for (const privateTriples of privateTriplesGrouped) {
                const [privateSubject] = privateTriples[0].split(' ');
                const privateSubjectHash = ethers.solidityPackedSha256(
                    ['string'],
                    [privateSubject.slice(1, -1)],
                );

                if (publicSubjectMap.has(privateSubject)) {
                    // If there's a public pair, insert a representation in that group
                    const publicIndex = publicSubjectMap.get(privateSubject);
                    this.insertTripleSorted(
                        publicTriplesGrouped[publicIndex],
                        `${privateSubject} <${PRIVATE_RESOURCE_PREDICATE}> <${kaTools.generateNamedNode()}> .`,
                    );
                } else {
                    // If no public pair, maintain separate list, inserting sorted by hash
                    this.insertTripleSorted(
                        privateTripleSubjectHashesGroupedWithoutPublicPair,
                        `${`<${PRIVATE_HASH_SUBJECT_PREFIX}${privateSubjectHash}>`} <${PRIVATE_RESOURCE_PREDICATE}> <${kaTools.generateNamedNode()}> .`,
                    );
                }
            }

            // Append any non-paired private subjects at the end
            for (const triple of privateTripleSubjectHashesGroupedWithoutPublicPair) {
                publicTriplesGrouped.push([triple]);
            }

            dataset.public = publicTriplesGrouped.flat();
        } else {
            // No private triples, just group and flatten public
            publicTriplesGrouped = kcTools.groupNquadsBySubject(dataset.public, true);
            dataset.public = publicTriplesGrouped.flat();
        }

        const numberOfChunks = kcTools.calculateNumberOfChunks(dataset.public, CHUNK_BYTE_SIZE);
        const datasetSize = numberOfChunks * CHUNK_BYTE_SIZE;

        this.validationService.validateAssertionSizeInBytes(datasetSize);
        const datasetRoot = kcTools.calculateMerkleRoot(dataset.public);

        const contentAssetStorageAddress = await this.blockchainService.getContractAddress(
            'KnowledgeCollectionStorage',
            blockchain,
        );

        const publishOperationId = await this.nodeApiService.publish(
            endpoint,
            port,
            authToken,
            datasetRoot,
            dataset,
            blockchain.name,
            hashFunctionId,
            minimumNumberOfNodeReplications,
        );
        const publishOperationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.PUBLISH,
            maxNumberOfRetries,
            frequency,
            publishOperationId,
        );

        if (
            publishOperationResult.status !== OPERATION_STATUSES.COMPLETED &&
            !publishOperationResult.data.minAcksReached
        ) {
            return {
                datasetRoot,
                operation: {
                    publish: getOperationStatusObject(publishOperationResult, publishOperationId),
                },
            };
        }

        const { signatures } = publishOperationResult.data;

        const {
            identityId: publisherNodeIdentityId,
            r: publisherNodeR,
            vs: publisherNodeVS,
        } = publishOperationResult.data.publisherNodeSignature;

        const identityIds = [];
        const r = [];
        const vs = [];
        await Promise.all(
            signatures.map(async (signature) => {
                try {
                    const signerAddress = ethers.recoverAddress(
                        hashMessage(getBytes(datasetRoot)),
                        signature,
                    );

                    const keyIsOperationalWallet =
                        await this.blockchainService.keyIsOperationalWallet(
                            blockchain,
                            signature.identityId,
                            signerAddress,
                        );
                    if (keyIsOperationalWallet) {
                        identityIds.push(signature.identityId);
                        r.push(signature.r);
                        vs.push(signature.vs);
                    }
                } catch {
                    // If error happened continue
                }
            }),
        );

        let estimatedPublishingCost;
        if (tokenAmount) {
            estimatedPublishingCost = tokenAmount;
        } else {
            const stakeWeightedAverageAsk = await this.blockchainService.getStakeWeightedAverageAsk(
                blockchain,
            );

            estimatedPublishingCost =
                BigInt(stakeWeightedAverageAsk) *
                BigInt(epochsNum) *
                BigInt(datasetSize) /
                BigInt(1024);
        }
        let knowledgeCollectionId;
        let mintKnowledgeCollectionReceipt;

        ({ knowledgeCollectionId, receipt: mintKnowledgeCollectionReceipt } =
            await this.blockchainService.createKnowledgeCollection(
                {
                    publishOperationId,
                    merkleRoot: datasetRoot,
                    knowledgeAssetsAmount: kcTools.countDistinctSubjects(dataset.public),
                    byteSize: datasetSize,
                    epochs: epochsNum,
                    tokenAmount: estimatedPublishingCost.toString(),
                    isImmutable: immutable,
                    paymaster: payer,
                    publisherNodeIdentityId,
                    publisherNodeR,
                    publisherNodeVS,
                    identityIds,
                    r,
                    vs,
                },
                null,
                null,
                blockchain,
                stepHooks,
            ));

        // ------------------------------------------------------------------
        // Ensure KC minting transaction is reorg-safe by waiting until it is
        // included in a block with the desired depth (default = 1).
        // ------------------------------------------------------------------

        const minimumBlockConfirmations = options.minimumBlockConfirmations ?? 1;

        if (blockchain.name && blockchain.name.startsWith('otp') && minimumBlockConfirmations > 0) {
            const { receipt: finalizedMintReceipt, eventData } =
                await this.blockchainService.waitForEventFinality(
                    mintKnowledgeCollectionReceipt,
                    'KnowledgeCollectionCreated',
                    knowledgeCollectionId,
                    blockchain,
                    minimumBlockConfirmations,
                );

            mintKnowledgeCollectionReceipt = finalizedMintReceipt;
            knowledgeCollectionId = parseInt(eventData.id, 10);
        }

        const UAL = deriveUAL(blockchain.name, contentAssetStorageAddress, knowledgeCollectionId);

        let finalityStatusResult = 0;
        if (minimumNumberOfFinalizationConfirmations > 0) {
            finalityStatusResult = await this.nodeApiService.finalityStatus(
                endpoint,
                port,
                authToken,
                UAL,
                minimumNumberOfFinalizationConfirmations,
                maxNumberOfRetries,
                frequency,
            );
        }

        return {
            UAL,
            datasetRoot,
            signatures: publishOperationResult.data.signatures,
            operation: {
                mintKnowledgeCollection: mintKnowledgeCollectionReceipt,
                publish: getOperationStatusObject(publishOperationResult, publishOperationId),
                finality: {
                    status:
                        finalityStatusResult >= minimumNumberOfFinalizationConfirmations
                            ? 'FINALIZED'
                            : 'NOT FINALIZED',
                },
                numberOfConfirmations: finalityStatusResult,
                requiredConfirmations: minimumNumberOfFinalizationConfirmations,
            },
        };
    }

    /**
     * Transfer an asset to a new owner on a specified blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset to be transferred.
     * @param {string} newOwner - The address of the new owner.
     * @param {Object} [options={}] - Additional options for asset transfer.
     * @returns {Object} Object containing UAL, owner's address and operation status.
     */
    async transfer(UAL, newOwner, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateAssetTransfer(UAL, newOwner, blockchain);

        const { knowledgeCollectionId, tokenId } = resolveUAL(UAL);
        const assetId = (knowledgeCollectionId - 1) * 1_000_000 + tokenId;
        const receipt = await this.blockchainService.transferAsset(assetId, newOwner, blockchain);
        // const owner = await this.blockchainService.getAssetOwner(tokenId, blockchain);

        return {
            UAL,
            operation: receipt,
        };
    }

    /**
     * Burn an asset on a specified blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Object} An object containing the UAL and operation status.
     */

    // TODO: Update function for v8
    async burn(UAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateAssetBurn(UAL, blockchain);

        const { tokenId } = resolveUAL(UAL);
        const receipt = await this.blockchainService.burnAsset(tokenId, blockchain);

        return {
            UAL,
            operation: receipt,
        };
    }

    /**
     * Extend the storing period of an asset on a specified blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {number} epochsNumber - Nmber of epochs for the extension.
     * @param {Object} [options={}] - Additional options for asset storing period extension.
     * @returns {Object} An object containing the UAL and operation status.
     */

    // TOOO: Update for v8
    // async extendStoringPeriod(UAL, epochsNumber, options = {}) {
    //     const blockchain = this.inputService.getBlockchain(options);
    //     const tokenAmount = this.inputService.getTokenAmount(options);

    //     this.validationService.validateExtendAssetStoringPeriod(
    //         UAL,
    //         epochsNumber,
    //         tokenAmount,
    //         blockchain,
    //     );

    //     const { tokenId } = resolveUAL(UAL);
    //     // const datasetSize = await this.blockchainService.getDatasetSize()

    //     let tokenAmountInWei;

    //     if (tokenAmount != null) {
    //         tokenAmountInWei = tokenAmount;
    //     } else {
    //         tokenAmountInWei =
    //             (await this.blockchainService.getStakeWeightedAverageAsk()) *
    //             epochsNumber *
    //             datasetSize; // need to get dataset size somewhere
    //     }

    //     const receipt = await this.blockchainService.extendAssetStoringPeriod(
    //         tokenId,
    //         epochsNumber,
    //         tokenAmountInWei,
    //         blockchain,
    //     );

    //     return {
    //         UAL,
    //         operation: receipt,
    //     };
    // }

    /**
     * Add tokens for an asset on the specified blockchain to a ongoing publishing operation.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {Object} [options={}] - Additional options for adding tokens.
     * @returns {Object} An object containing the UAL and operation status.
     */

    // TODO: Update for v8
    // async addTokens(UAL, options = {}) {
    //     const blockchain = this.inputService.getBlockchain(options);
    //     const tokenAmount = this.inputService.getTokenAmount(options);

    //     this.validationService.validateAddTokens(UAL, tokenAmount, blockchain);

    //     const { tokenId } = resolveUAL(UAL);

    //     let tokenAmountInWei;

    //     if (tokenAmount != null) {
    //         tokenAmountInWei = tokenAmount;
    //     } else {
    //         const endpoint = this.inputService.getEndpoint(options);
    //         const port = this.inputService.getPort(options);
    //         const authToken = this.inputService.getAuthToken(options);
    //         const hashFunctionId = this.inputService.getHashFunctionId(options);

    //         const latestFinalizedState = await this.blockchainService.getLatestAssertionId(
    //             tokenId,
    //             blockchain,
    //         );

    //         const latestFinalizedStateSize = await this.blockchainService.getAssertionSize(
    //             latestFinalizedState,
    //             blockchain,
    //         );

    //         tokenAmountInWei = await this._getUpdateBidSuggestion(
    //             UAL,
    //             blockchain,
    //             endpoint,
    //             port,
    //             authToken,
    //             latestFinalizedState,
    //             latestFinalizedStateSize,
    //             hashFunctionId,
    //         );

    //         if (tokenAmountInWei <= 0) {
    //             throw new Error(
    //                 `Token amount is bigger than default suggested amount, please specify exact tokenAmount if you still want to add more tokens!`,
    //             );
    //         }
    //     }

    //     const receipt = await this.blockchainService.addTokens(
    //         tokenId,
    //         tokenAmountInWei,
    //         blockchain,
    //     );

    //     return {
    //         UAL,
    //         operation: receipt,
    //     };
    // }

    /**
     * Add knowledge asset to a paranet.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the knowledge asset.
     * @param {string} paranetUAL - The Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for adding tokens.
     * @returns {Object} An object containing the UAL and operation status.
     */
    async submitToParanet(UAL, paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateSubmitToParanet(UAL, paranetUAL, blockchain);

        const { contract: kcStorageContract, kcTokenId } = resolveUAL(UAL);
        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const receipt = await this.blockchainService.submitToParanet(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                kcStorageContract,
                kcTokenId,
            },
            blockchain,
        );

        return {
            UAL,
            operation: receipt,
        };
    }

    /**
     * Retrieves a public or private assertion for a given UAL.
     * @async
     * @param {string} UAL - The Universal Asset Locator, representing asset or collection.
     * @param {Object} [options={}] - Optional parameters for the asset get operation.
     * @param {number} [options.state] - The state index of the asset. If omitted, the latest state will be used.
     * @param {boolean} [options.includeMetadata] - If metadata should be included. Default is false.
     * @param {string} [options.contentType] - The type of content to retrieve, either "public" or "all" (default)
     * @param {boolean} [options.validate] - Whether to validate the retrieved assertion.
     * @param {string} [options.outputFormat] - The format of the retrieved assertion output, either "n-quads" or "json-ld".
     * @returns {Object} - The result of the asset get operation.
     */
    async get(UAL, options = {}) {
        const {
            blockchain,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            state,
            includeMetadata,
            contentType,
            validate,
            outputFormat,
            authToken,
            hashFunctionId,
            paranetUAL,
            subjectUAL,
        } = this.inputService.getAssetGetArguments(options);

        this.validationService.validateAssetGet(
            UAL,
            blockchain,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            state,
            includeMetadata,
            contentType,
            hashFunctionId,
            validate,
            outputFormat,
            authToken,
            subjectUAL,
        );

        const getOperationId = await this.nodeApiService.get(
            endpoint,
            port,
            authToken,
            UAL,
            state,
            includeMetadata,
            subjectUAL,
            contentType,
            hashFunctionId,
            paranetUAL,
        );

        const getOperationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.GET,
            maxNumberOfRetries,
            frequency,
            getOperationId,
        );
        if (subjectUAL) {
            if (getOperationResult.data?.length) {
                return {
                    operation: {
                        get: getOperationStatusObject(getOperationResult, getOperationId),
                    },
                    subjectUALPairs: getOperationResult.data,
                };
            }
            if (getOperationResult.status !== 'FAILED') {
                getOperationResult.data = {
                    errorType: 'DKG_CLIENT_ERROR',
                    errorMessage: 'Unable to find assertion on the network!',
                };
                getOperationResult.status = 'FAILED';
            }

            return {
                operation: {
                    get: getOperationStatusObject(getOperationResult, getOperationId),
                },
            };
        }
        const { metadata } = getOperationResult.data;
        const { assertion } = getOperationResult.data;

        if (!assertion) {
            if (getOperationResult.status !== 'FAILED') {
                getOperationResult.data = {
                    errorType: 'DKG_CLIENT_ERROR',
                    errorMessage: 'Unable to find assertion on the network!',
                };
                getOperationResult.status = 'FAILED';
            }

            return {
                operation: {
                    get: getOperationStatusObject(getOperationResult, getOperationId),
                },
            };
        }

        if (validate === true) {
            const isValid = true; // TODO: validate assertion
            if (!isValid) {
                getOperationResult.data = {
                    errorType: 'DKG_CLIENT_ERROR',
                    errorMessage: "Calculated root hashes don't match!",
                };
            }
        }

        let formattedAssertion = [...(assertion.public ?? []), ...(assertion.private ?? [])].join(
            '\n',
        );
        let formattedMetadata;
        if (outputFormat === GET_OUTPUT_FORMATS.JSON_LD) {
            formattedAssertion = await toJSONLD(formattedAssertion);

            if (includeMetadata) {
                formattedMetadata = await toJSONLD(metadata.join('\n'));
            }
        }
        if (outputFormat === GET_OUTPUT_FORMATS.N_QUADS) {
            formattedAssertion = await toNQuads(formattedAssertion, 'application/n-quads');
            if (includeMetadata) {
                formattedMetadata = await toNQuads(metadata.join('\n'), 'application/n-quads');
            }
        }

        return {
            assertion: formattedAssertion,
            ...(includeMetadata && metadata && { metadata: formattedMetadata }),
            operation: {
                get: getOperationStatusObject(getOperationResult, getOperationId),
            },
        };
    }

    /**
     * Checks whether KA is finalized on the node.
     * @async
     * @param {string} UAL - The Universal Asset Locator, representing asset or collection.
     */
    async publishFinality(UAL, options = {}) {
        const {
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            minimumNumberOfFinalizationConfirmations,
            authToken,
        } = this.inputService.getPublishFinalityArguments(options);

        // blockchain not mandatory so it's not validated
        this.validationService.validatePublishFinality(
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            minimumNumberOfFinalizationConfirmations,
            authToken,
        );

        const finalityStatusResult = await this.nodeApiService.finalityStatus(
            endpoint,
            port,
            authToken,
            UAL,
        );

        if (finalityStatusResult >= minimumNumberOfFinalizationConfirmations) {
            return {
                status: 'FINALIZED',
                numberOfConfirmations: finalityStatusResult,
                requiredConfirmations: minimumNumberOfFinalizationConfirmations,
            };
        }
        return {
            status: 'NOT FINALIZED',
            numberOfConfirmations: finalityStatusResult,
            requiredConfirmations: minimumNumberOfFinalizationConfirmations,
        };
    }
}
