const { OPERATIONS } = require('../constants');

class GraphOperationsManager {
    constructor(config, services) {
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
        this.inputService = services.inputService;
    }

    /**
     * An asynchronous function that executes a SPARQL query using an API endpoint and returns the query result.
     * @async
     * @param {string} queryString - The string representation of the SPARQL query to be executed.
     * @param {string} queryType - The type of the SPARQL query, "CONSTRUCT" or "SELECT".
     * @param {Object} [options={}] - An object containing additional options for the query execution.
     * @returns {Promise} A Promise that resolves to the query result.
     */
    async query(queryString, queryType, options = {}) {
        const endpoint = this.inputService.getEndpoint(options);
        const port = this.inputService.getPort(options);
        const maxNumberOfRetries = this.inputService.getMaxNumberOfRetries(options);
        const frequency = this.inputService.getFrequency(options);
        const authToken = this.inputService.getAuthToken(options);

        this.validationService.validateGraphQuery(
            queryString,
            queryType,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            authToken,
        );

        const operationId = await this.nodeApiService.query(
            endpoint,
            port,
            authToken,
            queryString,
            queryType,
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
