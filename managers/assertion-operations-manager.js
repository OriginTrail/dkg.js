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
    let operationId = await nodeApiService.get(assertionId);
    let operationResult = await nodeApiService.getOperationResult(
      operationId,
      options
    );
    let assertion = operationResult.data.assertion;
    const rootHash = AssertionTools.calculateRoot(assertion);
    if (rootHash === assertionId) {
      const result = {
        assertion: assertion,
        assertionId: assertionId,
        operation: Utilities.getOperationStatusObject(
          operationResult,
          operationId
        ),
      };

      if (
        !options.outputFormat ||
        options.outputFormat.toLowerCase() === GET_OUTPUT_FORMATS.JSON_LD
      ) {
        result.assertion = await jsonld.fromRDF(result.assertion.join("\n"), {
          algorithm: "URDNA2015",
          format: "application/n-quads",
        });
        result.assertion = await jsonld.compact(result.assertion, {
          "@context": "http://schema.org/",
        });
      }
      return result;
    }
    throw Error("Calculated root hashes don't match!");
  }
}

module.exports = AssertionOperationsManager;
