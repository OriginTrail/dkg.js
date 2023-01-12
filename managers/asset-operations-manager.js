const {
  assertionMetadata,
  formatAssertion,
  calculateRoot,
} = require("assertion-tools");
const Utilities = require("../services/utilities.js");
const jsonld = require("jsonld");
const {
  OPERATIONS,
  PUBLISH_TYPES,
  DEFAULT_HASH_FUNCTION_ID,
  OPERATIONS_STEP_STATUS,
  GET_OUTPUT_FORMATS,
} = require("../constants.js");
const emptyHooks = require("../util/empty-hooks");
const utilities = require("../services/utilities.js");

class AssetOperationsManager {
  constructor(config, services) {
    this.nodeApiService = services.nodeApiService;
    this.validationService = services.validationService;
    this.blockchainService = services.blockchainService;
  }

  async create(
    publicContent,
    privateContent,
    opts = {},
    stepHooks = emptyHooks
  ) {
    const options = JSON.parse(JSON.stringify(opts));

    this.validationService.validatePublishRequest(
      publicContent,
      privateContent,
      options
    );

    let privateAssertion;
    let privateAssertionId;
    if (privateContent && !utilities.isEmptyObject(privateContent)) {
      privateAssertion = await formatAssertion(privateContent);
      privateAssertionId = calculateRoot(privateAssertion);
    }
    const publicAssertion = await formatAssertion(
      privateAssertionId
        ? { ...publicContent, "https://dkg.private": privateAssertionId }
        : publicContent
    );
    const publicAssertionId = calculateRoot(publicAssertion);

    const blockchain = this.blockchainService.getBlockchain(options);
    const contentAssetStorageAddress =
      await this.blockchainService.getContractAddress(
        blockchain.name,
        "ContentAssetStorage",
        blockchain.rpc
      );
    const tokenAmountInWei =
      options.tokenAmount ??
      (await this.nodeApiService.getBidSuggestion(
        blockchain.name.startsWith("otp") ? "otp" : blockchain.name,
        options.epochsNum,
        assertionMetadata.getAssertionSizeInBytes(publicAssertion),
        contentAssetStorageAddress,
        publicAssertionId,
        options.hashFunctionId ?? DEFAULT_HASH_FUNCTION_ID,
        options
      ));
    const tokenId = await this.blockchainService.createAsset(
      {
        publicAssertionId,
        assertionSize:
          assertionMetadata.getAssertionSizeInBytes(publicAssertion),
        triplesNumber:
          assertionMetadata.getAssertionTriplesNumber(publicAssertion),
        chunksNumber:
          assertionMetadata.getAssertionChunksNumber(publicAssertion),
        epochsNum: options.epochsNum,
        tokenAmount: tokenAmountInWei,
        scoreFunctionId: options.scoreFunctionId ?? 1,
        immutable_: options.immutable ?? false,
      },
      options,
      stepHooks
    );

    const UAL = Utilities.deriveUAL(
      blockchain.name,
      contentAssetStorageAddress,
      tokenId
    );

    if (privateAssertionId && !utilities.isEmptyObject(privateAssertion)) {
      await this.nodeApiService.localStore(
        privateAssertionId,
        privateAssertion,
        options
      );
    }

    await this.nodeApiService.localStore(
      publicAssertionId,
      publicAssertion,
      options
    );

    const operationId = await this.nodeApiService.publish(
      publicAssertionId,
      publicAssertion,
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
      publicAssertionId,
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

    const assertionId = await this.blockchainService.getLatestAssertionId(
      tokenId,
      options
    );

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
