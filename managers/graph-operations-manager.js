const {
    formatDataset,
    calculateNumberOfChunks,
    calculateRoot,
    flattenDataset,
    assertionMetadata,
} = require('assertion-tools');
const { OPERATIONS, CHUNK_BYTE_SIZE } = require('../constants');
const {
    deriveRepository,
    getOperationStatusObject,
    resolveUAL,
    deriveUAL,
} = require('../services/utilities.js');
const emptyHooks = require('../util/empty-hooks.js');

class GraphOperationsManager {
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
        const {
            graphLocation,
            graphState,
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
            graphLocation,
            graphState,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            authToken,
        );

        const repository = paranetUAL ?? deriveRepository(graphLocation, graphState);

        const operationId = await this.nodeApiService.query(
            endpoint,
            port,
            authToken,
            queryString,
            queryType,
            repository,
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
        );

        let dataset;

        if (typeof content === 'string') {
            dataset = content.split('\n').filter((line) => line.trim() !== '');
        } else {
            const flattenedDataset = await flattenDataset(content);
            dataset = await formatDataset(flattenedDataset);
        }

        const numberOfChunks = calculateNumberOfChunks(dataset, CHUNK_BYTE_SIZE);

        const datasetSize = numberOfChunks * CHUNK_BYTE_SIZE;

        this.validationService.validateAssertionSizeInBytes(datasetSize);
        const datasetRoot = await calculateRoot(dataset);

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
            contentAssetStorageAddress,
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

        if (publishOperationResult.status === OPERATION_STATUSES.FAILED) {
            return {
                datasetRoot: datasetRoot,
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
                        datasetRoot,
                        assertionSize: datasetSize,
                        triplesNumber: assertionMetadata.getAssertionTriplesNumber(dataset), // todo
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
                        datasetRoot,
                        assertionSize: datasetSize,
                        triplesNumber: assertionMetadata.getAssertionTriplesNumber(dataset), // todo
                        chunksNumber: calculateNumberOfChunks(dataset),
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

        // node finality api check for UAL

        return {
            UAL,
            datasetRoot,
            operation: {
                mintKnowledgeAsset: mintKnowledgeAssetReceipt,
                publish: getOperationStatusObject(publishOperationResult, publishOperationId),
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
            assertionCachedLocally,
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
            dataset = content.split('\n').filter((line) => line.trim() !== '');
        } else {
            const flattenedDataset = await flattenDataset(content);
            dataset = await formatDataset(flattenedDataset);
        }

        const numberOfChunks = calculateNumberOfChunks(dataset, CHUNK_BYTE_SIZE);

        const datasetSize = numberOfChunks * CHUNK_BYTE_SIZE;

        this.validationService.validateAssertionSizeInBytes(datasetSize);
        const datasetRoot = await calculateRoot(dataset);

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

        if (localStoreOperationResult.status === OPERATION_STATUSES.FAILED) {
            return {
                datasetRoot: datasetRoot,
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
                    datasetRoot,
                    assertionSize: datasetSize,
                    triplesNumber: assertionMetadata.getAssertionTriplesNumber(dataset), // todo
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
            datasetRoot: datasetRoot,
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
module.exports = GraphOperationsManager;
