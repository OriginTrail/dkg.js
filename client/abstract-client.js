const axios = require("axios");
const FormData = require("form-data");
const NodeFormData = require("form-data/lib/form_data");
const Logger = require("../utilities/logger");
const PublishController = require("./controllers/publish-controller");
const ResolveController = require("./controllers/resolve-controller");
const RequestValidationService = require("./services/request-validation-service");
const NodeBlockchainService = require("./services/node-blockchain-service");
const BrowserBlockchainService = require("./services/browser-blockchain-service");
const ValidationService = require("./services/validation-service");
const DataService = require("./services/data-service");

class AbstractClient {
  defaultMaxNumberOfRetries = 5;
  defaultTimeoutInSeconds = 25;
  defaultNumberOfResults = 2000;
  defaultFrequency = 5;
  defaultBlockchainServiceConfig = {
    blockchainTitle: "Polygon",
    networkId: "polygon::mainnet",
    hubContractAddress: "0xFD6ECaed420aB70fb97eB2423780517dc425ef81",
    rpcEndpoints: [
      "https://matic-mumbai.chainstacklabs.com",
      "https://rpc-mumbai.maticvigil.com/",
      "https://rpc-mumbai.matic.today",
      "https://matic-testnet-archive-rpc.bwarelabs.com",
    ],
  };
  STATUSES = {
    PUBLISH_END: "PUBLISH_END",
    RESOLVE_END: "RESOLVE_END",
    FAILED: "FAILED",
  };
  /**
   * Initialize client
   * @constructor
   * @param {object} options
   * @param {string} options.endpoint
   * @param {number} options.port
   * @param {boolean} options.useSSL
   * @param {string} options.loglevel (optional)
   * @param {number} options.maxNumberOfRetries (optional)
   */
  constructor(options) {
    let loglevel = options.loglevel ? options.loglevel : "error";
    this.maxNumberOfRetries =
      options.maxNumberOfRetries && options.maxNumberOfRetries >= 0
        ? options.maxNumberOfRetries
        : this.defaultMaxNumberOfRetries;
    this.timeoutInSeconds =
      options.timeoutInSeconds && options.timeoutInSeconds >= 0
        ? options.timeoutInSeconds
        : this.defaultTimeoutInSeconds;
    this.numberOfResults =
      options.numberOfResults && options.numberOfResults >= 0
        ? options.numberOfResults
        : this.defaultNumberOfResults;
    this.frequency =
      options.frequency && options.frequency >= 0
        ? options.frequency
        : this.defaultFrequency;
    this.logger = new Logger(loglevel);
    if (!options.endpoint || !options.port) {
      throw Error("Endpoint and port are required parameters");
    }
    this.nodeBaseUrl = `${options.useSSL ? "https://" : "http://"}${
      options.endpoint
    }:${options.port}`;

    this.initializeServices({
      blockchain: options.blockchain ?? this.defaultBlockchainServiceConfig,
      validation: options.validation ?? {},
      requestValidation: options.requestValidation ?? {},
      dataService: options.dataService ?? {},
    });
    this.initializeControllers();
  }

  initializeServices(config) {
    this.blockchainService = this.nodeSupported()
      ? new NodeBlockchainService(config.blockchain, this.logger)
      : new BrowserBlockchainService(config.blockchain, this.logger);
    this.validationService = new ValidationService(
      config.validation,
      this.logger
    );
    this.requestValidationService = new RequestValidationService(
      config.requestValidation,
      this.logger
    );
    this.dataService = new DataService(config.data, this.logger);
  }

  initializeControllers() {
    this.publishController = new PublishController(
      {
        blockchainService: this.blockchainService,
        validationService: this.validationService,
        requestValidationService: this.requestValidationService,
        dataService: this.dataService,
      },
      this.logger
    );

    this.resolveController = new ResolveController(
      {
        validationService: this.validationService,
        requestValidationService: this.requestValidationService,
      },
      this.logger
    );
  }

  /**
   * Get node information (version, is auto upgrade enabled, is telemetry enabled)
   */
  async nodeInfo() {
    try {
      return await this._sendNodeInfoRequest();
    } catch (e) {
      throw e;
    }
  }

  _sendNodeInfoRequest() {
    this.logger.debug("Sending node info request");
    return axios.get(`${this.nodeBaseUrl}/info`, {
      timeout: this.timeoutInSeconds * 1000,
    });
  }

  async _publishRequest(options) {
    const request = await this.publishController.generatePublishRequest(options);

    this.logger.debug("Sending publish request.");

    return axios({
      method: "post",
      url: `${this.nodeBaseUrl}/${options.method}`,
      data: request,
    });
  }

  _getFormHeaders(form) {
    if (typeof form?.getHeaders !== "function") {
      const nfd = new NodeFormData();
      return nfd.getHeaders();
    } else {
      return form?.getHeaders();
    }
  }

  /**
   * @param {object} options
   * @param {string} options.id - assertion id
   */
  async resolve(options) {
    const request = await this.resolveController.generateResolveRequest(options);

    try {
      const response = await this._resolveRequest(request);
      
      return this._getResult({
        ...options,
        handler_id: response.data.handlerId,
        operation: "resolve",
      });
    } catch (e) {
      throw e;
    }
  }

  _resolveRequest(request) {
    this.logger.debug("Sending resolve request.");
    
    return axios({
      method: "get",
      url: `${this.nodeBaseUrl}/resolve`,
      data: request,
    });
  }

  /**
   * @param {object} options
   * @param {string} options.query - search term
   * @param {string} options.resultType - result type: assertions or entities
   * @param {boolean} options.prefix (optional)
   * @param {number} options.limit (optional)
   * @param {string[]} options.issuers (optional)
   * @param {string} options.schemaTypes (optional)
   * @param {number} options.numberOfResults (optional)
   * @param {number} options.timeout (optional)
   */
  async search(options, cb) {
    if (!options || !options.query || !options.resultType) {
      throw Error("Please provide search options in order to search.");
    }
    try {
      const response = await this._searchRequest(options);
      return this._getSearchResult(
        {
          handler_id: response.data.handler_id,
          ...options,
        },
        cb
      );
    } catch (e) {
      throw e;
    }
  }

  _searchRequest(options) {
    this.logger.debug("Sending search request.");
    const form = new FormData();
    let prefix = options.prefix ? options.prefix : true;
    let limit = options.limit ? options.limit : 20;
    let query = options.query;
    let resultType = options.resultType;
    let url = `${this.nodeBaseUrl}/${resultType}:search?query=${query}`;
    if (resultType === "entities") {
      url = `${this.nodeBaseUrl}/${resultType}:search?query=${query}&limit=${limit}&prefix=${prefix}`;
    }
    let axios_config = {
      method: "get",
      url,
      data: form,
    };
    return axios(axios_config);
  }

  async _getSearchResult(options, cb) {
    if (!options.handler_id) {
      throw Error("Unable to get results, need handler id");
    }
    let searchResponse = {};
    let timeoutInSeconds = options.timeoutInSeconds
      ? options.timeoutInSeconds
      : this.timeoutInSeconds;
    let numberOfResults = options.numberOfResults
      ? options.numberOfResults
      : this.numberOfResults;
    let frequency = options.frequency ? options.frequency : this.frequency;

    let axios_config = {
      method: "get",
      url: `${this.nodeBaseUrl}/${options.resultType}:search/result/${options.handler_id}`,
    };

    let timeoutFlag = false;
    let currentNumberOfResults = numberOfResults;
    setTimeout(() => {
      timeoutFlag = true;
    }, timeoutInSeconds * 1000);

    do {
      await this.sleepForMilliseconds(frequency * 1000);
      try {
        searchResponse = await axios(axios_config);
        currentNumberOfResults = searchResponse.data.itemListElement.length;
        cb(searchResponse.data);
      } catch (e) {
        this.logger.error(e);
        throw e;
      }
    } while (!timeoutFlag && numberOfResults > currentNumberOfResults);
    return searchResponse.data;
  }

  /**
   * @param {object} options
   * @param {string} options.query - sparql query
   * @param {string} options.type - query type (default: construct)
   */
  async query(options) {
    if (!options || !options.query) {
      throw Error("Please provide options in order to query.");
    }
    try {
      const response = await this._queryRequest(options);
      return this._getResult({
        handler_id: response.data.handler_id,
        operation: "query",
        ...options,
      });
    } catch (e) {
      throw e;
    }
  }

  _queryRequest(options) {
    this.logger.debug("Sending query request.");
    const form = new FormData();
    let type = options.type ? options.type : "construct";
    let sparqlQuery = options.query;
    form.append("query", sparqlQuery);
    form.append("type", type);
    let axios_config;

    if (this.nodeSupported()) {
      axios_config = {
        method: "post",
        url: `${this.nodeBaseUrl}/query?type=${type}`,
        headers: {
          ...this._getFormHeaders(form),
        },
        data: form,
      };
    } else {
      axios_config = {
        method: "post",
        url: `${this.nodeBaseUrl}/query?type=${type}`,
        data: form,
      };
    }

    return axios(axios_config);
  }

  /**
   * @param {object} options
   * @param {string[]} options.nquads
   * @param {object} options.validationInstructions
   */
  async validate(options) {
    if (!options || !options.nquads) {
      throw Error(
        "Please provide assertions and nquads in order to get proofs."
      );
    }
    try {
      const response = await this._getProofsRequest(options);
      let result = this._getResult({
        handler_id: response.data.handler_id,
        operation: "proofs:get",
        ...options,
      });
      if (result.status !== this.STATUSES.completed) {
        throw Error("Unable to get proofs for given nquads");
      }
      return this._performValidation(result.data);
    } catch (e) {
      throw e;
    }
  }

  _getProofsRequest(options) {
    this.logger.debug("Sending get proofs request.");
    const form = new FormData();
    let nquads = options.nquads;
    form.append("nquads", JSON.stringify(nquads));
    let axios_config = {
      method: "post",
      url: `${this.nodeBaseUrl}/proofs:get`,
      data: form,
      headers: {
        ...this._getFormHeaders(form),
      },
    };
    return axios(axios_config);
  }

  async _performValidation(assertions) {
    let validationResult = [];
    for (let assertion of assertions) {
      let rootHash = await this._fetchRootHash(assertion.assertionId);
      for (let obj of assertion.proofs) {
        let validatedTriple = { triple: obj.triple, valid: false };
        if (obj.proof === null) {
          this.logger.debug(
            `${obj.triple} has no proof in assertion ${assertion.assertionId}`
          );
          continue;
        }
        let verified = this._validateProof(obj, rootHash);
        validatedTriple.valid = verified;
        validationResult.push(validatedTriple);
        if (verified) {
          this.logger.debug(
            `Validation successful for data: ${JSON.stringify(obj)}`
          );
        } else {
          this.logger.debug(`Invalid data: ${JSON.stringify(obj)}`);
        }
      }
    }
    return validationResult;
  }

  async _fetchRootHash(assertionId) {
    let result = await this.resolve({ ids: [assertionId] });
    return result.data[0][assertionId].rootHash;
  }

  _validateProof(obj, rootHash) {
    // const tree = new MerkleTools();
    // const leaf = obj.tripleHash;
    // const verified = tree.validateProof(obj.proof, leaf, rootHash);
    // return verified;
  }

  async _getResult(options) {
    await this.sleepForMilliseconds(500);
    if (!options.handler_id || !options.operation) {
      throw Error("Unable to get results, need handler id and operation");
    }
    let response;
    let retries = 0;
    let maxNumberOfRetries = options.maxNumberOfRetries
      ? options.maxNumberOfRetries
      : this.maxNumberOfRetries;
    let frequency = options.frequency ? options.frequency : this.frequency;

    let axios_config = {
      method: "get",
      url: `${this.nodeBaseUrl}/${options.operation}/result/${options.handler_id}`,
    };
    do {
      if (retries > maxNumberOfRetries) {
        throw Error("Unable to get results. Max number of retries reached.");
      }
      retries++;
      await this.sleepForMilliseconds(frequency * 1000);
      try {
        response = await axios(axios_config);
        this.logger.debug(
          `${options.operation} result status: ${response.data.status}`
        );
      } catch (e) {
        this.logger.error(e);
        throw e;
      }
    } while (response.data.status !== this.STATUSES.PUBLISH_END && response.data.status !== this.STATUSES.FAILED && response.data.status !== this.STATUSES.RESOLVE_END);
    if (response.data.status === this.STATUSES.FAILED) {
      throw Error(
        `Get ${options.operation} failed. Reason: ${response.data.message}.`
      );
    }
    return response.data;
  }

  async sleepForMilliseconds(milliseconds) {
    await new Promise((r) => setTimeout(r, milliseconds));
  }

  nodeSupported() {
    return typeof window === "undefined";
  }
}

module.exports = AbstractClient;
