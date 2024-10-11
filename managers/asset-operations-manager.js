const { assertionMetadata, calculateRoot, formatGraph } = require('assertion-tools');
const { ethers, ZeroHash } = require('ethers');
const {
    deriveUAL,
    getOperationStatusObject,
    resolveUAL,
    toNQuads,
    toJSONLD,
} = require('../services/utilities.js');
const {
    ASSET_STATES,
    CONTENT_TYPES,
    OPERATIONS,
    OPERATIONS_STEP_STATUS,
    GET_OUTPUT_FORMATS,
    OPERATION_STATUSES,
    DEFAULT_GET_LOCAL_STORE_RESULT_FREQUENCY,
    PRIVATE_ASSERTION_PREDICATE,
    STORE_TYPES,
    QUERY_TYPES,
    OT_NODE_TRIPLE_STORE_REPOSITORIES,
    ZERO_ADDRESS,
} = require('../constants.js');
const emptyHooks = require('../util/empty-hooks');

class AssetOperationsManager {
    constructor(services) {
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
    }

    /**
     * Checks if given UAL is valid.
     * @async
     * @param {string} UAL - Universal Asset Locator.
     * @param {Object} [options={}] - Additional options - currently only blockchain option expected.
     * @returns {boolean} UAL have passed validation.
     * @throws {Error} Throws an error if UAL validation fails.
     * @example did:dkg:otp:2043/0x5cac41237127f94c2d21dae0b14bfefa99880630/1985318
     */
    async isValidUAL(UAL, options = {}) {
        if (typeof UAL !== 'string' || UAL.trim() === '') {
            throw new Error('UAL must be a non-empty string.');
        }

        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateIsValidUAL(blockchain);

        const parts = UAL.split('/');
        if (parts.length !== 3) {
            throw new Error('UAL format is incorrect.');
        }

        const prefixes = parts[0].split(':');
        if (prefixes.length !== 3 && prefixes.length !== 4) {
            throw new Error('Prefix format in UAL is incorrect.');
        }

        if (prefixes[0] !== 'did') {
            throw new Error(`Invalid DID prefix. Expected: 'did'. Received: '${prefixes[0]}'.`);
        }

        if (prefixes[1] !== 'dkg') {
            throw new Error(`Invalid DKG prefix. Expected: 'dkg'. Received: '${prefixes[1]}'.`);
        }

        if (prefixes[2] !== blockchain.name.split(':')[0]) {
            throw new Error(
                `Invalid blockchain name in the UAL prefix. Expected: '${
                    blockchain.name.split(':')[0]
                }'. Received: '${prefixes[2]}'.`,
            );
        }

        if (prefixes.length === 4) {
            const chainId = await this.blockchainService.getChainId(blockchain);
            if (Number(prefixes[3]) !== chainId) {
                throw new Error(
                    `Chain ID in UAL does not match the blockchain. Expected: '${chainId}'. Received: '${prefixes[3]}'.`,
                );
            }
        }

        const contractAddress = await this.blockchainService.getContractAddress(
            'ContentAssetStorage',
            blockchain,
        );
        if (parts[1].toLowerCase() !== contractAddress.toLowerCase()) {
            throw new Error(
                `Contract address in UAL does not match. Expected: '${contractAddress}'. Received: '${parts[1]}'.`,
            );
        }

        try {
            const owner = await this.blockchainService.getAssetOwner(parts[2], blockchain);
            if (!owner || owner === ZERO_ADDRESS) {
                throw new Error('Token does not exist or has no owner.');
            }
            return true;
        } catch (error) {
            throw new Error(`Error fetching asset owner: ${error.message}`);
        }
    }

    /**
     * Sets allowance to a given quantity of tokens.
     * @async
     * @param {BigInt} tokenAmount - The amount of tokens (Wei) to set the allowance.
     * @param {Object} [options={}] - Additional options for increasing allowance - currently only blockchain option expected.
     * @returns {Object} Object containing hash of blockchain transaction and status.
     */
    async setAllowance(tokenAmount, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateSetAllowance(blockchain);

        const serviceAgreementV1Address = await this.blockchainService.getContractAddress(
            'ServiceAgreementV1',
            blockchain,
        );

        const currentAllowance = BigInt(
            await this.blockchainService.callContractFunction(
                'Token',
                'allowance',
                [blockchain.publicKey, serviceAgreementV1Address],
                blockchain,
            ),
        );

        const allowanceDifference = tokenAmount - currentAllowance;

        let receipt;
        if (allowanceDifference > 0) {
            receipt = await this.blockchainService.executeContractFunction(
                'Token',
                'increaseAllowance',
                [serviceAgreementV1Address, allowanceDifference],
                blockchain,
            );
        } else if (allowanceDifference < 0) {
            receipt = await this.blockchainService.executeContractFunction(
                'Token',
                'decreaseAllowance',
                [serviceAgreementV1Address, -allowanceDifference],
                blockchain,
            );
        }

        if (receipt) {
            return {
                operation: receipt,
                transactionHash: receipt.transactionHash,
                status: receipt.status,
            };
        }

        return { status: 'Skipped: Allowance is already equal to the requested amount.' };
    }

    /**
     * Increases allowance for a set quantity of tokens.
     * @async
     * @param {BigInt} tokenAmount - The amount of tokens (Wei) to increase the allowance for.
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
            operation: receipt,
            transactionHash: receipt.transactionHash,
            status: receipt.status,
        };
    }

    /**
     * Decreases allowance for a set quantity of tokens.
     * @async
     * @param {BigInt} tokenAmount - The amount of tokens (Wei) to decrease the allowance for.
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
            operation: receipt,
            transactionHash: receipt.transactionHash,
            status: receipt.status,
        };
    }

    /**
     * Gets current allowance in Wei.
     * @async
     * @param {Object} [options={}] - Additional options for decreasing allowance - currently only blockchain option expected.
     * @returns {BigInt} Current allowance (Wei).
     */
    async getCurrentAllowance(options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

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

        return BigInt(allowance);
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
            paranetUAL,
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
            paranetUAL,
        );

        const { public: publicAssertion, private: privateAssertion } = await formatGraph(
            jsonContent,
        );
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
                blockchain.name,
                epochsNum,
                publicAssertionSizeInBytes,
                contentAssetStorageAddress,
                publicAssertionId,
                hashFunctionId,
            ));

        let tokenId;
        let mintKnowledgeAssetReceipt;
        if (paranetUAL == null) {
            ({ tokenId, receipt: mintKnowledgeAssetReceipt } =
                await this.blockchainService.createAsset(
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
                    null,
                    null,
                    blockchain,
                    stepHooks,
                ));
        } else {
            const { contract: paranetKaContract, tokenId: paranetTokenId } = resolveUAL(paranetUAL);
            ({ tokenId, receipt: mintKnowledgeAssetReceipt } =
                await this.blockchainService.createAsset(
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
                    paranetKaContract,
                    paranetTokenId,
                    blockchain,
                    stepHooks,
                ));
        }

        const resolvedUAL = {
            blockchain: blockchain.name,
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
                assertionId: calculateRoot(privateAssertion),
                assertion: privateAssertion,
                storeType: STORE_TYPES.TRIPLE,
            });
        }

        const UAL = deriveUAL(blockchain.name, contentAssetStorageAddress, tokenId);

        const publishOperationId = await this.nodeApiService.publish(
            endpoint,
            port,
            authToken,
            publicAssertionId,
            publicAssertion,
            blockchain.name,
            contentAssetStorageAddress,
            tokenId,
            hashFunctionId,
        );

        const publishOperationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.PUBLISH,
            maxNumberOfRetries,
            frequency,
            publishOperationId,
        );

        if (publishOperationResult.status === OPERATION_STATUSES.FAILED) {
            return {
                UAL,
                assertionId: publicAssertionId,
                operation: {
                    mintKnowledgeAsset: mintKnowledgeAssetReceipt,
                    publish: getOperationStatusObject(publishOperationResult, publishOperationId),
                },
            };
        }

        const localStoreOperationId = await this.nodeApiService.localStore(
            endpoint,
            port,
            authToken,
            assertions,
        );

        const localStoreOperationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.LOCAL_STORE,
            maxNumberOfRetries,
            DEFAULT_GET_LOCAL_STORE_RESULT_FREQUENCY,
            localStoreOperationId,
        );

        stepHooks.afterHook({
            status: OPERATIONS_STEP_STATUS.CREATE_ASSET_COMPLETED,
            data: {
                localStoreOperationId,
                localStoreOperationResult,
            },
        });

        return {
            UAL,
            publicAssertionId,
            operation: {
                mintKnowledgeAsset: mintKnowledgeAssetReceipt,
                publish: getOperationStatusObject(publishOperationResult, publishOperationId),
                localStore: getOperationStatusObject(
                    localStoreOperationResult,
                    localStoreOperationId,
                ),
            },
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
            } else if (/^0x[a-fA-F0-9]{64}$/.test(state)) {
                const unfinalizedState = await this.blockchainService.getUnfinalizedState(
                    tokenId,
                    blockchain,
                );

                if (
                    unfinalizedState != null &&
                    unfinalizedState !== ZeroHash &&
                    state === unfinalizedState
                ) {
                    publicAssertionId = unfinalizedState;
                    stateFinalized = false;
                } else {
                    throw new Error("Given state hash isn't a part of the Knowledge Asset.");
                }
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

        const { assertion: publicAssertion, privateAssertion: privateAssertion } =
            getPublicOperationResult.data;

        if (validate === true && calculateRoot(publicAssertion) !== publicAssertionId) {
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
            const formattedPrivateAssertion = await toJSONLD(privateAssertion.join('\n'));
            const formattedPublicAssertion = await toJSONLD(publicAssertion.join('\n'));
            result.public = {
                assertion: formattedPublicAssertion,
                assertionId: publicAssertionId,
            };
            result.private = {
                assertion: formattedPrivateAssertion,
                assertionId: getPublicOperationResult.data.privateAssertionId,
            };

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
        const receipt = await this.blockchainService.transferAsset(tokenId, newOwner, blockchain);
        const owner = await this.blockchainService.getAssetOwner(tokenId, blockchain);

        return {
            UAL,
            owner,
            operation: receipt,
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

    /**
     * Burn an asset on a specified blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Object} An object containing the UAL and operation status.
     */
    async burn(UAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateAssetBurn(UAL, blockchain);

        const { tokenId } = resolveUAL(UAL);
        const receipt = await this.blockchainService.burnAsset(tokenId, blockchain);

        return {
            UAL,
            operation: receipt,
        };
    }

    /**
     * Extend the storing period of an asset on a specified blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {number} epochsNumber - Nmber of epochs for the extension.
     * @param {Object} [options={}] - Additional options for asset storing period extension.
     * @returns {Object} An object containing the UAL and operation status.
     */
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
                blockchain.name,
                epochsNumber,
                latestFinalizedStateSize,
                contract,
                latestFinalizedState,
                hashFunctionId,
            );
        }

        const receipt = await this.blockchainService.extendAssetStoringPeriod(
            tokenId,
            epochsNumber,
            tokenAmountInWei,
            blockchain,
        );

        return {
            UAL,
            operation: receipt,
        };
    }

    /**
     * Add tokens for an asset on the specified blockchain to a ongoing publishing operation.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {Object} [options={}] - Additional options for adding tokens.
     * @returns {Object} An object containing the UAL and operation status.
     */
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
                throw new Error(
                    `Token amount is bigger than default suggested amount, please specify exact tokenAmount if you still want to add more tokens!`,
                );
            }
        }

        const receipt = await this.blockchainService.addTokens(
            tokenId,
            tokenAmountInWei,
            blockchain,
        );

        return {
            UAL,
            operation: receipt,
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
            blockchain.name,
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

    /**
     * Add knowledge asset to a paranet.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the knowledge asset.
     * @param {string} paranetUAL - The Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for adding tokens.
     * @returns {Object} An object containing the UAL and operation status.
     */
    async submitToParanet(UAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        const paranetUAL = this.inputService.getParanetUAL(options);

        this.validationService.validateSubmitToParanet(UAL, paranetUAL, blockchain);

        const { contract, tokenId } = resolveUAL(UAL);
        const { contract: paranetContract, tokenId: paranetTokenId } = resolveUAL(paranetUAL);

        const receipt = await this.blockchainService.submitToParanet(
            {
                paranetContract,
                paranetTokenId,
                contract,
                tokenId,
            },
            blockchain,
        );

        return {
            UAL,
            operation: receipt,
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
    async createParanet(content, options = {}, stepHooks = emptyHooks) {
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
            paranetUAL,
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
            paranetUAL,
        );

        const { public: publicAssertion, private: privateAssertion } = await formatGraph(
            jsonContent,
        );
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
                blockchain.name,
                epochsNum,
                publicAssertionSizeInBytes,
                contentAssetStorageAddress,
                publicAssertionId,
                hashFunctionId,
            ));

        const { contract: paranetKaContract, tokenId: paranetTokenId } = resolveUAL(paranetUAL);
        const { tokenId, receipt: mintKnowledgeAssetReceipt } =
            await this.blockchainService.createAsset(
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
                paranetKaContract,
                paranetTokenId,
                blockchain,
                stepHooks,
            );

        const resolvedUAL = {
            blockchain: blockchain.name,
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
                assertionId: calculateRoot(privateAssertion),
                assertion: privateAssertion,
                storeType: STORE_TYPES.TRIPLE,
            });
        }

        const UAL = deriveUAL(blockchain.name, contentAssetStorageAddress, tokenId);

        const publishOperationId = await this.nodeApiService.publishParanet(
            endpoint,
            port,
            authToken,
            assertions,
            blockchain.name,
            contentAssetStorageAddress,
            tokenId,
            hashFunctionId,
            paranetUAL,
            mintKnowledgeAssetReceipt.from,
            mintKnowledgeAssetReceipt.transactionHash,
        );

        const publishOperationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.PUBLISH_PARANET,

            maxNumberOfRetries,
            frequency,
            publishOperationId,
        );

        if (publishOperationResult.status === OPERATION_STATUSES.FAILED) {
            return {
                UAL,
                assertionId: publicAssertionId,
                operation: {
                    mintKnowledgeAsset: mintKnowledgeAssetReceipt,
                    publish: getOperationStatusObject(publishOperationResult, publishOperationId),
                },
            };
        }

        return {
            UAL,
            publicAssertionId,
            operation: {
                mintKnowledgeAsset: mintKnowledgeAssetReceipt,
                publish: getOperationStatusObject(publishOperationResult, publishOperationId),
            },
        };
    }
}

module.exports = AssetOperationsManager;
