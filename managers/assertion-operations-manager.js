const AssertionTools = require("assertion-tools");
const jsonld = require("jsonld");
const {
  OPERATIONS,
  PUBLISH_TYPES,
  GET_OUTPUT_FORMATS,
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

  async get(assertionId, options = {}) {
    let operationId = await this.nodeApiService.get(assertionId, options);
    let operationResult = await this.nodeApiService.getOperationResult(
      operationId,
      options
    );
    let assertion = operationResult.data.assertion;
    try {
      if (options.validate === false) {
        const rootHash = AssertionTools.calculateRoot(assertion);
        if (rootHash !== assertionId)
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

    const result = {
      assertion,
      assertionId,
      operation: Utilities.getOperationStatusObject(
        operationResult,
        operationId
      ),
    };

    return result;
  }
}

module.exports = AssertionOperationsManager;
