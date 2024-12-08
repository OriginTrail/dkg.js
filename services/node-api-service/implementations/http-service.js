import axios from 'axios';
import { OPERATION_STATUSES } from '../../../constants.js';
import { sleepForMilliseconds } from '../../utilities.js';

export default class HttpService {
    constructor(config = {}) {
        this.config = config;

        if (
            !(
                config.nodeApiVersion === '/' ||
                config.nodeApiVersion === '/latest' ||
                /^\/v\d+$/.test(config.nodeApiVersion)
            )
        ) {
            throw Error(`Version must be '/latest', '/' or in '/v{digits}' format.`);
        }

        this.apiVersion = config.nodeApiVersion ?? '/v1';
    }

    async info(endpoint, port, authToken) {
        try {
            const response = await axios({
                method: 'get',
                url: `${this.getBaseUrl(endpoint, port)}/info`,
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
        bidSuggestionRange,
    ) {
        try {
            const params = {
                blockchain,
                epochsNumber,
                assertionSize,
                contentAssetStorageAddress,
                firstAssertionId,
                hashFunctionId,
            };
            if (bidSuggestionRange != null) {
                params.bidSuggestionRange = bidSuggestionRange;
            }
            const response = await axios({
                method: 'get',
                url: `${this.getBaseUrl(endpoint, port)}/bid-suggestion`,
                params,
                headers: this.prepareRequestConfig(authToken),
            });

            return response.data.bidSuggestion;
        } catch (error) {
            throw Error(`Unable to get bid suggestion: ${error.message}`);
        }
    }

    async localStore(endpoint, port, authToken, assertions, fullPathToCachedAssertion) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/local-store`,
                data: fullPathToCachedAssertion
                    ? { filePath: fullPathToCachedAssertion }
                    : assertions,
                headers: this.prepareRequestConfig(authToken),
            });

            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to store locally: ${error.message}`);
        }
    }

    async publish(endpoint, port, authToken, datasetRoot, dataset, blockchain, hashFunctionId) {
        try {
            console.log({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/publish`,
                data: {
                    datasetRoot,
                    dataset,
                    blockchain,
                    hashFunctionId,
                },
                headers: this.prepareRequestConfig(authToken),
            });
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/publish`,
                data: {
                    datasetRoot,
                    dataset,
                    blockchain,
                    hashFunctionId,
                },
                headers: this.prepareRequestConfig(authToken),
            });

            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to publish: ${error.message}`);
        }
    }

    async publishParanet(
        endpoint,
        port,
        authToken,
        assertions,
        blockchain,
        contract,
        tokenId,
        hashFunctionId,
        paranetUAL,
        sender,
        txHash,
    ) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/publish-paranet`,
                data: {
                    assertions,
                    blockchain,
                    contract,
                    tokenId,
                    hashFunctionId,
                    paranetUAL,
                    sender,
                    txHash,
                },
                headers: this.prepareRequestConfig(authToken),
            });

            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to publish: ${error.message}`);
        }
    }

    async get(
        endpoint,
        port,
        authToken,
        UAL,
        state,
        includeMetadata,
        contentType,
        hashFunctionId,
        paranetUAL,
    ) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/get`,
                data: {
                    id: state ? `${UAL}:${state}` : UAL,
                    contentType,
                    includeMetadata,
                    hashFunctionId,
                    paranetUAL,
                },
                headers: this.prepareRequestConfig(authToken),
            });

            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to get assertion: ${error.message}`);
        }
    }

    async update(
        endpoint,
        port,
        authToken,
        assertionId,
        assertion,
        blockchain,
        contract,
        tokenId,
        hashFunctionId,
    ) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/update`,
                data: {
                    assertionId,
                    assertion,
                    blockchain,
                    contract,
                    tokenId,
                    hashFunctionId,
                },
                headers: this.prepareRequestConfig(authToken),
            });

            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to update: ${error.message}`);
        }
    }

    async query(endpoint, port, authToken, query, type, /*graphState, graphLocation,*/ paranetUAL) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/query`,
                data: { query, type, /*graphState, graphLocation,*/ paranetUAL },
                headers: this.prepareRequestConfig(authToken),
            });
            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to query: ${error.message}`);
        }
    }

    async finality(endpoint, port, authToken, blockchain, ual, minimumNumberOfNodeReplications) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/finality`,
                data: { ual, blockchain, minimumNumberOfNodeReplications },
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
            url: `${this.getBaseUrl(endpoint, port)}/${operation}/${operationId}`,
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
            try {
                // eslint-disable-next-line no-await-in-loop
                response = await axios(axios_config);
            } catch (e) {
                response = { data: { status: 'NETWORK ERROR' } };
            }
        } while (
            response.data.status !== OPERATION_STATUSES.COMPLETED &&
            response.data.status !== OPERATION_STATUSES.FAILED
        );
        return response.data;
    }

    prepareRequestConfig(authToken) {
        if (authToken) {
            return { Authorization: `Bearer ${authToken}` };
        }

        return {};
    }

    getBaseUrl(endpoint, port) {
        return `${endpoint}:${port}${this.apiVersion}`;
    }
}
