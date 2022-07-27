import axios from "axios";
import Utilities from '../../utilities.js';
import {OPERATION_STATUSES} from '../../../constants.js';

class HttpService {
    maxNumberOfRetries = 5;
    frequency = 5;

    constructor(config) {
        this.config = config;
    }

    publish(assertionId, assertion, UAL) {
        let requestBody = this.preparePublishRequest(assertionId, assertion, UAL);
        return axios({
            method: "post",
            url: `${this.config.endpoint}:${this.config.port}/publish`,
            data: requestBody,
        }).then(response => {
            return response.data.operation_id;
        }).catch(e => {
            throw Error("Unable to publish.")
        });
    }

    get(assertionId) {
        let requestBody = this.prepareGetAssertionRequest(assertionId);
        return axios({
            method: "post",
            url: `${this.config.endpoint}:${this.config.port}/get`,
            data: requestBody,
        }).then(response => {
            return response.data.operation_id;
        }).catch(e => {
            throw Error("Unable to get assertion.")
        });
    }

    async getOperationResult(operationId, options) {
        await Utilities.sleepForMilliseconds(500);
        if (!operationId) {
            throw Error("Operation ID is missing, unable to fetch the operation results.");
        }
        let response = {
            status: OPERATION_STATUSES.pending,
        };
        let retries = 0;
        let maxNumberOfRetries = options.maxNumberOfRetries
            ? options.maxNumberOfRetries
            : this.maxNumberOfRetries;
        let frequency = options.frequency ? options.frequency : this.frequency;

        let axios_config = {
            method: "get",
            url: `${this.config.endpoint}:${this.config.port}/${options.operation}/${operationId}`,
        };
        do {
            if (retries > maxNumberOfRetries) {
                throw Error("Unable to get results. Max number of retries reached.");
            }
            retries++;
            await Utilities.sleepForMilliseconds(frequency * 1000);
            try {
                response = await axios(axios_config);
                // this.logger.debug(
                //     `${options.operation} result status: ${response.data.status}`
                // );
            } catch (e) {
                // this.logger.error(e);
                throw e;
            }
        } while (response.data.status !== OPERATION_STATUSES.completed && response.data.status !== OPERATION_STATUSES.failed);
        if (response.data.status === OPERATION_STATUSES.failed) {
            throw Error(
                `${Utilities.capitalizeFirstLetter(options.operation)} operation failed. Reason: ${response.data.data.errorMessage}`
            );
        }
        return response.data;
    }

    preparePublishRequest(assertionId, assertion, UAL) {
        let publishRequest = {
            "assertion_id": assertionId,
            "assertion": assertion
        };
        if (UAL) {
            publishRequest.options = {};
            publishRequest.options.ual = UAL;
        }
        return publishRequest;
    }

    prepareGetAssertionRequest(assertionId) {
        return {
            "id": assertionId
        };
    }
}

export {HttpService};
