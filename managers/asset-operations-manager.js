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
    DEFAULT_HASH_FUNCTION_ID,
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
    }

    async create(userContent, opts = {}, stepHooks = emptyHooks) {
        const options = JSON.parse(JSON.stringify(opts));

        this.validationService.validateContentType(userContent);
        let content = {};

        // for backwards compatibility
        if (!userContent.public && !userContent.private) {
            content.public = userContent;
        } else {
            content = userContent;
        }

        this.validationService.validatePublishRequest(content, options);

        let privateAssertion;
        let privateAssertionId;
        if (content.private && !isEmptyObject(content.private)) {
            privateAssertion = await formatAssertion(content.private);
            privateAssertionId = calculateRoot(privateAssertion);
        }
        const publicGraph = {
            '@graph': [
                content.public && !isEmptyObject(content.public) ? content.public : null,
                content.private && !isEmptyObject(content.private)
                    ? {
                          [PRIVATE_ASSERTION_PREDICATE]: privateAssertionId,
                      }
                    : null,
            ],
        };
        const publicAssertion = await formatAssertion(publicGraph);
        const publicAssertionId = calculateRoot(publicAssertion);

        const blockchain = this.blockchainService.getBlockchain(options);
        const contentAssetStorageAddress = await this.blockchainService.getContractAddress(
            blockchain.name,
            'ContentAssetStorage',
            blockchain.rpc,
        );
        const tokenAmountInWei =
            options.tokenAmount ??
            (await this.nodeApiService.getBidSuggestion(
                blockchain.name.startsWith('otp') ? 'otp' : blockchain.name,
                options.epochsNum,
                assertionMetadata.getAssertionSizeInBytes(publicAssertion),
                contentAssetStorageAddress,
                publicAssertionId,
                options.hashFunctionId ?? DEFAULT_HASH_FUNCTION_ID,
                options,
            ));
        const tokenId = await this.blockchainService.createAsset(
            {
                publicAssertionId,
                assertionSize: assertionMetadata.getAssertionSizeInBytes(publicAssertion),
                triplesNumber: assertionMetadata.getAssertionTriplesNumber(publicAssertion),
                chunksNumber: assertionMetadata.getAssertionChunksNumber(publicAssertion),
                epochsNum: options.epochsNum,
                tokenAmount: tokenAmountInWei,
                scoreFunctionId: options.scoreFunctionId ?? 1,
                immutable_: options.immutable ?? false,
            },
            options,
            stepHooks,
        );

        const UAL = deriveUAL(blockchain.name, contentAssetStorageAddress, tokenId);

        let operationResult;
        let operationId;
        if (privateAssertion?.length) {
            operationId = await this.nodeApiService.localStore(
                [
                    {
                        blockchain: blockchain.name,
                        contract: contentAssetStorageAddress,
                        tokenId,
                        assertionId: publicAssertionId,
                        assertion: publicAssertion,
                    },
                    {
                        blockchain: blockchain.name,
                        contract: contentAssetStorageAddress,
                        tokenId,
                        assertionId: privateAssertionId,
                        assertion: privateAssertion,
                    },
                ],
                options,
            );
            operationResult = await this.nodeApiService.getOperationResult(operationId, {
                ...options,
                operation: OPERATIONS.LOCAL_STORE,
                frequency: DEFAULT_GET_LOCAL_STORE_RESULT_FREQUENCY,
            });

            if (operationResult.status === OPERATION_STATUSES.FAILED) {
                return {
                    UAL,
                    assertionId: publicAssertionId,
                    operation: getOperationStatusObject(operationResult, operationId),
                };
            }
        }

        operationId = await this.nodeApiService.publish(
            publicAssertionId,
            publicAssertion,
            UAL,
            options,
        );

        operationResult = await this.nodeApiService.getOperationResult(operationId, {
            ...options,
            operation: OPERATIONS.PUBLISH,
        });

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

    async get(UAL, opts = {}) {
        const options = JSON.parse(JSON.stringify(opts));
        this.validationService.validateGetRequest(UAL, options);
        const { tokenId } = resolveUAL(UAL);

        const assertionId = await this.blockchainService.getLatestAssertionId(tokenId, options);

        const operationId = await this.nodeApiService.get(UAL, options);
        let operationResult = await this.nodeApiService.getOperationResult(operationId, {
            ...options,
            operation: OPERATIONS.GET,
        });
        let { assertion } = operationResult.data;
        if (assertion) {
            try {
                if (options.validate === true) {
                    if (calculateRoot(assertion) !== assertionId)
                        throw Error("Calculated root hashes don't match!");
                }
                if (options.outputFormat !== GET_OUTPUT_FORMATS.N_QUADS) {
                    assertion = await jsonld.fromRDF(assertion.join('\n'), {
                        algorithm: 'URDNA2015',
                        format: 'application/n-quads',
                    });
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
    const tokenAmount =
      options.tokenAmount ??
      (await this.nodeApiService.getBidSuggestion(
        options.blockchain.name,
        options.epochsNum,
        assertionMetadata.getAssertionSizeInBytes(assertion),
        options.hashFunctionId ?? DEFAULT_HASH_FUNCTION_ID,
        options
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
      options
    );
    let operationId = await this.nodeApiService.publish(
      assertionId,
      assertion,
      UAL,
      options
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

    async transfer(UAL, to, opts = {}) {
        const options = JSON.parse(JSON.stringify(opts));
        this.validationService.validateAssetTransferRequest(UAL, to, options);
        const { tokenId } = resolveUAL(UAL);
        await this.blockchainService.transferAsset(tokenId, to, options);
        const owner = await this.blockchainService.getAssetOwner(tokenId, options);
        return {
            UAL,
            owner,
            operation: getOperationStatusObject({ status: 'COMPLETED' }, null),
        };
    }

    async getOwner(UAL, opts = {}) {
        const options = JSON.parse(JSON.stringify(opts));
        this.validationService.validateGetOwnerRequest(UAL);
        const { tokenId } = resolveUAL(UAL);
        const owner = await this.blockchainService.getAssetOwner(tokenId, options);
        return {
            UAL,
            owner,
            operation: getOperationStatusObject({ data: {}, status: 'COMPLETED' }, null),
        };
    }
}
module.exports = AssetOperationsManager;
