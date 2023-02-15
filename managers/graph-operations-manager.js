const { OPERATIONS } = require('../constants');

class GraphOperationsManager {
    constructor(config, services) {
        this.nodeApiService = services.nodeApiService;
        this.inputService = services.inputService;
    }

    async query(queryString, type, options = {}) {
        const endpoint = this.inputService.getEndpoint(options);
        const port = this.inputService.getPort(options);
        const maxNumberOfRetries = this.inputService.getMaxNumberOfRetries(options);
        const frequency = this.inputService.getFrequency(options);
        const authToken = this.inputService.getAuthToken(options);

        const operationId = await this.nodeApiService.query(
            endpoint,
            port,
            authToken,
            queryString,
            type,
        );

        return this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.QUERY,
            maxNumberOfRetries,
            frequency,
            operationId,
        );
    }
}
module.exports = GraphOperationsManager;
