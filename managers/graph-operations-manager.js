import { kaTools, kcTools } from 'assertion-tools';
import { ethers } from 'ethers';
import {
    OPERATIONS,
    GET_OUTPUT_FORMATS,
    CHUNK_BYTE_SIZE,
    OPERATION_STATUSES,
    OPERATION_DELAYS,
    PRIVATE_RESOURCE_PREDICATE,
    PRIVATE_HASH_SUBJECT_PREFIX,
    PRIVATE_ASSERTION_PREDICATE,
} from '../constants.js';
import {
    getOperationStatusObject,
    resolveUAL,
    deriveUAL,
    sleepForMilliseconds,
    toNQuads,
    toJSONLD,
} from '../services/utilities.js';
import emptyHooks from '../util/empty-hooks.js';

export default class GraphOperationsManager {
    constructor(services) {
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
        this.inputService = services.inputService;
        this.blockchainService = services.blockchainService;
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
        const { assertion, metadata } = getOperationResult.data;

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

        let formattedAssertion;
        let formattedMetadata;
        if (outputFormat === GET_OUTPUT_FORMATS.JSON_LD) {
            formattedAssertion = await toJSONLD(assertion.join('\n'));
            if (includeMetadata) {
                formattedMetadata = await toJSONLD(metadata.join('\n'));
            }
        }
        if (outputFormat === GET_OUTPUT_FORMATS.N_QUADS) {
            formattedAssertion = await toNQuads(assertion, 'application/n-quads');
            if (includeMetadata) {
                formattedMetadata = await toNQuads(metadata, 'application/n-quads');
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
     * An asynchronous function that executes a SPARQL query using an API endpoint and returns the query result.
     * @async
     * @param {string} queryString - The string representation of the SPARQL query to be executed.
     * @param {string} queryType - The type of the SPARQL query, "CONSTRUCT" or "SELECT".
     * @param {Object} [options={}] - An object containing additional options for the query execution.
     * @returns {Promise} A Promise that resolves to the query result.
     */
    async query(queryString, queryType, options = {}) {
        const {
            // graphLocation,
            // graphState,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            authToken,
            paranetUAL,
        } = this.inputService.getQueryArguments(options);

        this.validationService.validateGraphQuery(
            queryString,
            queryType,
            // graphLocation,
            // graphState,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            authToken,
        );

        const operationId = await this.nodeApiService.query(
            endpoint,
            port,
            authToken,
            queryString,
            queryType,
            // graphState,
            // graphLocation,
            paranetUAL,
        );

        return this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.QUERY,
            maxNumberOfRetries,
            frequency,
            operationId,
        );
    }

    /**
     * Creates a new knowledge collection.
     * @async
     * @param {Object} content - The content of the knowledge collection to be created, contains public, private or both keys.
     * @param {Object} [options={}] - Additional options for knowledge collection creation.
     * @param {Object} [stepHooks=emptyHooks] - Hooks to execute during knowledge collection creation.
     * @returns {Object} Object containing UAL, publicAssertionMerkleRoot and operation status.
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
            paranetUAL,
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
            paranetUAL,
            payer,
            minimumNumberOfFinalizationConfirmations,
            minimumNumberOfNodeReplications,
        );

        let assertion = {};
        if (typeof content === 'string') {
            assertion.public = this.processContent(content);
        } else if (
            typeof content.public === 'string' ||
            (!content.public && content.private && typeof content.private === 'string')
        ) {
            if (content.public) {
                assertion.public = this.processContent(content.public);
            } else {
                assertion.public = [];
            }
            if (content.private && typeof content.private === 'string') {
                assertion.private = this.processContent(content.private);
            }
        } else {
            assertion = await kcTools.formatDataset(content);
        }

        if (assertion.private?.length) {
            assertion.private = kcTools.generateMissingIdsForBlankNodes(assertion.private);

            const privateTriplesGrouped = kcTools.groupNquadsBySubject(assertion.private, true);
            assertion.private = privateTriplesGrouped.flat();
            const privateRoot = kcTools.calculateMerkleRoot(assertion.private);
            assertion.public.push(
                `<${kaTools.generateNamedNode()}> <${PRIVATE_ASSERTION_PREDICATE}> "${privateRoot}" .`,
            );

            if (assertion.public.length) {
                assertion.public = kcTools.generateMissingIdsForBlankNodes(assertion.public);
            }
            let publicTriplesGrouped = kcTools.groupNquadsBySubject(assertion.public, true);

            const mergedTriples = [];
            let publicIndex = 0;
            let privateIndex = 0;
            const publicLength = publicTriplesGrouped.length;
            const privateLength = privateTriplesGrouped.length;

            // Merge public and private hashes triples in a single pass
            while (publicIndex < publicLength && privateIndex < privateLength) {
                const publicGroup = publicTriplesGrouped[publicIndex];
                const [publicSubject] = publicGroup[0].split(' ');
                const [privateSubject] = privateTriplesGrouped[privateIndex][0].split(' ');

                const compare = publicSubject.localeCompare(privateSubject);
                if (compare < 0) {
                    // Public subject comes before private subject
                    mergedTriples.push(publicGroup);
                    publicIndex++;
                } else if (compare > 0) {
                    // Private subject comes before public subject
                    mergedTriples.push([this.generatePrivateRepresentation(privateSubject)]);
                    privateIndex++;
                } else {
                    // Subjects match, merge triples
                    this.insertTripleSorted(
                        publicGroup,
                        this.generatePrivateRepresentation(privateSubject),
                    );
                    mergedTriples.push(publicGroup);
                    publicIndex++;
                    privateIndex++;
                }
            }

            while (publicIndex < publicLength) {
                mergedTriples.push(...publicTriplesGrouped[publicIndex]);
                publicIndex++;
            }

            // Append any remaining private triples
            while (privateIndex < privateLength) {
                const [privateSubject] = privateTriplesGrouped[privateIndex][0].split(' ');
                mergedTriples.push([this.generatePrivateRepresentation(privateSubject)]);
                privateIndex++;
            }
            // Update the public assertion with the merged triples
            assertion.public = mergedTriples.flat();
        } else {
            // If there's no private assertion, ensure public is grouped correctly
            assertion.public = kcTools.groupNquadsBySubject(assertion.public, true).flat();
        }

        const numberOfChunks = kcTools.calculateNumberOfChunks(assertion.public, CHUNK_BYTE_SIZE);
        const assertionSize = numberOfChunks * CHUNK_BYTE_SIZE;

        this.validationService.validateAssertionSizeInBytes(assertionSize);
        const assertionMerkleRoot = kcTools.calculateMerkleRoot(assertion.public);

        const contentAssetStorageAddress = await this.blockchainService.getContractAddress(
            'ContentAssetStorage',
            blockchain,
        );

        const publishOperationId = await this.nodeApiService.publish(
            endpoint,
            port,
            authToken,
            assertionMerkleRoot,
            assertion,
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

        if (publishOperationResult.status !== OPERATION_STATUSES.COMPLETED) {
            return {
                assertionMerkleRoot,
                operation: {
                    publish: getOperationStatusObject(publishOperationResult, publishOperationId),
                },
            };
        }

        const estimatedPublishingCost =
            tokenAmount ??
            (await this.blockchainService.getStakeWeightedAverageAsk()) * epochsNum * assertionSize;

        let tokenId;
        let mintKnowledgeAssetReceipt;

        if (paranetUAL == null) {
            ({ tokenId, receipt: mintKnowledgeAssetReceipt } =
                await this.blockchainService.createAsset(
                    {
                        publishOperationId,
                        assertionMerkleRoot,
                        assertionSize,
                        triplesNumber: kaTools.getAssertionTriplesNumber(assertion.public), // todo
                        chunksNumber: numberOfChunks,
                        epochsNum,
                        tokenAmount: estimatedPublishingCost,
                        scoreFunctionId: scoreFunctionId ?? 1,
                        immutable_: immutable,
                        // payer: payer,
                    },
                    null,
                    null,
                    blockchain,
                    stepHooks,
                ));
        } else {
            const { contract: paranetKaContract, tokenId: paranetTokenId } = resolveUAL(paranetUAL);
            ({ tokenId, receipt: mintKnowledgeAssetReceipt } =
                await this.blockchainService.createAsset(
                    {
                        publishOperationId,
                        assertionMerkleRoot,
                        assertionSize,
                        triplesNumber: kaTools.getAssertionTriplesNumber(assertion), // todo
                        chunksNumber: kcTools.calculateNumberOfChunks(assertion),
                        epochsNum,
                        tokenAmount: estimatedPublishingCost,
                        scoreFunctionId: scoreFunctionId ?? 1,
                        immutable_: immutable,
                        // payer: payer,
                    },
                    paranetKaContract,
                    paranetTokenId,
                    blockchain,
                    stepHooks,
                ));
        }

        const UAL = deriveUAL(blockchain.name, contentAssetStorageAddress, tokenId);

        const finalitySleepDelay = OPERATION_DELAYS.FINALITY;

        await sleepForMilliseconds(finalitySleepDelay);

        const finalityStatusResult = await this.nodeApiService.finalityStatus(
            endpoint,
            port,
            authToken,
            UAL,
        );

        return {
            UAL,
            assertionMerkleRoot,
            signatures: publishOperationResult.data,
            operation: {
                mintKnowledgeAsset: mintKnowledgeAssetReceipt,
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

    generatePrivateRepresentation(privateSubject) {
        return `${`<${PRIVATE_HASH_SUBJECT_PREFIX}${ethers.solidityPackedSha256(
            ['string'],
            [privateSubject.slice(1, -1)],
        )}>`} <${PRIVATE_RESOURCE_PREDICATE}> <${kaTools.generateNamedNode()}> .`;
    }

    /**
     * Creates a new asset and stores it locally on the node.
     * @async
     * @param {Object} content - The content of the asset to be created, contains public, private or both keys.
     * @param {Object} [options={}] - Additional options for asset creation.
     * @param {Object} [stepHooks=emptyHooks] - Hooks to execute during asset creation.
     * @returns {Object} Object containing UAL, publicAssertionMerkleRoot and operation status.
     */
    async localStore(content, options = {}, stepHooks = emptyHooks) {
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
            paranetUAL,
        } = this.inputService.getAssetLocalStoreArguments(options);

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
            paranetUAL,
        );

        let assertion;

        if (typeof content === 'string') {
            assertion = content
                .split('\n')
                .map((line) => line.trimStart().trimEnd())
                .filter((line) => line.trim() !== '');
        } else {
            assertion = await kcTools.formatDataset(content);
        }

        const numberOfChunks = kcTools.calculateNumberOfChunks(assertion, CHUNK_BYTE_SIZE);

        const assertionSize = numberOfChunks * CHUNK_BYTE_SIZE;

        this.validationService.validateAssertionSizeInBytes(assertionSize);
        const assertionMerkleRoot = kcTools.calculateMerkleRoot(assertion);

        const contentAssetStorageAddress = await this.blockchainService.getContractAddress(
            'ContentAssetStorage',
            blockchain,
        );

        const localStoreOperationId = await this.nodeApiService.localStore(
            endpoint,
            port,
            authToken,
            assertion,
            null, // full path to cached assertions
        );

        const localStoreOperationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.LOCAL_STORE,
            maxNumberOfRetries,
            frequency,
            localStoreOperationId,
        );

        if (localStoreOperationResult.status !== OPERATION_STATUSES.COMPLETED) {
            return {
                assertionMerkleRoot,
                operation: {
                    publish: getOperationStatusObject(
                        localStoreOperationResult,
                        localStoreOperationId,
                    ),
                },
            };
        }

        const estimatedPublishingCost =
            tokenAmount ??
            (await this.blockchainService.getStakeWeightedAverageAsk()) * epochsNum * assertionSize;

        const { tokenId, receipt: mintKnowledgeAssetReceipt } =
            await this.blockchainService.createAsset(
                {
                    localStoreOperationId,
                    assertionMerkleRoot,
                    assertionSize: assertionSize,
                    triplesNumber: kaTools.getAssertionTriplesNumber(assertion), // todo
                    chunksNumber: numberOfChunks,
                    epochsNum,
                    tokenAmount: estimatedPublishingCost,
                    scoreFunctionId: scoreFunctionId ?? 1,
                    immutable_: immutable,
                    // payer: payer,
                },
                null,
                null,
                blockchain,
                stepHooks,
            );

        const UAL = deriveUAL(blockchain.name, contentAssetStorageAddress, tokenId);
        // let fullPathToCachedAssertion = null;
        // if (assertionCachedLocally) {
        //     const absolutePath = path.resolve('.');
        //     const directory = 'local-store-cache';
        //     await mkdir(directory, { recursive: true });
        //     fullPathToCachedAssertion = path.join(
        //         absolutePath,
        //         directory,
        //         assertions[0].assertionMerkleRoot,
        //     );
        //     await writeFile(fullPathToCachedAssertion, JSON.stringify(assertions));
        // }

        return {
            UAL,
            assertionMerkleRoot,
            operation: {
                mintKnowledgeAsset: mintKnowledgeAssetReceipt,
                localStore: getOperationStatusObject(
                    localStoreOperationResult,
                    localStoreOperationId,
                ),
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
            blockchain,
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

        if (finalityStatusResult === 0) {
            const finalityOperationId = await this.nodeApiService.finality(
                endpoint,
                port,
                authToken,
                blockchain.name,
                UAL,
                minimumNumberOfFinalizationConfirmations,
            );

            try {
                return this.nodeApiService.getOperationResult(
                    endpoint,
                    port,
                    authToken,
                    OPERATIONS.FINALITY,
                    maxNumberOfRetries,
                    frequency,
                    finalityOperationId,
                );
            } catch (error) {
                console.error(`Finality attempt failed:`, error.message);
                return {
                    status: 'NOT FINALIZED',
                    error: error.message,
                };
            }
        } else if (finalityStatusResult >= minimumNumberOfFinalizationConfirmations) {
            return {
                status: 'FINALIZED',
                numberOfConfirmations: finalityStatusResult,
                requiredConfirmations: minimumNumberOfFinalizationConfirmations,
            };
        } else {
            return {
                status: 'NOT FINALIZED',
                numberOfConfirmations: finalityStatusResult,
                requiredConfirmations: minimumNumberOfFinalizationConfirmations,
            };
        }
    }
}
