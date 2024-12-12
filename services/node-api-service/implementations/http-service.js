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

    async publish(
        endpoint,
        port,
        authToken,
        datasetRoot,
        dataset,
        blockchain,
        hashFunctionId,
        minimumNumberOfNodeReplications,
        batchSize,
    ) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/publish`,
                data: {
                    datasetRoot,
                    dataset,
                    blockchain,
                    hashFunctionId,
                    minimumNumberOfNodeReplications,
                    batchSize,
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
        subjectUAL,
        contentType,
        hashFunctionId,
        paranetUAL,
        batchSize,
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
                    subjectUAL,
                    batchSize,
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
        batchSize,
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
                    batchSize,
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

    async ask(
        endpoint,
        port,
        authToken,
        blockchain,
        ual,
        minimumNumberOfFinalizationConfirmations,
        batchSize,
    ) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/ask`,
                data: {
                    ual,
                    blockchain,
                    minimumNumberOfNodeReplications: minimumNumberOfFinalizationConfirmations,
                    batchSize,
                },
                headers: this.prepareRequestConfig(authToken),
            });
            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to query: ${error.message}`);
        }
    }

    async finalityStatus(
        endpoint,
        port,
        authToken,
        ual,
        requiredConfirmations,
        maxNumberOfRetries,
        frequency,
    ) {
        let retries = 0;
        let finality = 0;

        const axios_config = {
            method: 'get',
            url: `${this.getBaseUrl(endpoint, port)}/finality`,
            params: { ual },
            headers: this.prepareRequestConfig(authToken),
        };

        do {
            if (retries > maxNumberOfRetries) {
                throw Error(
                    `Unable to achieve required confirmations. Max number of retries (${maxNumberOfRetries}) reached.`,
                );
            }

            retries += 1;

            // eslint-disable-next-line no-await-in-loop
            await sleepForMilliseconds(frequency * 1000);

            try {
                // eslint-disable-next-line no-await-in-loop
                const response = await axios(axios_config);
                finality = response.data.finality || 0;
            } catch (e) {
                finality = 0;
            }
        } while (finality < requiredConfirmations && retries <= maxNumberOfRetries);

        return finality;
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
            response.data.status !== OPERATION_STATUSES.FAILED &&
            !response.data.minAcksReached
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
