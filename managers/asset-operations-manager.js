const { assertionMetadata, formatAssertion, calculateRoot } = require('assertion-tools');
const jsonld = require('jsonld');
const {
    isEmptyObject,
    deriveUAL,
    getOperationStatusObject,
    resolveUAL,
} = require('../services/utilities.js');
const {
    OPERATIONS,
    OPERATIONS_STEP_STATUS,
    GET_OUTPUT_FORMATS,
    OPERATION_STATUSES,
    DEFAULT_GET_LOCAL_STORE_RESULT_FREQUENCY,
    PRIVATE_ASSERTION_PREDICATE,
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
        this.validationService.validateContentType(content);
        let jsonContent = {};

        // for backwards compatibility
        if (!content.public && !content.private) {
            jsonContent.public = content;
        } else {
            jsonContent = content;
        }

        const blockchain = this.inputService.getBlockchain(options);
        const endpoint = this.inputService.getEndpoint(options);
        const port = this.inputService.getPort(options);
        const maxNumberOfRetries = this.inputService.getMaxNumberOfRetries(options);
        const frequency = this.inputService.getFrequency(options);
        const epochsNum = this.inputService.getEpochsNum(options);
        const hashFunctionId = this.inputService.getHashFunctionId(options);
        const scoreFunctionId = this.inputService.getScoreFunctionId(options);
        const immutable = this.inputService.getImmutable(options);
        const tokenAmount = this.inputService.getTokenAmount(options);
        const authToken = this.inputService.getAuthToken(options);

        this.validationService.validatePublishRequest(jsonContent, blockchain);

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
            blockchain: blockchain.name,
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
        let operationId = await this.nodeApiService.localStore(endpoint, port, authToken, assertions);
        let operationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.LOCAL_STORE,
            maxNumberOfRetries,
            DEFAULT_GET_LOCAL_STORE_RESULT_FREQUENCY,
            operationId,
        );

        const UAL = deriveUAL(blockchain.name, contentAssetStorageAddress, tokenId);

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
            blockchain.name,
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
        const blockchain = this.inputService.getBlockchain(options);
        const endpoint = this.inputService.getEndpoint(options);
        const port = this.inputService.getPort(options);
        const maxNumberOfRetries = this.inputService.getMaxNumberOfRetries(options);
        const frequency = this.inputService.getFrequency(options);
        const validate = this.inputService.getValidate(options);
        const outputFormat = this.inputService.getOutputFormat(options);
        const authToken = this.inputService.getAuthToken(options);
        const hashFunctionId = this.inputService.getHashFunctionId(options);

        this.validationService.validateGetRequest(UAL, blockchain, options);

        const { tokenId } = resolveUAL(UAL);

        const assertionId = await this.blockchainService.getLatestAssertionId(tokenId, blockchain);

        const operationId = await this.nodeApiService.get(
            endpoint,
            port,
            authToken,
            UAL,
            hashFunctionId,
        );

        let operationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.GET,
            maxNumberOfRetries,
            frequency,
            operationId,
        );
        let { assertion } = operationResult.data;
        if (assertion) {
            try {
                if (validate === true && calculateRoot(assertion) !== assertionId) {
                    throw Error("Calculated root hashes don't match!");
                }
                if (outputFormat !== GET_OUTPUT_FORMATS.N_QUADS) {
                    assertion = await jsonld.fromRDF(assertion.join('\n'), {
                        algorithm: 'URDNA2015',
                        format: 'application/n-quads',
                    });
                } else {
                    assertion = assertion.join('\n');
                }
            } catch (error) {
                operationResult = {
                    ...operationResult,
                    data: {
                        errorType: 'DKG_CLIENT_ERROR',
                        errorMessage: error.message,
                    },
                };
            }
        }

        return {
            assertion,
            assertionId,
            operation: getOperationStatusObject(operationResult, operationId),
        };
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

    async transfer(UAL, to, options = {}) {
        const blockchain = await this.inputService.getBlockchain(options);

        this.validationService.validateAssetTransferRequest(UAL, to, blockchain);

        const { tokenId } = resolveUAL(UAL);
        await this.blockchainService.transferAsset(tokenId, to, blockchain);
        const owner = await this.blockchainService.getAssetOwner(tokenId, blockchain);
        return {
            UAL,
            owner,
            operation: getOperationStatusObject({ status: 'COMPLETED' }, null),
        };
    }

    async getOwner(UAL, options = {}) {
        const blockchain = await this.inputService.getBlockchain(options);

        this.validationService.validateGetOwnerRequest(UAL, blockchain);

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
