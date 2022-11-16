const AssertionTools = require("assertion-tools");
const Utilities = require("../services/utilities.js");
const AssertionOperationsManager = require("./assertion-operations-manager.js");
const { OPERATIONS, PUBLISH_TYPES, BLOCKCHAINS, OPERATIONS_STEP_STATUS } = require("../constants.js");
const emptyHooks = require("../util/empty-hooks");

class AssetOperationsManager {
  constructor(config, services) {
    this.nodeApiService = services.nodeApiService;
    this.validationService = services.validationService;
    this.blockchainService = services.blockchainService;
    this.assertionOperationsManager = new AssertionOperationsManager(config, services);
  }

  async create(content, options = {}, stepHooks = emptyHooks) {
    this.validationService.validatePublishRequest(content, options);
    options.operation = OPERATIONS.publish;
    const assertion = await AssertionTools.formatAssertion(content);
    const assertionId = AssertionTools.calculateRoot(assertion);
    let requestData = this.blockchainService.generateCreateAssetRequest(
      assertion,
      assertionId,
      options
    );

    const UAI = await this.blockchainService.createAsset(requestData, options, stepHooks);
    console.log(UAI);
    const UAL = this.blockchainService.generateUAL(options, UAI);

    let operationId = await this.nodeApiService.publish(
      PUBLISH_TYPES.ASSET,
      assertionId,
      assertion,
      UAL,
      options
    );

    let operationResult = await this.nodeApiService.getOperationResult(
      operationId,
      options
    );

    stepHooks.afterHook({
      status: OPERATIONS_STEP_STATUS.CREATE_ASSET_COMPLETED,
      data: {
        operationId,
        operationResult
      }
    });

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
    this.validationService.validateGetRequest(UAL, options);
    options.operation = OPERATIONS.get;
    let { blockchain, contract, UAI } = Utilities.resolveUAL(UAL);

    options.blockchain.hubContract = contract;
    options.blockchain.rpc = options.blockchain.rpc ?? BLOCKCHAINS[blockchain].rpc;

    const assertionId = await this.blockchainService.getLatestAssertion(UAI);

    return this.assertionOperationsManager.get(assertionId, options);
  }

  async update(UAL, content, options = {}) {
    this.validationService.validatePublishRequest(content, options);
    options.operation = OPERATIONS.publish;
    const assertion = await AssertionTools.formatAssertion(content);
    const assertionId = AssertionTools.calculateRoot(assertion);
    let { UAI } = Utilities.resolveUAL(UAL);
    let requestData = this.blockchainService.generateUpdateAssetRequest(
      UAI,
      assertion,
      assertionId,
      options
    );
    await this.blockchainService.updateAsset(requestData, options);
    let operationId = await this.nodeApiService.publish(
      PUBLISH_TYPES.ASSET,
      assertionId,
      assertion,
      UAL,
      options
    );
    let operationResult = await this.nodeApiService.getOperationResult(
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
    this.validationService.validateAssetTransferRequest(UAL, to, options);
    let { UAI } = Utilities.resolveUAL(UAL);
    await this.blockchainService.transferAsset(UAL, UAI, to, options);
    const owner = await this.blockchainService.getAssetOwner(UAI);
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
    this.validationService.validateGetOwnerRequest(UAL);
    let { UAI } = Utilities.resolveUAL(UAL);
    const owner = await this.blockchainService.getAssetOwner(UAI, options);
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
