const AbstractClient = require("./abstract-client");
const AssetsProxyPath = require("../utilities/assets-proxy-path");
const { PUBLISH_METHOD } = require("../constants");

class AssetsClient extends AbstractClient {
  constructor(options, walletInformation) {
    super(options);
    this._assetsProxyPath = new AssetsProxyPath(options);
  }

  /**
   * @param content
   * @param {object} options
   * @param {string} options.filepath - path to the dataset
   * @param {string[]} options.keywords (optional)
   */
  async create(content, options = {}, walletInformation) {
    options.content = content;
    options.method = PUBLISH_METHOD.PUBLISH;

    try {
      const response = await this._publishRequest(options, walletInformation);
      return await this._getResult({
        handler_id: response.data.handlerId,
        operation: options.method,
        ...options,
      });
    } catch (e) {
      throw e;
    }
  }

  /**
   * @param {object} content
   * @param {object} options
   * @param {string} options.filepath - path to the dataset
   * @param {string[]} options.keywords (optional)
   */
  async update(content, ual, options = {}) {
    options.content = content;
    options.ual = ual;
    options.method = PUBLISH_METHOD.UPDATE;

    try {
      const response = await this._publishRequest(options);
      return await this._getResult({
        handler_id: response.data.handlerId,
        operation: options.method,
        ...options,
      });
    } catch (e) {
      throw e;
    }
  }

  async get(ual, commitHash) {
    //TODO add cache

    let result;
    if (commitHash) result = await this.resolve({ ids: [commitHash] });
    else result = await this.resolve({ ids: [ual] });
    if (result.status === this.STATUSES.completed) {
      const data = result.data[0].result;

      return this._assetsProxyPath.createPath(
        Object.assign(Object.create(null), undefined, undefined),
        Object.assign(Object.create(null), undefined, data),
        ual
      );
    }

    return undefined;
  }

  async getStateCommitHashes(ual) {
    //TODO add cache

    let result = await this.resolve({ ids: [ual] });
    if (result.status === this.STATUSES.completed) {
      return result.data[0].result.assertions;
    }
    return undefined;
  }

  transfer(options) {
    //TODO
  }

  approve(options) {
    //TODO
  }
}

module.exports = AssetsClient;
