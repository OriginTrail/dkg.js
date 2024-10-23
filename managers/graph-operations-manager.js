const { OPERATIONS } = require('../constants');
const { deriveRepository } = require('../services/utilities.js');
const jsonld = require('jsonld');

class GraphOperationsManager {
    constructor(services) {
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
        const {
            graphLocation,
            graphState,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            authToken,
            paranetUAL,
        } = this.inputService.getQueryArguments(options);

        this.validationService.validateGraphQuery(
            queryString,
            queryType,
            graphLocation,
            graphState,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            authToken,
        );

        const repository = paranetUAL ?? deriveRepository(graphLocation, graphState);
        console.log(graphLocation)
        console.log(graphState)
        console.log(repository)

        const operationId = await this.nodeApiService.query(
            endpoint,
            port,
            authToken,
            queryString,
            queryType,
            repository,
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

    async insert(jsonldData, options = {}) {
        const nquads = await jsonld.toRDF(jsonldData, { format: 'application/n-quads' });
        return nquads;
    }
}
module.exports = GraphOperationsManager;
