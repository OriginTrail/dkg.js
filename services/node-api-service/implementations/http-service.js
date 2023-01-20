const axios = require('axios');
const {
    OPERATION_STATUSES,
    DEFAULT_GET_OPERATION_RESULT_FREQUENCY,
    DEFAULT_GET_OPERATION_RESULT_MAX_NUM_RETRIES,
} = require('../../../constants.js');
const { sleepForMilliseconds, resolveUAL } = require('../../utilities.js');

class HttpService {
    constructor(config) {
        this.config = config;
    }

    info() {
        try {
            return axios({
                method: 'get',
                url: `${this.config.endpoint}:${this.config.port}/info`,
                headers: this.prepareRequestConfig(),
            });
        } catch (error) {
            throw Error(`Unable to get node info: ${error.message}`);
        }
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
        } catch (error) {
            throw Error(`Unable to get bid suggestion: ${error.message}`);
        }
    }

    localStore(assertions, options) {
        const endpoint = options.endpoint ?? this.config.endpoint;

        try {
            const response = axios({
                method: 'post',
                url: `${endpoint}:${this.config.port}/local-store`,
                data: assertions,
                headers: this.prepareRequestConfig(),
            });

            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to store locally: ${error.message}`);
        }
    }

    async publish(assertionId, assertion, UAL, options) {
        const requestBody = this.preparePublishRequest(
            assertionId,
            assertion,
            UAL,
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
        } catch (error) {
            throw Error(`Unable to publish: ${error.message}`);
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
        } catch (error) {
            throw Error(`Unable to get assertion: ${error.message}`);
        }
    }

    async query(data, options) {
        const endpoint = options.endpoint ?? this.config.endpoint;

        return axios({
            method: 'post',
            url: `${endpoint}:${this.config.port}/query`,
            data: { query: data.query, type: data.type },
            headers: this.prepareRequestConfig(),
        })
            .then((response) => response.data.operationId)
            .catch((e) => {
                throw Error(`Unable to query: ${e.message}`);
            });
    }

    async getOperationResult(operationId, options) {
        await sleepForMilliseconds(500);
        if (!operationId) {
            throw Error('Operation ID is missing, unable to fetch the operation results.');
        }
        let response = {
            status: OPERATION_STATUSES.PENDING,
        };
        let retries = 0;
        const maxNumberOfRetries =
            options.maxNumberOfRetries ?? DEFAULT_GET_OPERATION_RESULT_MAX_NUM_RETRIES;
        const frequency = options.frequency ?? DEFAULT_GET_OPERATION_RESULT_FREQUENCY;

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
            await sleepForMilliseconds(frequency * 1000);
            // eslint-disable-next-line no-await-in-loop
            response = await axios(axios_config);
        } while (
            response.data.status !== OPERATION_STATUSES.COMPLETED &&
            response.data.status !== OPERATION_STATUSES.FAILED
        );
        return response.data;
    }

    preparePublishRequest(assertionId, assertion, UAL, hashFunctionId = 1) {
        const { blockchain, contract, tokenId } = resolveUAL(UAL);
        return {
            assertionId,
            assertion,
            blockchain,
            contract,
            tokenId: parseInt(tokenId, 10),
            hashFunctionId,
        };
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
