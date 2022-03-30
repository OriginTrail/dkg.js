const axios = require("axios");
const FormData = require("form-data");

const Logger = require("../utilities/logger");

class AbstractClient {
    defaultMaxNumberOfRetries = 50;
    defaultTimeoutInSeconds = 10;
    defaultNumberOfResults = 20;
    STATUSES = {
        pending: "PENDING",
        completed: "COMPLETED",
        failed: "FAILED",
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
        this.logger = new Logger(loglevel);
        if (!options.endpoint || !options.port) {
            throw Error("Endpoint and port are required parameters");
        }
        this.nodeBaseUrl = `${options.useSSL ? "https://" : "http://"}${
            options.endpoint
        }:${options.port}`;
        this._sendNodeInfoRequest()
            .then()
            .catch((error) => {
                throw new Error(`Endpoint not available: ${error}`);
            });
    }

    /**
     * Get node information (version, is auto upgrade enabled, is telemetry enabled)
     */
    nodeInfo() {
        return new Promise((resolve, reject) => {
            this._sendNodeInfoRequest()
                .then((response) => resolve(response.data))
                .catch((error) => reject(error));
        });
    }

    _sendNodeInfoRequest() {
        this.logger.debug("Sending node info request");
        return axios.get(`${this.nodeBaseUrl}/info`, {
            timeout: this.defaultTimeoutInSeconds * 1000,
        });
    }

    _publishRequest(options) {
        this.logger.debug("Sending publish request.");
        const form = new FormData();
        form.append("data", JSON.stringify(options.content));
        form.append("keywords", JSON.stringify(options.keywords));
        if (options.ual) {
            form.append("ual", options.ual);
        }
        form.append("visibility", options.visibility);
        let axios_config = {
            method: "post",
            url: `${this.nodeBaseUrl}/${options.method}`,
            data: form,
        };

        return axios(axios_config);
    }

    /**
     * @param {object} options
     * @param {string[]} options.ids - assertion ids
     */
    resolve(options) {
        if (!options || !options.ids) {
            throw Error("Please provide resolve options in order to resolve.");
        }
        return new Promise((resolve, reject) => {
            this._resolveRequest(options)
                .then((response) =>
                    this._getResult({
                        handler_id: response.data.handler_id,
                        operation: "resolve",
                    })
                )
                .then((response) => {
                    resolve(response);
                })
                .catch((error) => reject(error));
        });
    }

    _resolveRequest(options) {
        this.logger.debug("Sending resolve request.");
        const form = new FormData();
        let ids = "";

        let firstOne = true;
        for (let id of options.ids) {
            firstOne = false;
            if (firstOne) {
                ids += `ids=${id}`;
            } else {
                ids += `&ids=${id}`;
            }
        }

        let axios_config = {
            method: "get",
            url: `${this.nodeBaseUrl}/resolve?${ids}`,
            data: form,
        };
        return axios(axios_config);
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
    search(options) {
        if (!options || !options.query || !options.resultType) {
            throw Error("Please provide search options in order to search.");
        }
        return new Promise((resolve, reject) => {
            this._searchRequest(options)
                .then((response) =>
                    this._getSearchResult({
                        handler_id: response.data.handler_id,
                        resultType: options.resultType,
                        numberOfResults:  options.numberOfResults,
                        timeout:  options.timeout,
                    })
                )
                .then((response) => {
                    resolve(response);
                })
                .catch((error) => reject(error));
        });
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

    async _getSearchResult(options) {
        if (!options.handler_id) {
            throw Error("Unable to get results, need handler id");
        }
        let searchResponse = {};
        let retries = 0;
        let timeout = options.timeout ? options.timeout : this.defaultTimeoutInSeconds;
        let numberOfResults = options.numberOfResults
            ? options.numberOfResults
            : this.defaultNumberOfResults;

        const form = new FormData();
        let axios_config = {
            method: "get",
            url: `${this.nodeBaseUrl}/${options.resultType}:search/result/${options.handler_id}`,
        };

        let timeoutFlag = false;
        let currentNumberOfResults = numberOfResults;
        setTimeout(() => {
            timeoutFlag = true;
        }, timeout * 1000);

        do {
            await this.sleepForMilliseconds(1 * 1000);
            try {
                searchResponse = await axios(axios_config);
                currentNumberOfResults = searchResponse.data.itemListElement.length;
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
     */
    query(options) {
        if (!options || !options.query) {
            throw Error("Please provide options in order to query.");
        }
        return new Promise((resolve, reject) => {
            this._queryRequest(options)
                .then((response) =>
                    this._getResult({
                        handler_id: response.data.handler_id,
                        operation: "query",
                    })
                )
                .then((response)=>{
                    resolve(response);
                })
                .catch((error) => reject(error));
        });
    }

    _queryRequest(options) {
        this.logger.debug("Sending query request.");
        const form = new FormData();
        let type = options.type ? options.type : "construct";
        let sparqlQuery = options.query;
        form.append("query", sparqlQuery);
        let axios_config = {
            method: "post",
            url: `${this.nodeBaseUrl}/query?type=${type}`,
            data: form,
        };
        return axios(axios_config);
    }

    /**
     * @param {object} options
     * @param {string[]} options.nquads
     * @param {object} options.validationInstructions
     */
    validate(options) {
        if (!options || !options.nquads) {
            throw Error(
                "Please provide assertions and nquads in order to get proofs."
            );
        }
        return new Promise((resolve, reject) => {
            this._getProofsRequest(options)
                .then((response) =>
                    this._getResult({
                        handler_id: response.data.handler_id,
                        operation: "proofs:get",
                    })
                )
                .then(async (response) => {
                    if (response.status === this.STATUSES.completed) {
                        response = await this._performValidation(response.data);
                    } else {
                        throw Error("Unable to get proofs for given nquads");
                    }
                    resolve(response);
                })
                .catch((error) => reject(error));
        });
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
        let response = {
            status: this.STATUSES.pending,
        };
        let retries = 0;
        const form = new FormData();
        let axios_config = {
            method: "get",
            url: `${this.nodeBaseUrl}/${options.operation}/result/${options.handler_id}`,
        };
        do {
            if (retries > this.maxNumberOfRetries) {
                throw Error("Unable to get results. Max number of retries reached.");
            }
            retries++;
            await this.sleepForMilliseconds(1 * 1000);
            try {
                response = await axios(axios_config);
                this.logger.debug(
                    `${options.operation} result status: ${response.data.status}`
                );
            } catch (e) {
                this.logger.error(e);
                throw e;
            }
        } while (response.data.status === this.STATUSES.pending);
        if (response.data.status === this.STATUSES.failed) {
            throw Error(
                `Get ${options.operation} failed. Reason: ${response.data.message}.`
            );
        }
        return response.data;
    }

    async sleepForMilliseconds(milliseconds) {
        await new Promise((r) => setTimeout(r, milliseconds));
    }
}

module.exports = AbstractClient;
