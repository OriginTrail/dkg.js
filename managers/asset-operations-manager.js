const {
  assertionMetadata,
  formatAssertion,
  calculateRoot,
} = require("assertion-tools");
const Utilities = require("../services/utilities.js");
const AssertionOperationsManager = require("./assertion-operations-manager.js");
const jsonld = require("jsonld");
const {
  OPERATIONS,
  PUBLISH_TYPES,
  DEFAULT_HASH_FUNCTION_ID,
  OPERATIONS_STEP_STATUS,
  GET_OUTPUT_FORMATS,
} = require("../constants.js");
const emptyHooks = require("../util/empty-hooks");

class AssetOperationsManager {
  constructor(config, services) {
    this.nodeApiService = services.nodeApiService;
    this.validationService = services.validationService;
    this.blockchainService = services.blockchainService;
    this.assertionOperationsManager = new AssertionOperationsManager(
      config,
      services
    );
  }

  async create(content, opts = {}, stepHooks = emptyHooks) {

    const options = JSON.parse(JSON.stringify(opts));

    this.validationService.validatePublishRequest(content, options);

    const assertion = await formatAssertion(content);
    const assertionId = calculateRoot(assertion);
    const tokenAmountInWei =
      options.tokenAmount ??
      (await this.nodeApiService.getBidSuggestion(
        options.blockchain.name,
        options.epochsNum,
        assertionMetadata.getAssertionSizeInBytes(assertion),
        options.hashFunctionId ?? DEFAULT_HASH_FUNCTION_ID,
        options
      ));

    const tokenId = await this.blockchainService.createAsset(
      {
        assertionId,
        assertionSize: assertionMetadata.getAssertionSizeInBytes(assertion),
        triplesNumber: assertionMetadata.getAssertionTriplesNumber(assertion),
        chunksNumber: assertionMetadata.getAssertionChunksNumber(assertion),
        epochsNum: options.epochsNum,
        tokenAmount: tokenAmountInWei,
        scoreFunctionId: options.scoreFunctionId ?? 1,
      },
      options,
      stepHooks
    );

    const blockchain = this.blockchainService.getBlockchain(options)
    const UAL = Utilities.deriveUAL(
      blockchain.name,
      await this.blockchainService.getContractAddress(
        blockchain.name,
        "ContentAssetStorage",
        blockchain.rpc
      ),
      tokenId
    );

    const operationId = await this.nodeApiService.publish(
      PUBLISH_TYPES.ASSET,
      assertionId,
      assertion,
      UAL,
      options
    );

    const operationResult = await this.nodeApiService.getOperationResult(
      operationId,
      { ...options, operation: OPERATIONS.publish }
    );

    stepHooks.afterHook({
      status: OPERATIONS_STEP_STATUS.CREATE_ASSET_COMPLETED,
      data: {
        operationId,
        operationResult,
      },
    });

    return {
      UAL,
      assertionId,
      operation: Utilities.getOperationStatusObject(
        operationResult,
        operationId
      ),
    };
  }

  async get(UAL, opts = {}) {
    const options = JSON.parse(JSON.stringify(opts));
    this.validationService.validateGetRequest(UAL, options);
    const { tokenId } = Utilities.resolveUAL(UAL);

    const assertionId = await this.blockchainService.getLatestAssertionId(tokenId, options);

    let operationId = await this.nodeApiService.get(UAL, options);
    let operationResult = await this.nodeApiService.getOperationResult(
      operationId,
      { ...options, operation: OPERATIONS.get }
    );
    let assertion = operationResult.data.assertion;
    if (assertion) {
      try {
        if (options.validate === true) {
          if (calculateRoot(assertion) !== assertionId)
            throw Error("Calculated root hashes don't match!");
        }
        if (options.outputFormat !== GET_OUTPUT_FORMATS.N_QUADS) {
          assertion = await jsonld.fromRDF(assertion.join("\n"), {
            algorithm: "URDNA2015",
            format: "application/n-quads",
          });
        }
      } catch (error) {
        operationResult = {
          ...operationResult,
          data: {
            errorType: "DKG_CLIENT_ERROR",
            errorMessage: error.message,
          },
        };
      }
    }

    return {
      assertion,
      assertionId,
      operation: Utilities.getOperationStatusObject(
        operationResult,
        operationId
      ),
    };
  }

  /* async update(UAL, content, opts = {}) {
    const options = JSON.parse(JSON.stringify(opts));
    this.validationService.validatePublishRequest(content, options);

    const assertion = await formatAssertion(content);
    const assertionId = calculateRoot(assertion);
    const tokenAmount =
      options.tokenAmount ??
      (await this.nodeApiService.getBidSuggestion(
        options.blockchain.name,
        options.epochsNum,
        assertionMetadata.getAssertionSizeInBytes(assertion),
        options.hashFunctionId ?? DEFAULT_HASH_FUNCTION_ID,
        options
      ));

    await this.blockchainService.updateAsset(
      Utilities.resolveUAL(UAL).tokenId,
      {
        assertionId,
        assertionSize: assertionMetadata.getAssertionSizeInBytes(assertion),
        triplesNumber: assertionMetadata.getAssertionTriplesNumber(assertion),
        chunksNumber: assertionMetadata.getAssertionChunksNumber(assertion),
        epochsNum: options.epochsNum,
        tokenAmount: tokenAmount,
        scoreFunctionId: options.scoreFunctionId ?? 1,
      },
      options
    );
    let operationId = await this.nodeApiService.publish(
      PUBLISH_TYPES.ASSET,
      assertionId,
      assertion,
      UAL,
      options
    );
    let operationResult = await this.nodeApiService.getOperationResult(
      operationId,
      { ...options, operation: OPERATIONS.publish }
    );
    return {
      UAL,
      assertionId,
      operation: Utilities.getOperationStatusObject(
        operationResult,
        operationId
      ),
    };
  } */

  async transfer(UAL, to, opts = {}) {
    const options = JSON.parse(JSON.stringify(opts));
    this.validationService.validateAssetTransferRequest(UAL, to, options);
    const { tokenId } = Utilities.resolveUAL(UAL);
    await this.blockchainService.transferAsset(tokenId, to, options);
    const owner = await this.blockchainService.getAssetOwner(tokenId, options);
    return {
      UAL: UAL,
      owner: owner,
      operation: Utilities.getOperationStatusObject(
        { status: "COMPLETED" },
        null
      ),
    };
  }

  async getOwner(UAL, opts = {}) {
    const options = JSON.parse(JSON.stringify(opts));
    this.validationService.validateGetOwnerRequest(UAL);
    let { tokenId } = Utilities.resolveUAL(UAL);
    const owner = await this.blockchainService.getAssetOwner(tokenId, options);
    return {
      UAL: UAL,
      owner: owner,
      operation: Utilities.getOperationStatusObject(
        { data: {}, status: "COMPLETED" },
        null
      ),
    };
  }
}
module.exports = AssetOperationsManager;
