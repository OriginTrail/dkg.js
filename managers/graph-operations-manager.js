const { ZeroHash } = require('ethers');
const {
    getOperationStatusObject,
    resolveUAL,
    toNQuads,
    toJSONLD,
} = require('../services/utilities.js');
const {
    ASSET_STATES,
    CONTENT_TYPES,
    OPERATIONS,
    GET_OUTPUT_FORMATS,
    PRIVATE_ASSERTION_PREDICATE,
    QUERY_TYPES,
    OT_NODE_TRIPLE_STORE_REPOSITORIES,
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
     * @param {string} UAL - The Universal Asset Locator, representing asset or collection state
     * @param {Object} [options={}] - Optional parameters for the asset get operation.
     * @param {string} [options.state] - The state or state index of the asset, "latest", "finalized", numerical, hash.
     * @param {string} [options.contentType] - The type of content to retrieve, either "public", "private" or "all".
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
            contentType,
            hashFunctionId,
            validate,
            outputFormat,
            authToken,
        );

        const { tokenId } = resolveUAL(UAL);

        let publicAssertionId;
        let stateFinalized = false;
        if (state === ASSET_STATES.LATEST) {
            const unfinalizedState = await this.blockchainService.getUnfinalizedState(
                tokenId,
                blockchain,
            );

            if (unfinalizedState != null && unfinalizedState !== ZeroHash) {
                publicAssertionId = unfinalizedState;
                stateFinalized = false;
            }
        }

        let assertionIds = [];
        const isEnumState = Object.values(ASSET_STATES).includes(state);
        if (!publicAssertionId) {
            assertionIds = await this.blockchainService.getAssertionIds(tokenId, blockchain);

            if (isEnumState) {
                publicAssertionId = assertionIds[assertionIds.length - 1];
                stateFinalized = true;
            } else if (typeof state === 'number') {
                if (state >= assertionIds.length) {
                    throw new Error('State index is out of range.');
                }

                publicAssertionId = assertionIds[state];

                if (state === assertionIds.length - 1) stateFinalized = true;
            } else if (assertionIds.includes(state)) {
                publicAssertionId = state;

                if (state === assertionIds[assertionIds.length - 1]) stateFinalized = true;
            } else {
                throw new Error('Incorrect state option.');
            }
        }

        const getPublicOperationId = await this.nodeApiService.get(
            endpoint,
            port,
            authToken,
            UAL,
            isEnumState ? state : publicAssertionId,
            hashFunctionId,
            paranetUAL,
        );

        const getPublicOperationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.GET,
            maxNumberOfRetries,
            frequency,
            getPublicOperationId,
        );

        if (!getPublicOperationResult.data.assertion) {
            if (getPublicOperationResult.status !== 'FAILED') {
                getPublicOperationResult.data = {
                    errorType: 'DKG_CLIENT_ERROR',
                    errorMessage: 'Unable to find assertion on the network!',
                };
                getPublicOperationResult.status = 'FAILED';
            }

            return {
                operation: {
                    publicGet: getOperationStatusObject(
                        getPublicOperationResult,
                        getPublicOperationId,
                    ),
                },
            };
        }

        const { assertion: publicAssertion } = getPublicOperationResult.data;
        let { privateAssertion } = getPublicOperationResult.data;

        if (validate === true && (await calculateRoot(publicAssertion)) !== publicAssertionId) {
            getPublicOperationResult.data = {
                errorType: 'DKG_CLIENT_ERROR',
                errorMessage: "Calculated root hashes don't match!",
            };
        }

        let result = { operation: {} };
        if (paranetUAL) {
            result.operation.publicGet = getOperationStatusObject(
                getPublicOperationResult,
                getPublicOperationId,
            );
            const formattedPublicAssertion = await toJSONLD(publicAssertion.join('\n'));
            result.public = {
                assertion: formattedPublicAssertion,
                assertionId: publicAssertionId,
            };
            if (privateAssertion) {
                const formattedPrivateAssertion = await toJSONLD(privateAssertion.join('\n'));
                result.private = {
                    assertion: formattedPrivateAssertion,
                    assertionId: getPublicOperationResult.data.privateAssertionId,
                };
            }
            return result;
        }
        if (contentType !== CONTENT_TYPES.PRIVATE) {
            let formattedPublicAssertion = publicAssertion;
            try {
                if (outputFormat !== GET_OUTPUT_FORMATS.N_QUADS) {
                    formattedPublicAssertion = await toJSONLD(publicAssertion.join('\n'));
                } else {
                    formattedPublicAssertion = publicAssertion.join('\n');
                }
            } catch (error) {
                getPublicOperationResult.data = {
                    errorType: 'DKG_CLIENT_ERROR',
                    errorMessage: error.message,
                };
            }

            if (contentType === CONTENT_TYPES.PUBLIC) {
                result = {
                    ...result,
                    assertion: formattedPublicAssertion,
                    assertionId: publicAssertionId,
                };
            } else {
                result.public = {
                    assertion: formattedPublicAssertion,
                    assertionId: publicAssertionId,
                };
            }

            result.operation.publicGet = getOperationStatusObject(
                getPublicOperationResult,
                getPublicOperationId,
            );
        }

        if (contentType !== CONTENT_TYPES.PUBLIC) {
            const filteredTriples = publicAssertion.filter((element) =>
                element.includes(PRIVATE_ASSERTION_PREDICATE),
            );
            const privateAssertionLinkTriple =
                filteredTriples.length > 0 ? filteredTriples[0] : null;

            let queryPrivateOperationId;
            let queryPrivateOperationResult = {};
            if (privateAssertionLinkTriple) {
                const privateAssertionId = privateAssertionLinkTriple.match(/"(.*?)"/)[1];
                if (getPublicOperationResult?.data?.privateAssertion?.length)
                    privateAssertion = getPublicOperationResult.data.privateAssertion;
                else {
                    const queryString = `
                    CONSTRUCT { ?s ?p ?o }
                    WHERE {
                        {
                            GRAPH <assertion:${privateAssertionId}>
                            {
                                ?s ?p ?o .
                            }
                        }
                    }`;

                    queryPrivateOperationId = await this.nodeApiService.query(
                        endpoint,
                        port,
                        authToken,
                        queryString,
                        QUERY_TYPES.CONSTRUCT,
                        stateFinalized
                            ? OT_NODE_TRIPLE_STORE_REPOSITORIES.PRIVATE_CURRENT
                            : OT_NODE_TRIPLE_STORE_REPOSITORIES.PRIVATE_HISTORY,
                    );

                    queryPrivateOperationResult = await this.nodeApiService.getOperationResult(
                        endpoint,
                        port,
                        authToken,
                        OPERATIONS.QUERY,
                        maxNumberOfRetries,
                        frequency,
                        queryPrivateOperationId,
                    );

                    const privateAssertionNQuads = queryPrivateOperationResult.data;

                    privateAssertion = await toNQuads(
                        privateAssertionNQuads,
                        'application/n-quads',
                    );
                }

                let formattedPrivateAssertion;
                if (
                    privateAssertion.length &&
                    validate === true &&
                    (await calculateRoot(privateAssertion)) !== privateAssertionId
                ) {
                    queryPrivateOperationResult.data = {
                        errorType: 'DKG_CLIENT_ERROR',
                        errorMessage: "Calculated root hashes don't match!",
                    };
                }

                try {
                    if (outputFormat !== GET_OUTPUT_FORMATS.N_QUADS) {
                        formattedPrivateAssertion = await toJSONLD(privateAssertion.join('\n'));
                    } else {
                        formattedPrivateAssertion = privateAssertion.join('\n');
                    }
                } catch (error) {
                    queryPrivateOperationResult.data = {
                        errorType: 'DKG_CLIENT_ERROR',
                        errorMessage: error.message,
                    };
                }

                if (contentType === CONTENT_TYPES.PRIVATE) {
                    result = {
                        ...result,
                        assertion: formattedPrivateAssertion,
                        assertionId: privateAssertionId,
                    };
                } else {
                    result.private = {
                        assertion: formattedPrivateAssertion,
                        assertionId: privateAssertionId,
                    };
                }
                if (queryPrivateOperationId) {
                    result.operation.queryPrivate = getOperationStatusObject(
                        queryPrivateOperationResult,
                        queryPrivateOperationId,
                    );
                }
            }
        }

        return result;
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
