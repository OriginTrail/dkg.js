const { assertionMetadata, formatAssertion, calculateRoot } = require('assertion-tools');
const {
    isEmptyObject,
    deriveUAL,
    getOperationStatusObject,
    resolveUAL,
    toNQuads,
    toJSONLD,
} = require('../services/utilities.js');
const {
    CONTENT_TYPES,
    OPERATIONS,
    OPERATIONS_STEP_STATUS,
    GET_OUTPUT_FORMATS,
    OPERATION_STATUSES,
    DEFAULT_GET_LOCAL_STORE_RESULT_FREQUENCY,
    PRIVATE_ASSERTION_PREDICATE,
    QUERY_TYPES,
} = require('../constants.js');
const emptyHooks = require('../util/empty-hooks');

class AssetOperationsManager {
    constructor(config, services) {
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
    }

    async create(content, options = {}, stepHooks = emptyHooks) {
        this.validationService.validateObjectType(content);
        let jsonContent = {};

        // for backwards compatibility
        if (!content.public && !content.private) {
            jsonContent.public = content;
        } else {
            jsonContent = content;
        }

        const {
            blockchain,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            epochsNum,
            hashFunctionId,
            scoreFunctionId,
            immutable,
            tokenAmount,
            authToken,
        } = this.inputService.getAssetCreateArguments(options);

        this.validationService.validateAssetCreate(
            jsonContent,
            blockchain,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            epochsNum,
            hashFunctionId,
            scoreFunctionId,
            immutable,
            tokenAmount,
            authToken,
        );

        let privateAssertion;
        let privateAssertionId;
        if (jsonContent.private && !isEmptyObject(jsonContent.private)) {
            privateAssertion = await formatAssertion(jsonContent.private);
            privateAssertionId = calculateRoot(privateAssertion);
        }
        const publicGraph = {
            '@graph': [
                jsonContent.public && !isEmptyObject(jsonContent.public)
                    ? jsonContent.public
                    : null,
                jsonContent.private && !isEmptyObject(jsonContent.private)
                    ? {
                          [PRIVATE_ASSERTION_PREDICATE]: privateAssertionId,
                      }
                    : null,
            ],
        };
        const publicAssertion = await formatAssertion(publicGraph);
        const publicAssertionId = calculateRoot(publicAssertion);

        const contentAssetStorageAddress = await this.blockchainService.getContractAddress(
            'ContentAssetStorage',
            blockchain,
        );

        const tokenAmountInWei =
            tokenAmount ??
            (await this.nodeApiService.getBidSuggestion(
                endpoint,
                port,
                authToken,
                blockchain.name.startsWith('otp') ? 'otp' : blockchain.name,
                epochsNum,
                assertionMetadata.getAssertionSizeInBytes(publicAssertion),
                contentAssetStorageAddress,
                publicAssertionId,
                hashFunctionId,
            ));

        const tokenId = await this.blockchainService.createAsset(
            {
                publicAssertionId,
                assertionSize: assertionMetadata.getAssertionSizeInBytes(publicAssertion),
                triplesNumber: assertionMetadata.getAssertionTriplesNumber(publicAssertion),
                chunksNumber: assertionMetadata.getAssertionChunksNumber(publicAssertion),
                epochsNum,
                tokenAmount: tokenAmountInWei,
                scoreFunctionId: scoreFunctionId ?? 1,
                immutable_: immutable,
            },
            blockchain,
            stepHooks,
        );

        const resolvedUAL = {
            blockchain: blockchain.name.startsWith('otp') ? 'otp' : blockchain.name,
            contract: contentAssetStorageAddress,
            tokenId,
        };
        const assertions = [
            {
                ...resolvedUAL,
                assertionId: publicAssertionId,
                assertion: publicAssertion,
            },
        ];
        if (privateAssertion?.length) {
            assertions.push({
                ...resolvedUAL,
                assertionId: privateAssertionId,
                assertion: privateAssertion,
            });
        }
        let operationId = await this.nodeApiService.localStore(
            endpoint,
            port,
            authToken,
            assertions,
        );
        let operationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.LOCAL_STORE,
            maxNumberOfRetries,
            DEFAULT_GET_LOCAL_STORE_RESULT_FREQUENCY,
            operationId,
        );

        const UAL = deriveUAL(
            blockchain.name.startsWith('otp') ? 'otp' : blockchain.name,
            contentAssetStorageAddress,
            tokenId,
        );

        if (operationResult.status === OPERATION_STATUSES.FAILED) {
            return {
                UAL,
                assertionId: publicAssertionId,
                operation: getOperationStatusObject(operationResult, operationId),
            };
        }

        operationId = await this.nodeApiService.publish(
            endpoint,
            port,
            authToken,
            publicAssertionId,
            publicAssertion,
            blockchain.name.startsWith('otp') ? 'otp' : blockchain.name,
            contentAssetStorageAddress,
            tokenId,
            hashFunctionId,
        );

        operationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.PUBLISH,
            maxNumberOfRetries,
            frequency,
            operationId,
        );

        stepHooks.afterHook({
            status: OPERATIONS_STEP_STATUS.CREATE_ASSET_COMPLETED,
            data: {
                operationId,
                operationResult,
            },
        });

        return {
            UAL,
            publicAssertionId,
            operation: getOperationStatusObject(operationResult, operationId),
        };
    }

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

        const publicAssertionId = await this.blockchainService.getLatestAssertionId(
            tokenId,
            blockchain,
        );

        const getPublicOperationId = await this.nodeApiService.get(
            endpoint,
            port,
            authToken,
            UAL,
            hashFunctionId,
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

        const publicAssertion = getPublicOperationResult.data.assertion;

        if (validate === true && calculateRoot(publicAssertion) !== publicAssertionId) {
            getPublicOperationResult.data = {
                errorType: 'DKG_CLIENT_ERROR',
                errorMessage: "Calculated root hashes don't match!",
            };
        }

        let result = { operation: {} };
        if (contentType !== CONTENT_TYPES.PRIVATE) {
            let formattedPublicAssertion;
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
            const privateAssertionLinkTriple = publicAssertion.filter((element) =>
                element.includes(PRIVATE_ASSERTION_PREDICATE),
            )[0];

            if (privateAssertionLinkTriple) {
                const privateAssertionId = privateAssertionLinkTriple.match(/"(.*?)"/)[1];

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

                const queryPrivateOperationId = await this.nodeApiService.query(
                    endpoint,
                    port,
                    authToken,
                    queryString,
                    QUERY_TYPES.CONSTRUCT,
                );

                const queryPrivateOperationResult = await this.nodeApiService.getOperationResult(
                    endpoint,
                    port,
                    authToken,
                    OPERATIONS.QUERY,
                    maxNumberOfRetries,
                    frequency,
                    queryPrivateOperationId,
                );

                const privateAssertionNQuads = queryPrivateOperationResult.data;

                const privateAssertion = await toNQuads(
                    privateAssertionNQuads,
                    'application/n-quads',
                );

                if (validate === true && calculateRoot(privateAssertion) !== privateAssertionId) {
                    queryPrivateOperationResult.data = {
                        errorType: 'DKG_CLIENT_ERROR',
                        errorMessage: "Calculated root hashes don't match!",
                    };
                }

                let formattedPrivateAssertion;
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
                result.operation.queryPrivate = getOperationStatusObject(
                    queryPrivateOperationResult,
                    queryPrivateOperationId,
                );
            } else if (contentType === CONTENT_TYPES.PRIVATE) {
                result.operation.queryPrivate = {
                    data: {
                        errorType: 'DKG_CLIENT_ERROR',
                        errorMessage: `Node doesn't have private data of ${UAL}`,
                    },
                };
            }
        }

        return result;
    }

    /* async update(UAL, content, opts = {}) {
    const options = JSON.parse(JSON.stringify(opts));
    this.validationService.validatePublishRequest(content, options);
    const assertion = await formatAssertion(content);
    const assertionId = calculateRoot(assertion);
    const endpoint = this.getEndpoint(options);
        const port = this.getPort(options);
    const tokenAmount =
      options.tokenAmount ??
      (await this.nodeApiService.getBidSuggestion(
        endpoint,
        port,
        options.blockchain.name,
        options.epochsNum,
        assertionMetadata.getAssertionSizeInBytes(assertion),
        options.hashFunctionId ?? DEFAULT_HASH_FUNCTION_ID,
      ));
    await this.blockchainService.updateAsset(
      Utilities.resolveUAL(UAL).tokenId,
      {
        assertionId,
        assertionSize: assertionMetadata.getAssertionSizeInBytes(assertion),
        triplesNumber: assertionMetadata.getAssertionTriplesNumber(assertion),
        chunksNumber: assertionMetadata.getAssertionChunksNumber(assertion),
        epochsNum: options.epochsNum,
        tokenAmount: tokenAmount,
        scoreFunctionId: options.scoreFunctionId ?? 1,
      },
      blockchain
    );
    let operationId = await this.nodeApiService.publish(
        endpoint,
        port,
      assertionId,
      assertion,
      UAL,
      hashFunctionId
    );
    let operationResult = await this.nodeApiService.getOperationResult(
      operationId,
      { ...options, operation: OPERATIONS.PUBLISH }
    );
    return {
      UAL,
      assertionId,
      operation: Utilities.getOperationStatusObject(
        operationResult,
        operationId
      ),
    };
  } */

    async transfer(UAL, newOwner, options = {}) {
        const blockchain = await this.inputService.getBlockchain(options);

        this.validationService.validateAssetTransfer(UAL, newOwner, blockchain);

        const { tokenId } = resolveUAL(UAL);
        await this.blockchainService.transferAsset(tokenId, newOwner, blockchain);
        const owner = await this.blockchainService.getAssetOwner(tokenId, blockchain);
        return {
            UAL,
            owner,
            operation: getOperationStatusObject({ status: 'COMPLETED' }, null),
        };
    }

    async getOwner(UAL, options = {}) {
        const blockchain = await this.inputService.getBlockchain(options);

        this.validationService.validateAssetGetOwner(UAL, blockchain);

        const { tokenId } = resolveUAL(UAL);
        const owner = await this.blockchainService.getAssetOwner(tokenId, blockchain);
        return {
            UAL,
            owner,
            operation: getOperationStatusObject({ data: {}, status: 'COMPLETED' }, null),
        };
    }
}
module.exports = AssetOperationsManager;
