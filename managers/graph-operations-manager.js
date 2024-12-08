import { kaTools, kcTools } from 'assertion-tools';
import {
    OPERATIONS,
    GET_OUTPUT_FORMATS,
    CHUNK_BYTE_SIZE,
    OPERATION_STATUSES,
    OPERATION_DELAYS,
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
        );

        const getOperationId = await this.nodeApiService.get(
            endpoint,
            port,
            authToken,
            UAL,
            state,
            includeMetadata,
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
            paranetUAL,
            payer,
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
            }
            if (content.private && typeof content.private === 'string') {
                dataset.private = this.processContent(content.private);
            }
        } else {
            dataset = await kcTools.formatDataset(content);
        }

        dataset.public = kcTools.generateMissingIdsForBlankNodes(dataset.public);
        if (dataset.private) {
            dataset.private = kcTools.generateMissingIdsForBlankNodes(dataset.private);
        }

        // Ensure we have a list for private Tripless even if not provided
        const publicTriplesSortedAndGrouped = kcTools.groupNquadsBySubject(dataset.public, true);
        const privateTriplesSortedAndGrouped = dataset.private
            ? kcTools.groupNquadsBySubject(dataset.private, true)
            : [];

        // A helper function to generate the private merkle root Triples
        function createPrivateMerkleRootTriple(subject, Tripless) {
            const merkleRoot = kcTools.calculateMerkleRoot(Tripless);
            return `${subject} <${PRIVATE_ASSERTION_PREDICATE}> "${merkleRoot}" .`;
        }

        let publicIndex = 0;
        let privateIndex = 0;

        while (
            publicIndex < publicTriplesSortedAndGrouped.length ||
            privateIndex < privateTriplesSortedAndGrouped.length
        ) {
            // If we've exhausted all private Tripless, we're done.
            if (privateIndex === privateTriplesSortedAndGrouped.length) {
                break;
            }

            // If we've exhausted all public Tripless, just append all remaining private Tripless.
            if (publicIndex === publicTriplesSortedAndGrouped.length) {
                const [privateSubject] = privateTriplesSortedAndGrouped[privateIndex][0].split(' ');
                const privateMerkleRootTriple = createPrivateMerkleRootTriple(
                    privateSubject,
                    privateTriplesSortedAndGrouped[privateIndex],
                );
                publicTriplesSortedAndGrouped.push([privateMerkleRootTriple]);
                privateIndex += 1;
                continue;
            }

            const [publicSubject] = publicTriplesSortedAndGrouped[publicIndex][0].split(' ');
            const [privateSubject] = privateTriplesSortedAndGrouped[privateIndex][0].split(' ');
            const compare = publicSubject.localeCompare(privateSubject);

            if (compare < 0) {
                // The public subject comes before the private one, move forward in public
                publicIndex += 1;
            } else if (compare > 0) {
                // The private subject comes before the public one, insert new Tripless array in public
                const privateMerkleRootTriple = createPrivateMerkleRootTriple(
                    privateSubject,
                    privateTriplesSortedAndGrouped[privateIndex],
                );
                publicTriplesSortedAndGrouped.splice(publicIndex, 0, [privateMerkleRootTriple]);
                publicIndex += 1;
                privateIndex += 1;
            } else {
                // Subjects match, append private merkle root to the existing public Triples array
                const privateMerkleRootTriple = createPrivateMerkleRootTriple(
                    privateSubject,
                    privateTriplesSortedAndGrouped[privateIndex],
                );
                publicTriplesSortedAndGrouped[publicIndex].push(privateMerkleRootTriple);
                publicIndex += 1;
                privateIndex += 1;
            }
        }

        dataset.public = publicTriplesSortedAndGrouped.flat();
        if (dataset.private) {
            dataset.private = privateTriplesSortedAndGrouped.flat();
        }

        const numberOfChunks = kcTools.calculateNumberOfChunks(dataset.public, CHUNK_BYTE_SIZE);
        const datasetSize = numberOfChunks * CHUNK_BYTE_SIZE;

        this.validationService.validateAssertionSizeInBytes(datasetSize);
        const datasetRoot = kcTools.calculateMerkleRoot(dataset.public);

        const contentAssetStorageAddress = await this.blockchainService.getContractAddress(
            'ContentAssetStorage',
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
                datasetRoot,
                operation: {
                    publish: getOperationStatusObject(publishOperationResult, publishOperationId),
                },
            };
        }

        const estimatedPublishingCost =
            tokenAmount ??
            (await this.nodeApiService.getBidSuggestion(
                endpoint,
                port,
                authToken,
                blockchain.name,
                epochsNum,
                datasetSize,
                contentAssetStorageAddress,
                datasetRoot,
                hashFunctionId,
            ));

        let tokenId;
        let mintKnowledgeAssetReceipt;

        if (paranetUAL == null) {
            ({ tokenId, receipt: mintKnowledgeAssetReceipt } =
                await this.blockchainService.createAsset(
                    {
                        publishOperationId,
                        datasetRoot,
                        datasetSize,
                        triplesNumber: kaTools.getAssertionTriplesNumber(dataset.public), // todo
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
                        datasetRoot,
                        datasetSize,
                        triplesNumber: kaTools.getAssertionTriplesNumber(dataset), // todo
                        chunksNumber: kcTools.calculateNumberOfChunks(dataset),
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

        const finalityOperationId = await this.nodeApiService.finality(
            endpoint,
            port,
            authToken,
            blockchain.name,
            UAL,
            minimumNumberOfNodeReplications,
        );

        let finalityOperationResult = null;

        // TO DO: ADD OPTIONAL WAITING FOR FINALITY
        try {
            finalityOperationResult = await this.nodeApiService.getOperationResult(
                endpoint,
                port,
                authToken,
                OPERATIONS.FINALITY,
                maxNumberOfRetries,
                frequency,
                finalityOperationId,
            );
        } catch (error) {
            console.error(`Attempt failed:`, error.message);
        }

        return {
            UAL,
            datasetRoot,
            signatures: publishOperationResult.data,
            operation: {
                mintKnowledgeAsset: mintKnowledgeAssetReceipt,
                publish: getOperationStatusObject(publishOperationResult, publishOperationId),
                finality: finalityOperationResult,
            },
        };
    }
    /**
     * Creates a new asset and stores it locally on the node.
     * @async
     * @param {Object} content - The content of the asset to be created, contains public, private or both keys.
     * @param {Object} [options={}] - Additional options for asset creation.
     * @param {Object} [stepHooks=emptyHooks] - Hooks to execute during asset creation.
     * @returns {Object} Object containing UAL, publicAssertionId and operation status.
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

        let dataset;

        if (typeof content === 'string') {
            dataset = content
                .split('\n')
                .map((line) => line.trimStart().trimEnd())
                .filter((line) => line.trim() !== '');
        } else {
            dataset = await kcTools.formatDataset(content);
        }

        const numberOfChunks = kcTools.calculateNumberOfChunks(dataset, CHUNK_BYTE_SIZE);

        const datasetSize = numberOfChunks * CHUNK_BYTE_SIZE;

        this.validationService.validateAssertionSizeInBytes(datasetSize);
        const datasetRoot = kcTools.calculateMerkleRoot(dataset);

        const contentAssetStorageAddress = await this.blockchainService.getContractAddress(
            'ContentAssetStorage',
            blockchain,
        );

        const localStoreOperationId = await this.nodeApiService.localStore(
            endpoint,
            port,
            authToken,
            dataset,
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
                datasetRoot,
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
            (await this.nodeApiService.getBidSuggestion(
                endpoint,
                port,
                authToken,
                blockchain.name,
                epochsNum,
                datasetSize,
                contentAssetStorageAddress,
                datasetRoot,
                hashFunctionId,
            ));

        const { tokenId, receipt: mintKnowledgeAssetReceipt } =
            await this.blockchainService.createAsset(
                {
                    localStoreOperationId,
                    datasetRoot,
                    assertionSize: datasetSize,
                    triplesNumber: kaTools.getAssertionTriplesNumber(dataset), // todo
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
        //         assertions[0].assertionId,
        //     );
        //     await writeFile(fullPathToCachedAssertion, JSON.stringify(assertions));
        // }

        return {
            UAL,
            datasetRoot,
            operation: {
                mintKnowledgeAsset: mintKnowledgeAssetReceipt,
                localStore: getOperationStatusObject(
                    localStoreOperationResult,
                    localStoreOperationId,
                ),
            },
        };
    }
}
