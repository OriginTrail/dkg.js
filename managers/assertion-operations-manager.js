const AssertionTools = require("assertion-tools");
const jsonld = require("jsonld");
const {
  OPERATIONS,
  PUBLISH_TYPES,
  GET_OUTPUT_FORMATS,
} = require("../constants.js");
const Utilities = require("../services/utilities.js");

let nodeApiService;
let validationService;
let blockchainService;

class AssertionOperationsManager {
  constructor(config, services) {
    nodeApiService = services.nodeApiService;
    validationService = services.validationService;
    blockchainService = services.blockchainService;
  }

  async create(content, options) {
    validationService.validatePublishRequest(content, options);
    options.operation = OPERATIONS.publish;
    const assertion = await AssertionTools.formatAssertion(content);
    const assertionId = AssertionTools.calculateRoot(assertion);
    let requestData = blockchainService.generateCreateAssetRequest(
      assertion,
      assertionId,
      options
    );
    await this.blockchainService.createAssertion(requestData, options);
    let operationId = await nodeApiService.publish(
      PUBLISH_TYPES.ASSERTION,
      assertionId,
      assertion
    );
    let operationResult = await nodeApiService.getOperationResult(
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
    let operationId = await nodeApiService.get(assertionId, options);
    let operationResult = await nodeApiService.getOperationResult(
      operationId,
      options
    );
    const assertion = operationResult.data.assertion;
    if (options.validate === false) {
      const rootHash = AssertionTools.calculateRoot(assertion);
      if (rootHash !== assertionId)
        throw Error("Calculated root hashes don't match!");
    }

    const result = {
      assertion: assertion,
      assertionId: assertionId,
      operation: Utilities.getOperationStatusObject(
        operationResult,
        operationId
      ),
    };

    if (options.outputFormat === GET_OUTPUT_FORMATS.N_QUADS) return result;

      result.assertion = await jsonld.fromRDF(result.assertion.join("\n"), {
        algorithm: "URDNA2015",
        format: "application/n-quads",
      });

    return result;
  }
}

module.exports = AssertionOperationsManager;
