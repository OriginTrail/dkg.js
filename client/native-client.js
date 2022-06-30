const AbstractClient = require("./abstract-client");
const { PUBLISH_METHOD } = require("../constants");

class NativeClient extends AbstractClient {
  constructor(props) {
    super(props);
  }

  /**
   * @param {object} content
   * @param {object} walletInformation
   * @param {string} walletInformation.publicKey
   * @param {string} walletInformation.privateKey
   * @param {object} options
   * @param {string} options.visibility
   * @param {string[]} options.keywords
   */
  async publish(content, walletInformation = {}, options = {}) {
    options.method = PUBLISH_METHOD.PUBLISH;

    try {
      const response = await this._publishRequest(
        content,
        walletInformation,
        options
      );
      const result = await this._getResult({
        ...options,
        handler_id: response.data.handlerId,
        operation: options.method,
      });
      return result;
    } catch (e) {
      throw e;
    }
  }
}

module.exports = NativeClient;
