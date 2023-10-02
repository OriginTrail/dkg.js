const { assertionMetadata, formatAssertion, calculateRoot } = require('assertion-tools');
const { ethers, ZeroHash } = require('ethers');
const {
    isEmptyObject,
    deriveUAL,
    getOperationStatusObject,
    resolveUAL,
    toNQuads,
    toJSONLD,
    sleepForMilliseconds,
    deriveRepository,
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
    DEFAULT_PARAMETERS,
} = require('../constants.js');
const emptyHooks = require('../util/empty-hooks');
const { STORE_TYPES, ASSET_STATES } = require('../constants');

class AssetOperationsManager {
    constructor(services) {
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
    }

    /**
     * Increases allowance for a set quantity of tokens.
     * @async
     * @param {number} tokenAmount - The amount of tokens to increase the allowance for.
     * @param {Object} [options={}] - Additional options for increasing allowance - currently only blockchain option expected.
     * @returns {Object} Object containing hash of blockchain transaction and status.
     */
    async increaseAllowance(tokenAmount, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateIncreaseAllowance(blockchain);

        const serviceAgreementV1Address = await this.blockchainService.getContractAddress(
            'ServiceAgreementV1',
            blockchain,
        );

        const receipt = await this.blockchainService.executeContractFunction(
            'Token',
            'increaseAllowance',
            [serviceAgreementV1Address, tokenAmount],
            blockchain,
        );

        return {
            transactionHash: receipt.transactionHash,
            status: receipt.status,
        };
    }

    /**
     * Decreases allowance for a set quantity of tokens.
     * @async
     * @param {number} tokenAmount - The amount of tokens to decrease the allowance for.
     * @param {Object} [options={}] - Additional options for decreasing allowance - currently only blockchain option expected.
     * @returns {Object} Object containing hash of blockchain transaction and status.
     */
    async decreaseAllowance(tokenAmount, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateDecreaseAllowance(blockchain);

        const serviceAgreementV1Address = await this.blockchainService.getContractAddress(
            'ServiceAgreementV1',
            blockchain,
        );

        const allowance = await this.blockchainService.callContractFunction(
            'Token',
            'allowance',
            [blockchain.publicKey, serviceAgreementV1Address],
            blockchain,
        );

        const receipt = await this.blockchainService.executeContractFunction(
            'Token',
            'decreaseAllowance',
            [
                serviceAgreementV1Address,
                BigInt(tokenAmount) > BigInt(allowance) ? allowance : tokenAmount,
            ], // So Error 'ERC20: decreased allowance below zero' is not emitted
            blockchain,
        );

        return {
            transactionHash: receipt.transactionHash,
            status: receipt.status,
        };
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
        const publicAssertionSizeInBytes =
            assertionMetadata.getAssertionSizeInBytes(publicAssertion);

        this.validationService.validateAssertionSizeInBytes(
            publicAssertionSizeInBytes +
                (privateAssertion === undefined
                    ? 0
                    : assertionMetadata.getAssertionSizeInBytes(privateAssertion)),
        );
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
                publicAssertionSizeInBytes,
                contentAssetStorageAddress,
                publicAssertionId,
                hashFunctionId,
            ));

        const tokenId = await this.blockchainService.createAsset(
            {
                publicAssertionId,
                assertionSize: publicAssertionSizeInBytes,
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

    /**
     * Retrieves a public or private assertion for a given UAL.
     * @async
     * @param {string} UAL - The Universal Asset Locator
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
        if(state === ASSET_STATES.LATEST) {
            const unfinalizedState = await this.blockchainService.getUnfinalizedState(
                tokenId,
                blockchain,
            );

            if (unfinalizedState != null && unfinalizedState !== ZeroHash) {
                publicAssertionId = unfinalizedState;
            }
        }

        let assertionIds = [];
        const isEnumState = Object.values(ASSET_STATES).includes(state);
        if(!publicAssertionId) {
            assertionIds = await this.blockchainService.getAssertionIds(tokenId, blockchain);

            if (isEnumState) {
                publicAssertionId = assertionIds[assertionIds.length - 1];
            } else if (typeof state === 'number') {
                if (state >= assertionIds.length) {
                    throw Error('State index is out of range.');
                }

                publicAssertionId = assertionIds[state];
            } else if (assertionIds.includes(state)) {
                publicAssertionId = state;
            } else if (/^0x[a-fA-F0-9]{64}$/.test(state)) {
                const unfinalizedState = await this.blockchainService.getUnfinalizedState(
                    tokenId,
                    blockchain,
                );
    
                if (unfinalizedState != null && unfinalizedState !== ZeroHash && state === unfinalizedState) {
                    publicAssertionId = unfinalizedState;
                } else {
                    throw Error('Given state hash isn\'t a part of the Knowledge Asset.')
                }
            } else {
                throw Error('Incorrect state option.');
            }
        }

        const getPublicOperationId = await this.nodeApiService.get(
            endpoint,
            port,
            authToken,
            UAL,
            isEnumState ? state : publicAssertionId,
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

        const publicAssertion = getPublicOperationResult.data.assertion;

        if (validate === true && calculateRoot(publicAssertion) !== publicAssertionId) {
            getPublicOperationResult.data = {
                errorType: 'DKG_CLIENT_ERROR',
                errorMessage: "Calculated root hashes don't match!",
            };
        }

        let result = { operation: {} };
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
            const privateAssertionLinkTriple = publicAssertion.filter((element) =>
                element.includes(PRIVATE_ASSERTION_PREDICATE),
            )[0];

            let queryPrivateOperationId;
            let queryPrivateOperationResult = {};
            if (privateAssertionLinkTriple) {
                const privateAssertionId = privateAssertionLinkTriple.match(/"(.*?)"/)[1];
                let privateAssertion;
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

                    const repository = deriveRepository(
                        DEFAULT_PARAMETERS.GRAPH_LOCATION,
                        DEFAULT_PARAMETERS.GRAPH_STATE,
                    );
                    queryPrivateOperationId = await this.nodeApiService.query(
                        endpoint,
                        port,
                        authToken,
                        queryString,
                        QUERY_TYPES.CONSTRUCT,
                        repository,
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
                    calculateRoot(privateAssertion) !== privateAssertionId
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
        const publicAssertionSizeInBytes =
            assertionMetadata.getAssertionSizeInBytes(publicAssertion);

        this.validationService.validateAssertionSizeInBytes(
            publicAssertionSizeInBytes +
                (privateAssertion === undefined
                    ? 0
                    : assertionMetadata.getAssertionSizeInBytes(privateAssertion)),
        );
        const publicAssertionId = calculateRoot(publicAssertion);

        const contentAssetStorageAddress = await this.blockchainService.getContractAddress(
            'ContentAssetStorage',
            blockchain,
        );

        let tokenAmountInWei;

        if (tokenAmount != null) {
            tokenAmountInWei = tokenAmount;
        } else {
            tokenAmountInWei = await this._getUpdateBidSuggestion(
                UAL,
                blockchain,
                endpoint,
                port,
                authToken,
                publicAssertionId,
                publicAssertionSizeInBytes,
                hashFunctionId,
            );
        }

        await this.blockchainService.updateAsset(
            tokenId,
            publicAssertionId,
            publicAssertionSizeInBytes,
            assertionMetadata.getAssertionTriplesNumber(publicAssertion),
            assertionMetadata.getAssertionChunksNumber(publicAssertion),
            tokenAmountInWei,
            blockchain,
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

        let operationResult = await this.nodeApiService.getOperationResult(
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
            hashFunctionId,
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
            publicAssertionId,
            operation: getOperationStatusObject(operationResult, operationId),
        };
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
        } while (pendingUpdate);
        if (pendingUpdate) {
            response.status = OPERATION_STATUSES.PENDING;
        } else {
            response.status = OPERATION_STATUSES.COMPLETED;
        }

        return {
            UAL,
            operation: getOperationStatusObject(
                { data: response.data, status: response.status },
                null,
            ),
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

    /**
     * Retrieves the issuer of a specified asset for a specified state index and a given blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {string} stateIndex - The state index of the assertion we want to get issuer of.
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Object} An object containing the UAL, issuer and operation status.
     */
    async getStateIssuer(UAL, stateIndex, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateAssetGetStateIssuer(UAL, stateIndex, blockchain);

        const { tokenId } = resolveUAL(UAL);

        const state = await this.blockchainService.getAssertionIdByIndex(
            tokenId,
            stateIndex,
            blockchain,
        );

        const issuer = await this.blockchainService.getAssertionIssuer(
            tokenId,
            state,
            stateIndex,
            blockchain,
        );
        return {
            UAL,
            issuer,
            state,
            operation: getOperationStatusObject({ data: {}, status: 'COMPLETED' }, null),
        };
    }

    /**
     * Retrieves the latest issuer of a specified asset and a given blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Object} An object containing the UAL, issuer and operation status.
     */
    async getLatestStateIssuer(UAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateAssetGetLatestStateIssuer(UAL, blockchain);

        const { tokenId } = resolveUAL(UAL);

        const states = await this.blockchainService.getAssertionIds(tokenId, blockchain);

        const latestStateIndex = states.length - 1;

        const latestState = states[latestStateIndex];

        const issuer = await this.blockchainService.getAssertionIssuer(
            tokenId,
            latestState,
            latestStateIndex,
            blockchain,
        );
        return {
            UAL,
            issuer,
            latestState,
            operation: getOperationStatusObject({ data: {}, status: 'COMPLETED' }, null),
        };
    }

    /**
     * Retrieves all assertion ids for a specified asset and a given blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Object} An object containing the UAL, issuer and operation status.
     */
    async getStates(UAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateAssetGetStates(UAL, blockchain);

        const { tokenId } = resolveUAL(UAL);

        const states = await this.blockchainService.getAssertionIds(tokenId, blockchain);

        return {
            UAL,
            states,
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

    async extendStoringPeriod(UAL, epochsNumber, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        const tokenAmount = this.inputService.getTokenAmount(options);

        this.validationService.validateExtendAssetStoringPeriod(
            UAL,
            epochsNumber,
            tokenAmount,
            blockchain,
        );

        const { tokenId, contract } = resolveUAL(UAL);

        let tokenAmountInWei;

        if (tokenAmount != null) {
            tokenAmountInWei = tokenAmount;
        } else {
            const endpoint = this.inputService.getEndpoint(options);
            const port = this.inputService.getPort(options);
            const authToken = this.inputService.getAuthToken(options);
            const hashFunctionId = this.inputService.getHashFunctionId(options);

            const latestFinalizedState = await this.blockchainService.getLatestAssertionId(
                tokenId,
                blockchain,
            );

            const latestFinalizedStateSize = await this.blockchainService.getAssertionSize(
                latestFinalizedState,
                blockchain,
            );

            tokenAmountInWei = await this.nodeApiService.getBidSuggestion(
                endpoint,
                port,
                authToken,
                blockchain.name.startsWith('otp') ? 'otp' : blockchain.name,
                epochsNumber,
                latestFinalizedStateSize,
                contract,
                latestFinalizedState,
                hashFunctionId,
            );
        }

        await this.blockchainService.extendAssetStoringPeriod(
            tokenId,
            epochsNumber,
            tokenAmountInWei,
            blockchain,
        );

        return {
            UAL,
            operation: getOperationStatusObject({ status: 'COMPLETED' }, null),
        };
    }

    async addTokens(UAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        const tokenAmount = this.inputService.getTokenAmount(options);

        this.validationService.validateAddTokens(UAL, tokenAmount, blockchain);

        const { tokenId } = resolveUAL(UAL);

        let tokenAmountInWei;

        if (tokenAmount != null) {
            tokenAmountInWei = tokenAmount;
        } else {
            const endpoint = this.inputService.getEndpoint(options);
            const port = this.inputService.getPort(options);
            const authToken = this.inputService.getAuthToken(options);
            const hashFunctionId = this.inputService.getHashFunctionId(options);

            const latestFinalizedState = await this.blockchainService.getLatestAssertionId(
                tokenId,
                blockchain,
            );

            const latestFinalizedStateSize = await this.blockchainService.getAssertionSize(
                latestFinalizedState,
                blockchain,
            );

            tokenAmountInWei = await this._getUpdateBidSuggestion(
                UAL,
                blockchain,
                endpoint,
                port,
                authToken,
                latestFinalizedState,
                latestFinalizedStateSize,
                hashFunctionId,
            );

            if (tokenAmountInWei <= 0) {
                throw Error(
                    `Token amount is bigger than default suggested amount, please specify exact tokenAmount if you still want to add more tokens!`,
                );
            }
        }

        await this.blockchainService.addTokens(tokenId, tokenAmountInWei, blockchain);

        return {
            UAL,
            operation: getOperationStatusObject({ status: 'COMPLETED' }, null),
        };
    }

    async addUpdateTokens(UAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        const tokenAmount = this.inputService.getTokenAmount(options);

        this.validationService.validateAddTokens(UAL, tokenAmount, blockchain);

        const { tokenId } = resolveUAL(UAL);

        let tokenAmountInWei;

        if (tokenAmount != null) {
            tokenAmountInWei = tokenAmount;
        } else {
            const endpoint = this.inputService.getEndpoint(options);
            const port = this.inputService.getPort(options);
            const authToken = this.inputService.getAuthToken(options);
            const hashFunctionId = this.inputService.getHashFunctionId(options);

            const unfinalizedState = await this.blockchainService.getUnfinalizedState(
                tokenId,
                blockchain,
            );

            const unfinalizedStateSize = await this.blockchainService.getAssertionSize(
                unfinalizedState,
                blockchain,
            );

            tokenAmountInWei = await this._getUpdateBidSuggestion(
                UAL,
                blockchain,
                endpoint,
                port,
                authToken,
                unfinalizedState,
                unfinalizedStateSize,
                hashFunctionId,
            );
            if (tokenAmountInWei <= 0) {
                throw Error(
                    `Token amount is bigger than default suggested amount, please specify exact tokenAmount if you still want to add more tokens!`,
                );
            }
        }

        await this.blockchainService.addUpdateTokens(tokenId, tokenAmountInWei, blockchain);

        return {
            UAL,
            operation: getOperationStatusObject({ status: 'COMPLETED' }, null),
        };
    }

    async _getUpdateBidSuggestion(
        UAL,
        blockchain,
        endpoint,
        port,
        authToken,
        assertionId,
        size,
        hashFunctionId,
    ) {
        const { contract, tokenId } = resolveUAL(UAL);
        const firstAssertionId = await this.blockchainService.getAssertionIdByIndex(
            tokenId,
            0,
            blockchain,
        );

        const keyword = ethers.solidityPacked(['address', 'bytes32'], [contract, firstAssertionId]);

        const agreementId = ethers.sha256(
            ethers.solidityPacked(['address', 'uint256', 'bytes'], [contract, tokenId, keyword]),
        );
        const agreementData = await this.blockchainService.getAgreementData(
            agreementId,
            blockchain,
        );

        const now = await this.blockchainService.getBlockchainTimestamp(blockchain);
        const currentEpoch = Math.floor(
            (now - agreementData.startTime) / agreementData.epochLength,
        );

        const epochsLeft = agreementData.epochsNumber - currentEpoch;

        const bidSuggestion = await this.nodeApiService.getBidSuggestion(
            endpoint,
            port,
            authToken,
            blockchain.name.startsWith('otp') ? 'otp' : blockchain.name,
            epochsLeft,
            size,
            contract,
            assertionId,
            hashFunctionId,
        );

        const tokenAmountInWei =
            BigInt(bidSuggestion) -
            (BigInt(agreementData.tokenAmount) + BigInt(agreementData.updateTokenAmount ?? 0));

        return tokenAmountInWei > 0 ? tokenAmountInWei : 0;
    }
}

module.exports = AssetOperationsManager;
