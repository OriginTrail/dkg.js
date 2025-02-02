export default class GraphOperationsManager {
    constructor(services) {
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
        this.inputService = services.inputService;
        this.blockchainService = services.blockchainService;
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
        const { endpoint, port, maxNumberOfRetries, frequency, authToken, paranetUAL, repository } =
            this.inputService.getQueryArguments(options);

        this.validationService.validateGraphQuery(
            queryString,
            queryType,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            authToken,
            repository,
        );

        const result = await this.nodeApiService.query(
            endpoint,
            port,
            authToken,
            queryString,
            queryType,
            paranetUAL,
            repository,
        );

        return result;
    }
}
