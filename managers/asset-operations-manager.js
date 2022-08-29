const AssertionTools = require("assertion-tools");
const Utilities = require("../services/utilities.js");
const AssertionOperationsManager = require("./assertion-operations-manager.js");
const { OPERATIONS, PUBLISH_TYPES, BLOCKCHAINS } = require("../constants.js");

let nodeApiService;
let validationService;
let blockchainService;
let assertion;

class AssetOperationsManager {
  constructor(config, services) {
    nodeApiService = services.nodeApiService;
    validationService = services.validationService;
    blockchainService = services.blockchainService;
    assertion = new AssertionOperationsManager(config, services);
  }

  async create(content, options = {}) {
    validationService.validatePublishRequest(content, options);
    options.operation = OPERATIONS.publish;
    const assertion = await AssertionTools.formatAssertion(content);
    const assertionId = AssertionTools.calculateRoot(assertion);
    let requestData = blockchainService.generateCreateAssetRequest(
      assertion,
      assertionId,
      options
    );
    const UAI = await blockchainService.createAsset(requestData, options);
    const UAL = blockchainService.generateUAL(options, UAI);
    let operationId = await nodeApiService.publish(
      PUBLISH_TYPES.ASSET,
      assertionId,
      assertion,
      UAL,
      options
    );
    let operationResult = await nodeApiService.getOperationResult(
      operationId,
      options
    );
    return {
      UAL: UAL,
      assertionId: assertionId,
      operation: Utilities.getOperationStatusObject(
        operationResult,
        operationId
      ),
    };
  }

  async get(UAL, options = {}) {
    validationService.validateGetRequest(UAL, options);
    options.operation = OPERATIONS.get;
    let { blockchain, contract, UAI } = Utilities.resolveUAL(UAL);

    options.blockchain = BLOCKCHAINS[blockchain];
    options.blockchain.hubContract = contract;

    const assertionId = await blockchainService.getAssetCommitHash(
      UAI,
      options
    );

    return assertion.get(assertionId, options);
  }

  async update(UAL, content, options = {}) {
    validationService.validatePublishRequest(content, options);
    options.operation = OPERATIONS.publish;
    const assertion = await AssertionTools.formatAssertion(content);
    const assertionId = AssertionTools.calculateRoot(assertion);
    let { UAI } = Utilities.resolveUAL(UAL);
    let requestData = blockchainService.generateUpdateAssetRequest(
      UAI,
      assertion,
      assertionId,
      options
    );
    await blockchainService.updateAsset(requestData, options);
    let operationId = await nodeApiService.publish(
      PUBLISH_TYPES.ASSET,
      assertionId,
      assertion,
      UAL,
      options
    );
    let operationResult = await nodeApiService.getOperationResult(
      operationId,
      options
    );
    return {
      UAL: UAL,
      assertionId: assertionId,
      operation: Utilities.getOperationStatusObject(
        operationResult,
        operationId
      ),
    };
  }

  async transfer(UAL, to, options = {}) {
    validationService.validateAssetTransferRequest(UAL, to, options);
    let { UAI } = Utilities.resolveUAL(UAL);
    await blockchainService.transferAsset(UAL, UAI, to, options);
    const owner = await blockchainService.getAssetOwner(UAI);
    return {
      UAL: UAL,
      owner: owner,
      operation: Utilities.getOperationStatusObject(
        { status: "COMPLETED" },
        null
      ),
    };
  }

  async getOwner(UAL, options) {
    validationService.validateGetOwnerRequest(UAL);
    let { UAI } = Utilities.resolveUAL(UAL);
    const owner = await blockchainService.getAssetOwner(UAI, options);
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
