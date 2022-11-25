const AssertionTools = require("assertion-tools");
const {
  OPERATIONS,
  PUBLISH_TYPES,
} = require("../constants.js");
const Utilities = require("../services/utilities.js");

class AssertionOperationsManager {
  constructor(config, services) {
    this.nodeApiService = services.nodeApiService;
    this.validationService = services.validationService;
    this.blockchainService = services.blockchainService;
  }

  async create(content, options) {
    this.validationService.validatePublishRequest(content, options);
    options.operation = OPERATIONS.publish;
    const assertion = await AssertionTools.formatAssertion(content);
    const assertionId = AssertionTools.calculateRoot(assertion);
    let requestData = this.blockchainService.generateCreateAssetRequest(
      assertion,
      assertionId,
      options
    );
    await this.blockchainService.createAssertion(requestData, options);
    let operationId = await this.nodeApiService.publish(
      PUBLISH_TYPES.ASSERTION,
      assertionId,
      assertion
    );
    let operationResult = await this.nodeApiService.getOperationResult(
      operationId,
      options
    );
    return {
      assertionId: assertionId,
      operation: Utilities.getOperationStatusObject(
        operationResult,
        operationId
      ),
    };
  }
}

module.exports = AssertionOperationsManager;
