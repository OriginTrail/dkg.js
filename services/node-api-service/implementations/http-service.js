const axios = require('axios');
const Utilities = require('../../utilities.js');
const {
    OPERATION_STATUSES,
    PUBLISH_TYPES,
    DEFAULT_HASH_FUNCTION_ID,
} = require('../../../constants.js');
const utilities = require('../../utilities.js');

class HttpService {
    maxNumberOfRetries = 5;

    frequency = 5;

    constructor(config) {
        this.config = config;
    }

    info() {
        return axios({
            method: 'get',
            url: `${this.config.endpoint}:${this.config.port}/info`,
            headers: this.prepareRequestConfig(),
        }).catch((e) => {
            throw Error(`Unable to get node info: ${e.message}`);
        });
    }

    async getBidSuggestion(
        blockchain,
        epochsNumber,
        assertionSize,
        contentAssetStorageAddress,
        firstAssertionId,
        hashFunctionId,
        options,
    ) {
        const endpoint = options.endpoint ?? this.config.endpoint;

        try {
            const response = await axios({
                method: 'get',
                url: `${endpoint}:${this.config.port}/bid-suggestion`,
                params: {
                    blockchain,
                    epochsNumber,
                    assertionSize,
                    contentAssetStorageAddress,
                    firstAssertionId,
                    hashFunctionId,
                },
                headers: this.prepareRequestConfig(),
            });
            return response.data.bidSuggestion;
        } catch (e) {
            throw Error(`Unable to get bid suggestion: ${e.message}`);
        }
    }

    async publish(publishType, assertionId, assertion, UAL, options) {
        const requestBody = this.preparePublishRequest(
            publishType,
            assertionId,
            assertion,
            UAL,
            options.localStore,
            options.hashFunctionId,
        );
        const endpoint = options.endpoint ?? this.config.endpoint;
        try {
            const response = await axios({
                method: 'post',
                url: `${endpoint}:${this.config.port}/publish`,
                data: requestBody,
                headers: this.prepareRequestConfig(),
            });
            return response.data.operationId;
        } catch (e) {
            throw Error(`Unable to publish: ${e.message}`);
        }
    }

    async get(UAL, options) {
        const requestBody = this.prepareGetAssertionRequest(UAL, 1);
        const endpoint = options.endpoint ?? this.config.endpoint;
        try {
            const response = await axios({
                method: 'post',
                url: `${endpoint}:${this.config.port}/get`,
                data: requestBody,
                headers: this.prepareRequestConfig(),
            });
            return response.data.operationId;
        } catch (e) {
            throw Error(`Unable to get assertion: ${e.message}`);
        }
    }

    async query(data, options) {
        const endpoint = options.endpoint ?? this.config.endpoint;

        try {
            const response = await axios({
                method: 'post',
                url: `${endpoint}:${this.config.port}/query`,
                data: { query: data.query, type: data.type },
                headers: this.prepareRequestConfig(),
            });

            return response.data.operationId;
        } catch (e) {
            throw Error(`Unable to query: ${e.message}`);
        }
    }

    async getOperationResult(operationId, options) {
        await Utilities.sleepForMilliseconds(500);
        if (!operationId) {
            throw Error('Operation ID is missing, unable to fetch the operation results.');
        }
        let response = {
            status: OPERATION_STATUSES.pending,
        };
        let retries = 0;
        const maxNumberOfRetries = options.maxNumberOfRetries ?? this.maxNumberOfRetries;
        const frequency = options.frequency ?? this.frequency;

        const endpoint = options.endpoint ?? this.config.endpoint;
        const axios_config = {
            method: 'get',
            url: `${endpoint}:${this.config.port}/${options.operation}/${operationId}`,
            headers: this.prepareRequestConfig(),
        };
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
            await Utilities.sleepForMilliseconds(frequency * 1000);
            // eslint-disable-next-line no-await-in-loop
            response = await axios(axios_config);
        } while (
            response.data.status !== OPERATION_STATUSES.completed &&
            response.data.status !== OPERATION_STATUSES.failed
        );
        return response.data;
    }

    preparePublishRequest(
        publishType,
        assertionId,
        assertion,
        UAL,
        localStore,
        hashFunctionId = DEFAULT_HASH_FUNCTION_ID,
    ) {
        let publishRequest = {
            publishType,
            assertionId,
            assertion,
        };
        switch (publishType) {
            case PUBLISH_TYPES.ASSET: {
                const { blockchain, contract, tokenId } = utilities.resolveUAL(UAL);
                publishRequest = {
                    ...publishRequest,
                    blockchain,
                    contract,
                    tokenId: parseInt(tokenId, 10),
                    hashFunctionId,
                    localStore,
                };
                break;
            }
            default:
                throw Error('Publish type not yet implemented');
        }
        return publishRequest;
    }

    prepareGetAssertionRequest(UAL, hashFunctionId = 1) {
        return {
            id: UAL,
            hashFunctionId,
        };
    }

    prepareRequestConfig() {
        if (this.config?.auth?.token) {
            return { Authorization: `Bearer ${this.config.auth.token}` };
        }
        return {};
    }
}
module.exports = HttpService;
