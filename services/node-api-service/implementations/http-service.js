import axios from 'axios';
import { OPERATION_STATUSES } from '../../../constants/constants.js';
import { sleepForMilliseconds } from '../../utilities.js';

export default class HttpService {
    constructor(config = {}) {
        this.config = config;

        if (
            config.nodeApiVersion === '/' ||
            config.nodeApiVersion === '/latest' ||
            /^\/v\d+$/.test(config.nodeApiVersion)
        ) {
            this.apiVersion = config.nodeApiVersion;
        } else {
            this.apiVersion = '/v1';
        }
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

    async publish(
        endpoint,
        port,
        authToken,
        datasetRoot,
        dataset,
        blockchain,
        hashFunctionId,
        minimumNumberOfNodeReplications,
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
                },
                headers: this.prepareRequestConfig(authToken),
            });

            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to get assertion: ${error.message}`);
        }
    }

    // async update(
    //     endpoint,
    //     port,
    //     authToken,
    //     assertionId,
    //     assertion,
    //     blockchain,
    //     contract,
    //     tokenId,
    //     hashFunctionId,
    // ) {
    //     try {
    //         const response = await axios({
    //             method: 'post',
    //             url: `${this.getBaseUrl(endpoint, port)}/update`,
    //             data: {
    //                 assertionId,
    //                 assertion,
    //                 blockchain,
    //                 contract,
    //                 tokenId,
    //                 hashFunctionId,
    //             },
    //             headers: this.prepareRequestConfig(authToken),
    //         });

    //         return response.data.operationId;
    //     } catch (error) {
    //         throw Error(`Unable to update: ${error.message}`);
    //     }
    // }

    async query(endpoint, port, authToken, query, type, paranetUAL, repository) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/direct-query`,
                data: { query, type, repository, paranetUAL },
                headers: this.prepareRequestConfig(authToken),
            });
            return response.data;
        } catch (error) {
            throw Error(`Unable to query: ${error.message}`);
        }
    }

    async finality(
        endpoint,
        port,
        authToken,
        blockchain,
        ual,
        minimumNumberOfFinalizationConfirmations,
    ) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/ask`,
                data: {
                    ual,
                    blockchain,
                    minimumNumberOfNodeReplications: minimumNumberOfFinalizationConfirmations,
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
            !response.data.data?.minAcksReached
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
