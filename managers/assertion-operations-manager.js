import {formatAssertion, calculateRoot} from 'assertion-tools';
class AssertionOperationsManager {
    constructor(config, services) {
        this.nodeApiService = services.nodeApiService;
    }

    create() {

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
