const AssertionTools = require('assertion-tools')
const constants = require('../constants.js')
const Utilities = require("../services/utilities.js");

class AssertionOperationsManager {
    constructor(config, services) {
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
        this.blockchainService = services.blockchainService;
    }

    async create(content, options) {
        this.validationService.validatePublishRequest(content, options);
        options.operation = constants.OPERATIONS.publish;
        const assertion = await AssertionTools.formatAssertion(content);
        const assertionId = AssertionTools.calculateRoot(assertion);
        let requestData = this.blockchainService.generateCreateAssetRequest(assertion, assertionId, options);
        await this.blockchainService.createAssertion(requestData, options);
        let operationId = await this.nodeApiService.publish(assertionId, assertion);
        let operationResult = await this.nodeApiService.getOperationResult(operationId, options);
        return {assertionId: assertionId, operation: Utilities.getOperationStatusObject(operationResult, operationId)};
    }

    async get(assertionId, options) {
        let operationId = await this.nodeApiService.get(assertionId);
        let operationResult = await this.nodeApiService.getOperationResult(operationId, options);
        let assertion = operationResult.data.assertion;
        const rootHash = AssertionTools.calculateRoot(assertion);
        if(rootHash === assertionId) {
            return {assertion: assertion, assertionId: assertionId, operation: Utilities.getOperationStatusObject(operationResult, operationId)};
        }
        throw Error("Calculated root hashes don't match!");
    }
}

module.exports = AssertionOperationsManager;
