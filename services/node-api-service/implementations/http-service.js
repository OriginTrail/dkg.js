const axios = require('axios');
const { OPERATION_STATUSES } = require('../../../constants.js');
const { sleepForMilliseconds, resolveUAL } = require('../../utilities.js');

class HttpService {
    constructor(config = {}) {
        this.config = config;
    }

    async info(endpoint, port, authToken) {
        try {
            const response = await axios({
                method: 'get',
                url: `${endpoint}:${port}/info`,
                headers: this.prepareRequestConfig(authToken),
            });

            return response;
        } catch (error) {
            throw Error(`Unable to get node info: ${error.message}`);
        }
    }

    async getBidSuggestion(
        endpoint,
        port,
        authToken,
        blockchain,
        epochsNumber,
        assertionSize,
        contentAssetStorageAddress,
        firstAssertionId,
        hashFunctionId,
    ) {
        try {
            const response = await axios({
                method: 'get',
                url: `${endpoint}:${port}/bid-suggestion`,
                params: {
                    blockchain,
                    epochsNumber,
                    assertionSize,
                    contentAssetStorageAddress,
                    firstAssertionId,
                    hashFunctionId,
                },
                headers: this.prepareRequestConfig(authToken),
            });

            return response.data.bidSuggestion;
        } catch (error) {
            throw Error(`Unable to get bid suggestion: ${error.message}`);
        }
    }

    async localStore(endpoint, port, authToken, assertions) {
        try {
            const response = await axios({
                method: 'post',
                url: `${endpoint}:${port}/local-store`,
                data: assertions,
                headers: this.prepareRequestConfig(authToken),
            });

            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to store locally: ${error.message}`);
        }
    }

    async publish(endpoint, port, authToken, assertionId, assertion, UAL, hashFunctionId) {
        try {
            const response = await axios({
                method: 'post',
                url: `${endpoint}:${port}/publish`,
                data: this.preparePublishRequest(assertionId, assertion, UAL, hashFunctionId),
                headers: this.prepareRequestConfig(authToken),
            });

            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to publish: ${error.message}`);
        }
    }

    async get(endpoint, port, authToken, UAL, hashFunctionId) {
        try {
            const response = await axios({
                method: 'post',
                url: `${endpoint}:${port}/get`,
                data: {
                    id: UAL,
                    hashFunctionId,
                },
                headers: this.prepareRequestConfig(authToken),
            });

            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to get assertion: ${error.message}`);
        }
    }

    async query(endpoint, port, authToken, query, type) {
        try {
            const response = await axios({
                method: 'post',
                url: `${endpoint}:${port}/query`,
                data: { query, type },
                headers: this.prepareRequestConfig(authToken),
            });
            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to query: ${error.message}`);
        }
    }

    async getOperationResult(
        endpoint,
        port,
        authToken,
        operation,
        maxNumberOfRetries,
        frequency,
        operationId,
    ) {
        await sleepForMilliseconds(500);
        let response = {
            status: OPERATION_STATUSES.PENDING,
        };
        let retries = 0;

        const axios_config = {
            method: 'get',
            url: `${endpoint}:${port}/${operation}/${operationId}`,
            headers: this.prepareRequestConfig(authToken),
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

    preparePublishRequest(assertionId, assertion, UAL, hashFunctionId) {
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

    prepareRequestConfig(authToken) {
        if (authToken) {
            return { Authorization: `Bearer ${authToken}` };
        }

        return {};
    }
}
module.exports = HttpService;
