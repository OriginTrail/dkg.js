const { assertionMetadata, calculateRoot, formatGraph } = require('assertion-tools');
const {
    deriveUAL,
    getOperationStatusObject,
} = require('../services/utilities.js');
const {
    OPERATIONS,
    OPERATIONS_STEP_STATUS,
    DEFAULT_GET_LOCAL_STORE_RESULT_FREQUENCY,
} = require('../constants.js');
const emptyHooks = require('../util/empty-hooks');

class CollectionOperationsManager {
    constructor(services) {
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
    }

    async create(contentArray, tokenAmount, options = {}, stepHooks = emptyHooks) {
      const {
          blockchain,
          endpoint,
          port,
          maxNumberOfRetries,
          authToken,
      } = this.inputService.getCollectionCreateArguments(options);

      const knowledgeAssets = [];
      let totalSize = 0;
      let totalTriplesNumber = 0;
      for (const [index, content] of contentArray.entries()) {
        const { public: publicAssertion } = await formatGraph(
            {public: content},
        );
        const publicAssertionId = calculateRoot(publicAssertion);

        knowledgeAssets.push({
            assertionId: publicAssertionId,
            assertion: publicAssertion,
        });

        const publicAssertionSizeInBytes = assertionMetadata.getAssertionSizeInBytes(publicAssertion);
        totalSize += publicAssertionSizeInBytes;

        const publicAssertionTriplesNumber = assertionMetadata.getAssertionTriplesNumber(publicAssertion);
        totalTriplesNumber += publicAssertionTriplesNumber;
      }

      const knowledgeCollectionAddress = await this.blockchainService.getContractAddress(
          'KnowledgeCollection',
          blockchain,
      );
      const merkleRoot = '0x2a1acd26847576a128e3dba3aa984feafffdf81f7c7b23bdf51e7bec1c15944c';

      await this.blockchainService.createCollection(
          {
              newMerkleRoot: merkleRoot,
              quantity: knowledgeAssets.length,
              size: totalSize,
              chunksNumber: totalTriplesNumber,
              tokenAmount,
          },
          blockchain,
          stepHooks,
      );

      const UAL = deriveUAL(blockchain.name, knowledgeCollectionAddress, 1);

      const operationId = await this.nodeApiService.collectionLocalStore(
          endpoint,
          port,
          authToken,
          {
            merkleRoot,
            knowledgeAssets,
            blockchain: blockchain.name,
            contract: knowledgeCollectionAddress,
          },
      );

      const operationResult = await this.nodeApiService.getOperationResult(
          endpoint,
          port,
          authToken,
          OPERATIONS.COLLECTION_LOCAL_STORE,
          maxNumberOfRetries,
          DEFAULT_GET_LOCAL_STORE_RESULT_FREQUENCY,
          operationId,
      );

      stepHooks.afterHook({
          status: OPERATIONS_STEP_STATUS.CREATE_ASSET_COMPLETED,
          data: {
              operationId,
              operationResult,
          },
      });

      return {
          knowledgeCollectionUAL: UAL,
          operation: getOperationStatusObject(operationResult, operationId),
      };
  }
}

module.exports = CollectionOperationsManager;
