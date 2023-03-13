const { assertionMetadata, formatAssertion, calculateRoot } = require('assertion-tools');
const JsonLdError = require('jsonld/lib/JsonLdError.js');
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
const { sleepForMilliseconds } = require('../services/utilities.js');
const {STORE_TYPES, ASSET_STATES} = require('../constants');

class AssetOperationsManager {
    constructor(config, services) {
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
    }

    /**
     * Creates a new asset.
     * @async
     * @param {Object} content - The content of the asset to be created, contains public, private or both keys.
     * @param {Object} [options={}] - Additional options for asset creation.
     * @param {Object} [stepHooks=emptyHooks] - Hooks to execute during asset creation.
     * @returns {Object} Object containing UAL, publicAssertionId and operation status.
     */
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

        let operationResult = {};

        let privateAssertion;
        let privateAssertionId;
        if (jsonContent.private && !isEmptyObject(jsonContent.private)) {
            try {
                privateAssertion = await formatAssertion(jsonContent.private);
            } catch (error) {
                let errorMessage;
                if (error instanceof JsonLdError && Object.hasOwn(error, 'details')) {
                    errorMessage = error.details.message;
                } else {
                    errorMessage = error.message;
                }

                operationResult.status = undefined;
                operationResult.data = {
                    errorType: 'DKG_CLIENT_ERROR',
                    errorMessage,
                };

                return {
                    operation: getOperationStatusObject(operationResult, undefined),
                };
            }

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

        let publicAssertion;
        try {
            publicAssertion = await formatAssertion(publicGraph);
        } catch (error) {
            let errorMessage;
            if (error instanceof JsonLdError && Object.hasOwn(error, 'details')) {
                errorMessage = error.details.message;
            } else {
                errorMessage = error.message;
            }

            operationResult.status = undefined;
            operationResult.data = {
                errorType: 'DKG_CLIENT_ERROR',
                errorMessage,
            };

            return {
                operation: getOperationStatusObject(operationResult, undefined),
            };
        }

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
                storeType: STORE_TYPES.TRIPLE,
            },
        ];
        if (privateAssertion?.length) {
            assertions.push({
                ...resolvedUAL,
                assertionId: privateAssertionId,
                assertion: privateAssertion,
                storeType: STORE_TYPES.TRIPLE,
            });
        }
        let operationId = await this.nodeApiService.localStore(
            endpoint,
            port,
            authToken,
            assertions,
        );
        operationResult = await this.nodeApiService.getOperationResult(
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

    /**
     * Retrieves a public or private assertion for a given UAL.
     * @async
     * @param {string} UAL - The Universal Asset Locator
     * @param {Object} [options={}] - Optional parameters for the asset get operation.
     * @param {string} [options.state] - The state of the asset, "latest" or "finalized".
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
        const hasPendingUpdate = await this.blockchainService.hasPendingUpdate(tokenId, blockchain);
        if (state === ASSET_STATES.LATEST && hasPendingUpdate) {
            publicAssertionId = await this.blockchainService.getUnfinalizedState(
                tokenId,
                blockchain
            );
        } else {
            publicAssertionId = await this.blockchainService.getLatestAssertionId(
                tokenId,
                blockchain,
            );
        }

        const getPublicOperationId = await this.nodeApiService.get(
            endpoint,
            port,
            authToken,
            UAL,
            state,
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
            getPublicOperationResult.status = undefined;
            getPublicOperationResult.data = {
                errorType: 'DKG_CLIENT_ERROR',
                errorMessage: "Calculated root hashes don't match!",
            };

            return {
                operation: getOperationStatusObject(getPublicOperationResult, undefined),
            };
        }

        let result = { operation: {} };
        if (contentType !== CONTENT_TYPES.PRIVATE) {
            let formattedPublicAssertion = publicAssertion;
              if (outputFormat !== GET_OUTPUT_FORMATS.N_QUADS) {
                  try {
                      formattedPublicAssertion = await toJSONLD(publicAssertion.join('\n'));
                  } catch (error) {
                      let errorMessage;
                      if (error instanceof JsonLdError && Object.hasOwn(error, 'details')) {
                          errorMessage = error.details.message;
                      } else {
                          errorMessage = error.message;
                      }
      
                      getPublicOperationResult.status = undefined;
                      getPublicOperationResult.data = {
                          errorType: 'DKG_CLIENT_ERROR',
                          errorMessage,
                      };

                      return {
                          operation: getOperationStatusObject(getPublicOperationResult, undefined),
                      };
                  }
              } else {
                  formattedPublicAssertion = publicAssertion.join('\n');
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

            result.operation = getOperationStatusObject(
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
                
                let privateAssertion;
                try {
                  privateAssertion = await toNQuads(
                      privateAssertionNQuads,
                      'application/n-quads',
                  );
                } catch (error) {
                  let errorMessage;
                  if (error instanceof JsonLdError && Object.hasOwn(error, 'details')) {
                      errorMessage = error.details.message;
                  } else {
                      errorMessage = error.message;
                  }

                  queryPrivateOperationResult.status = undefined;
                  queryPrivateOperationResult.data = {
                      errorType: 'DKG_CLIENT_ERROR',
                      errorMessage,
                  };

                  return {
                      operation: getOperationStatusObject(queryPrivateOperationResult, undefined),
                  };
                }

                let formattedPrivateAssertion;
                if (
                    privateAssertion.length &&
                    validate === true &&
                    calculateRoot(privateAssertion) !== privateAssertionId
                ) {
                    queryPrivateOperationResult.status = undefined;
                    queryPrivateOperationResult.data = {
                        errorType: 'DKG_CLIENT_ERROR',
                        errorMessage: "Calculated root hashes don't match!",
                    };

                    return {
                        operation: getOperationStatusObject(queryPrivateOperationResult, undefined),
                    };
                }

                if (outputFormat !== GET_OUTPUT_FORMATS.N_QUADS) {
                    try {
                        formattedPrivateAssertion = await toJSONLD(privateAssertion.join('\n'));
                    } catch (error) {
                        let errorMessage;
                        if (error instanceof JsonLdError && Object.hasOwn(error, 'details')) {
                            errorMessage = error.details.message;
                        } else {
                            errorMessage = error.message;
                        }

                        queryPrivateOperationResult.status = undefined;
                        queryPrivateOperationResult.data = {
                            errorType: 'DKG_CLIENT_ERROR',
                            errorMessage,
                        };

                        return {
                            operation: getOperationStatusObject(queryPrivateOperationResult, undefined),
                        };
                    }
                } else {
                    formattedPrivateAssertion = privateAssertion.join('\n');
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
                result.operation = getOperationStatusObject(
                    queryPrivateOperationResult,
                    queryPrivateOperationId,
                );
            }
        }

        return result;
    }

    /**
     * Updates an existing asset.
     * @async
     * @param {string} UAL - The Universal Asset Locator
     * @param {Object} content - The content of the asset to be updated.
     * @param {Object} [options={}] - Additional options for asset update.
     * @returns {Object} Object containing UAL, publicAssertionId and operation status.
     */
    async update(UAL, content, options = {}) {
        this.validationService.validateObjectType(content);
        const jsonContent = content;

        const {
            blockchain,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            hashFunctionId,
            scoreFunctionId,
            tokenAmount,
            authToken,
        } = this.inputService.getAssetUpdateArguments(options);

        this.validationService.validateAssetUpdate(
            jsonContent,
            blockchain,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            hashFunctionId,
            scoreFunctionId,
            tokenAmount,
            authToken,
        );

        const { tokenId } = resolveUAL(UAL);

        let operationResult = {};

        let privateAssertion;
        let privateAssertionId;
        if (jsonContent.private && !isEmptyObject(jsonContent.private)) {
            try {
                privateAssertion = await formatAssertion(jsonContent.private);
            } catch (error) {
                let errorMessage;
                if (error instanceof JsonLdError && Object.hasOwn(error, 'details')) {
                    errorMessage = error.details.message;
                } else {
                    errorMessage = error.message;
                }

                operationResult.status = undefined;
                operationResult.data = {
                    errorType: 'DKG_CLIENT_ERROR',
                    errorMessage,
                };

                return {
                    operation: getOperationStatusObject(operationResult, undefined),
                };
            }
            privateAssertionId = calculateRoot(privateAssertion);
        }

        // If public assertion is not provided, get it from the network
        let publicAssertion;
        if (!jsonContent.public || isEmptyObject(jsonContent.public)) {
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

            publicAssertion = getPublicOperationResult.data.assertion;

            if (calculateRoot(publicAssertion) !== publicAssertionId) {
                getPublicOperationResult.status = undefined;
                getPublicOperationResult.data = {
                    errorType: 'DKG_CLIENT_ERROR',
                    errorMessage: "Calculated root hashes don't match!",
                };

                // TODO: Check returned response
                return {
                    operation: getOperationStatusObject(getPublicOperationResult, undefined),
                };
            }

            // Transform public assertion to include updated private assertion Id
            const hashRegex = /"([^"]+)"/; // Regex pattern to match the hash value inside the double quotes
            publicAssertion = publicAssertion.map((str) => {
                if (str.includes('privateAssertionID')) {
                    return str.replace(hashRegex, `"${privateAssertionId}"`);
                }
                return str;
            });
        } else {
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

            try {
                publicAssertion = await formatAssertion(publicGraph);
            } catch (error) {
                let errorMessage;
                if (error instanceof JsonLdError && Object.hasOwn(error, 'details')) {
                    errorMessage = error.details.message;
                } else {
                    errorMessage = error.message;
                }

                operationResult.status = undefined;
                operationResult.data = {
                    errorType: 'DKG_CLIENT_ERROR',
                    errorMessage,
                };

                return {
                    operation: getOperationStatusObject(operationResult, undefined),
                };
          }
        }

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
                1, // TODO: Determine number of epochs
                assertionMetadata.getAssertionSizeInBytes(publicAssertion),
                contentAssetStorageAddress,
                publicAssertionId,
                hashFunctionId,
            ));

        await this.blockchainService.updateAsset(
          resolveUAL(UAL).tokenId,
          publicAssertionId,
          assertionMetadata.getAssertionSizeInBytes(publicAssertion),
          assertionMetadata.getAssertionTriplesNumber(publicAssertion),
          assertionMetadata.getAssertionChunksNumber(publicAssertion),
          tokenAmountInWei,
          blockchain
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
                storeType: STORE_TYPES.PENDING,
            },
        ];

        if (privateAssertion?.length) {
            assertions.push({
                ...resolvedUAL,
                assertionId: privateAssertionId,
                assertion: privateAssertion,
                storeType: STORE_TYPES.PENDING,
            });
        }

        let operationId = await this.nodeApiService.localStore(
            endpoint,
            port,
            authToken,
            assertions,
        );

        operationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.LOCAL_STORE,
            maxNumberOfRetries,
            DEFAULT_GET_LOCAL_STORE_RESULT_FREQUENCY,
            operationId,
        );

        if (operationResult.status === OPERATION_STATUSES.FAILED) {
            return {
                UAL,
                assertionId: publicAssertionId,
                operation: getOperationStatusObject(operationResult, operationId),
            };
        }

        operationId = await this.nodeApiService.update(
            endpoint,
            port,
            authToken,
            publicAssertionId,
            publicAssertion,
            blockchain.name.startsWith('otp') ? 'otp' : blockchain.name,
            contentAssetStorageAddress,
            tokenId,
            hashFunctionId
        );
        operationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.UPDATE,
            maxNumberOfRetries,
            frequency,
            operationId,
        );

        return {
            UAL,
            operation: getOperationStatusObject(operationResult, operationId),
        }
    }

    async waitFinalization(UAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        const frequency = this.inputService.getFrequency(options);
        const maxNumberOfRetries = this.inputService.getMaxNumberOfRetries(options);

        this.validationService.validateWaitAssetUpdateFinalization(UAL, blockchain);

        const { tokenId } = resolveUAL(UAL);
        const response = {
            status: OPERATION_STATUSES.PENDING,
        };
        let pendingUpdate = true;
        let retries = 0;
        do {
            if (retries > maxNumberOfRetries) {
                response.data = {
                    ...response.data,
                    data: {
                        errorType: 'DKG_CLIENT_ERROR',
                        errorMessage: 'Unable to get results. Max number of retries reached.',
                    },
                };
                break;
            }
            retries += 1;
            // eslint-disable-next-line no-await-in-loop
            await sleepForMilliseconds(frequency * 1000);
            // eslint-disable-next-line no-await-in-loop
            pendingUpdate = await this.blockchainService.hasPendingUpdate(tokenId, blockchain);
        } while(pendingUpdate);
        if (pendingUpdate) {
            response.status = OPERATION_STATUSES.PENDING;
        } else {
            response.status = OPERATION_STATUSES.COMPLETED;
        }

        return {
            UAL,
            operation: getOperationStatusObject({ data: response.data, status: response.status }, null),
        };
    }

    async cancelUpdate(UAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateAssetUpdateCancel(UAL, blockchain);

        const { tokenId } = resolveUAL(UAL);
        await this.blockchainService.cancelAssetUpdate(tokenId, blockchain);

        return {
            UAL,
            operation: getOperationStatusObject({ status: 'COMPLETED' }, null),
        };
    }

    /**
     * Transfer an asset to a new owner on a specified blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset to be transferred.
     * @param {string} newOwner - The address of the new owner.
     * @param {Object} [options={}] - Additional options for asset transfer.
     * @returns {Object} Object containing UAL, owner's address and operation status.
     */
    async transfer(UAL, newOwner, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

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

    /**
     * Retrieves the owner of a specified asset for a given blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Object} An object containing the UAL, owner and operation status.
     */
    async getOwner(UAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateAssetGetOwner(UAL, blockchain);

        const { tokenId } = resolveUAL(UAL);
        const owner = await this.blockchainService.getAssetOwner(tokenId, blockchain);
        return {
            UAL,
            owner,
            operation: getOperationStatusObject({ data: {}, status: 'COMPLETED' }, null),
        };
    }

    async burn(UAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateAssetBurn(UAL, blockchain);

        const { tokenId } = resolveUAL(UAL);
        await this.blockchainService.burnAsset(tokenId, blockchain);

        return {
            UAL,
            operation: getOperationStatusObject({ status: 'COMPLETED' }, null),
        };
    }

    async extendStoringPeriod(UAL, epochsNumber, tokenAmount, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateExtendAssetStoringPeriod(UAL, epochsNumber, tokenAmount, blockchain);

        const { tokenId } = resolveUAL(UAL);
        await this.blockchainService.extendAssetStoringPeriod(tokenId, epochsNumber, tokenAmount, blockchain);

        return {
            UAL,
            operation: getOperationStatusObject({ status: 'COMPLETED' }, null),
        };
    }

    async addTokens(UAL, tokenAmount, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateAddTokens(UAL, tokenAmount, blockchain);

        const { tokenId } = resolveUAL(UAL);
        await this.blockchainService.addTokens(tokenId, tokenAmount, blockchain);

        return {
            UAL,
            operation: getOperationStatusObject({ status: 'COMPLETED' }, null),
        };
    }
}

module.exports = AssetOperationsManager;
