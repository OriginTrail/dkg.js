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
     * An asynchronous function that executes a SPARQL query using an API endpoint and returns the query result.
     * @async
     * @param {string} queryString - The string representation of the SPARQL query to be executed.
     * @param {string} queryType - The type of the SPARQL query, "CONSTRUCT" or "SELECT".
     * @param {Object} [options={}] - An object containing additional options for the query execution.
     * @returns {Promise} A Promise that resolves to the query result.
     */
    async query(queryString, queryType, options = {}) {
        const { endpoint, port, maxNumberOfRetries, frequency, authToken, paranetUAL, repository, nodeApiVersion } =
            this.inputService.getQueryArguments(options);

        this.validationService.validateGraphQuery(
            queryString,
            queryType,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            authToken,
            repository,
            nodeApiVersion,
        );

        const operationId = await this.nodeApiService.query(
            endpoint,
            port,
            authToken,
            queryString,
            queryType,
            paranetUAL,
            repository,
            nodeApiVersion,
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
            (await this.blockchainService.getStakeWeightedAverageAsk()) * epochsNum * datasetSize;

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
