const {
    getOperationStatusObject,
    toNQuads,
    toJSONLD,
} = require('../services/utilities.js');
const {
    OPERATIONS,
    GET_OUTPUT_FORMATS,
} = require('../constants.js');
const { deriveRepository } = require('../services/utilities.js');

class GraphOperationsManager {
    constructor(services) {
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
        this.inputService = services.inputService;
    }

    /**
     * Retrieves a public or private assertion for a given UAL.
     * @async
     * @param {string} UAL - The Universal Asset Locator, representing asset or collection.
     * @param {Object} [options={}] - Optional parameters for the asset get operation.
     * @param {number} [options.state] - The state index of the asset. If omitted, the latest state will be used.
     * @param {boolean} [options.includeMetadata] - If metadata should be included. Default is false.
     * @param {string} [options.contentType] - The type of content to retrieve, either "public" or "all" (default)
     * @param {boolean} [options.validate] - Whether to validate the retrieved assertion.
     * @param {string} [options.outputFormat] - The format of the retrieved assertion output, either "n-quads" or "json-ld".
     * @returns {Object} - The result of the asset get operation.
     */
    async get(UAL, options = {}) {
        const {
            blockchain,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            state,
            includeMetadata,
            contentType,
            validate,
            outputFormat,
            authToken,
            hashFunctionId,
            paranetUAL,
        } = this.inputService.getAssetGetArguments(options);

        this.validationService.validateAssetGet(
            UAL,
            blockchain,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            state,
            includeMetadata,
            contentType,
            hashFunctionId,
            validate,
            outputFormat,
            authToken,
        );

        const getOperationId = await this.nodeApiService.get(
            endpoint,
            port,
            authToken,
            UAL,
            state,
            includeMetadata,
            contentType,
            hashFunctionId,
            paranetUAL,
        );

        const getOperationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.GET,
            maxNumberOfRetries,
            frequency,
            getOperationId,
        );

        const assertion = getOperationResult.data.assertion;

        if (!assertion) {
            if (getOperationResult.status !== 'FAILED') {
                getOperationResult.data = {
                    errorType: 'DKG_CLIENT_ERROR',
                    errorMessage: 'Unable to find assertion on the network!',
                };
                getOperationResult.status = 'FAILED';
            }

            return {
                operation: {
                    get: getOperationStatusObject(
                        getOperationResult,
                        getOperationId,
                    ),
                },
            };
        }

        if (validate === true) {
            const isValid = true; // TODO: validate assertion
            if (!isValid) {
                getOperationResult.data = {
                    errorType: 'DKG_CLIENT_ERROR',
                    errorMessage: "Calculated root hashes don't match!",
                };
            }
        }

        let formattedAssertion;
        if (outputFormat === GET_OUTPUT_FORMATS.JSON_LD) {
            formattedAssertion = await toJSONLD(assertion.join('\n'));
        }
        if (outputFormat === GET_OUTPUT_FORMATS.N_QUADS) {
            formattedAssertion = await toNQuads(assertion, 'application/n-quads');
        }

        return {
            assertion: formattedAssertion,
            operation: {
                get: getOperationStatusObject(
                    getOperationResult,
                    getOperationId,
                ),
            },
        };
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
}
module.exports = GraphOperationsManager;
