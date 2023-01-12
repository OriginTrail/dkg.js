const axios = require("axios");
const Utilities = require("../../utilities.js");
const { OPERATION_STATUSES, OPERATIONS } = require("../../../constants.js");
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
    options
  ) {
    const endpoint = options.endpoint ?? this.config.endpoint;

    return axios({
      method: "get",
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
    })
      .then((response) => {
        return response.data.bidSuggestion;
      })
      .catch((e) => {
        throw Error(`Unable to get bid suggestion: ${e.message}`);
      });
  }

  localStore(assertions, options) {
    const endpoint = options.endpoint ?? this.config.endpoint;
    return axios({
      method: "post",
      url: `${endpoint}:${this.config.port}/local-store`,
      data: assertions,
      headers: this.prepareRequestConfig(),
    })
      .then((response) => {
        return response.data.operationId;
      })
      .catch((e) => {
        throw Error(`Unable to store locally: ${e.message}`);
      });
  }

  publish(assertionId, assertion, UAL, options) {
    let requestBody = this.preparePublishRequest(
      assertionId,
      assertion,
      UAL,
      options.hashFunctionId
    );
    const endpoint = options.endpoint ?? this.config.endpoint;
    return axios({
      method: "post",
      url: `${endpoint}:${this.config.port}/publish`,
      data: requestBody,
      headers: this.prepareRequestConfig(),
    })
      .then((response) => {
        return response.data.operationId;
      })
      .catch((e) => {
        throw Error(`Unable to publish: ${e.message}`);
      });
  }

  get(UAL, options) {
    let requestBody = this.prepareGetAssertionRequest(UAL, 1);
    const endpoint = options.endpoint ?? this.config.endpoint;
    return axios({
      method: "post",
      url: `${endpoint}:${this.config.port}/get`,
      data: requestBody,
      headers: this.prepareRequestConfig(),
    })
      .then((response) => {
        return response.data.operationId;
      })
      .catch((e) => {
        throw Error(`Unable to get assertion: ${e.message}`);
      });
  }

  async query(data, options) {
    const endpoint = options.endpoint ?? this.config.endpoint;

    return axios({
      method: "post",
      url: `${endpoint}:${this.config.port}/query`,
      data: { query: data.query, type: data.type },
      headers: this.prepareRequestConfig(),
    })
      .then((response) => {
        return response.data.operationId;
      })
      .catch((e) => {
        throw Error(`Unable to query: ${e.message}`);
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
      status: OPERATION_STATUSES.PENDING,
    };
    let retries = 0;
    let maxNumberOfRetries =
      options.maxNumberOfRetries ?? this.maxNumberOfRetries;
    let frequency = options.frequency ?? this.frequency;

    const endpoint = options.endpoint ?? this.config.endpoint;
    let axios_config = {
      method: "get",
      url: `${endpoint}:${this.config.port}/${options.operation}/${operationId}`,
      headers: this.prepareRequestConfig(),
    };
    do {
      if (retries > maxNumberOfRetries) {
        response.data = {
          ...response.data,
          data: {
            errorType: "DKG_CLIENT_ERROR",
            errorMessage:
              "Unable to get results. Max number of retries reached.",
          },
        };
        break;
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
      response.data.status !== OPERATION_STATUSES.COMPLETED &&
      response.data.status !== OPERATION_STATUSES.FAILED
    );
    return response.data;
  }

  preparePublishRequest(assertionId, assertion, UAL, hashFunctionId = 1) {
    const { blockchain, contract, tokenId } = utilities.resolveUAL(UAL);
    const publishRequest = {
      assertionId,
      assertion,
      blockchain,
      contract,
      tokenId: parseInt(tokenId),
      hashFunctionId,
    };
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
