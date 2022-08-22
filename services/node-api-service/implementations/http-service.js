const axios = require("axios");
const Utilities = require("../../utilities.js");
const { OPERATION_STATUSES, PUBLISH_TYPES } = require("../../../constants.js");
const utilities = require("../../utilities.js");

class HttpService {
  maxNumberOfRetries = 5;
  frequency = 5;

  constructor(config) {
    this.config = config;
  }

  info() {
    return axios({
      method: "get",
      url: `${this.config.endpoint}:${this.config.port}/info`,
    }).catch((e) => {
        throw Error(`Unable to get node info: ${e.message}`);
      });
  }

  publish(publishType, assertionId, assertion, UAL, options) {
    let requestBody = this.preparePublishRequest(
      publishType,
      assertionId,
      assertion,
      UAL
    );
    const endpoint = options.endpoint ?? this.config.endpoint;
    return axios({
      method: "post",
      url: `${endpoint}:${this.config.port}/publish`,
      data: requestBody,
    })
      .then((response) => {
        return response.data.operationId;
      })
      .catch((e) => {
        throw Error(`Unable to publish: ${e.message}`);
      });
  }

  get(assertionId, options) {
    let requestBody = this.prepareGetAssertionRequest(assertionId);
    const endpoint = options.endpoint ?? this.config.endpoint;
    return axios({
      method: "post",
      url: `${endpoint}:${this.config.port}/get`,
      data: requestBody,
    })
      .then((response) => {
        return response.data.operationId;
      })
      .catch((e) => {
        throw Error(`Unable to get assertion: ${e.message}`);
      });
  }

  async getOperationResult(operationId, options) {
    await Utilities.sleepForMilliseconds(500);
    if (!operationId) {
      throw Error(
        "Operation ID is missing, unable to fetch the operation results."
      );
    }
    let response = {
      status: OPERATION_STATUSES.pending,
    };
    let retries = 0;
    let maxNumberOfRetries = options.maxNumberOfRetries
      ? options.maxNumberOfRetries
      : this.maxNumberOfRetries;
    let frequency = options.frequency ? options.frequency : this.frequency;

    const endpoint = options.endpoint ?? this.config.endpoint;
    let axios_config = {
      method: "get",
      url: `${endpoint}:${this.config.port}/${options.operation}/${operationId}`,
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
    } while (
      response.data.status !== OPERATION_STATUSES.completed &&
      response.data.status !== OPERATION_STATUSES.failed
    );
    return response.data;
  }

  preparePublishRequest(publishType, assertionId, assertion, UAL) {
    let publishRequest = {
      publishType,
      assertionId,
      assertion,
    };
    switch (publishType) {
      case PUBLISH_TYPES.ASSET:
        const { blockchain, contract, UAI } = utilities.resolveUAL(UAL);
        publishRequest = {
          ...publishRequest,
          blockchain,
          contract,
          tokenId: parseInt(UAI),
        };
        break;
      default:
        throw Error("Publish type not yet implemented");
    }
    return publishRequest;
  }

  prepareGetAssertionRequest(assertionId) {
    return {
      id: assertionId,
    };
  }
}
module.exports = HttpService;
