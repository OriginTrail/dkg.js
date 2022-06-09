const AbstractClient = require("./abstract-client");

class NativeClient extends AbstractClient {
  constructor(props) {
    super(props);
  }

  /**
   * @param {object} options
   * @param {string} options.filepath - path to the dataset
   * @param {string[]} options.keywords (optional)
   */
  async publish(options) {
    if (!options || !options.filepath) {
      throw Error("Please provide publish options in order to publish.");
    }
    options.method = "publish";
    try {
      const response = await this._publishRequest(options);
      return this._getResult({
        handler_id: response.data.handler_id,
        operation: options.method,
        ...options,
      });
    } catch (e) {
      throw e;
    }
  }
}

module.exports = NativeClient;
