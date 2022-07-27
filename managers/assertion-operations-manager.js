import {formatAssertion, calculateRoot} from 'assertion-tools';
import {OPERATIONS} from "../constants.js";
class AssertionOperationsManager {
    constructor(config, services) {
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
    }

    async create(content, options) {
        this.validationService.validatePublishRequest(content, options);
        options.operation = OPERATIONS.publish;
        const assertion = await formatAssertion(content);
        const assertionId = calculateRoot(assertion);
    }

    async get(assertionId, options) {
        let operationId = await this.nodeApiService.get(assertionId);
        let operationResult = await this.nodeApiService.getOperationResult(operationId, options);
        let assertion = operationResult.data.assertion;
        const rootHash = calculateRoot(assertion);
        if(rootHash === assertionId) {
            return {assertion: assertion, status: operationResult.status};
        }
        throw Error("Calculated root hashes don't match!");
    }
}

export {AssertionOperationsManager};
