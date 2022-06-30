const { MAX_FILE_SIZE, PUBLISH_METHOD } = require("../../constants");
const publishAllowedVisibilityParams = ["public", "private"];
const resolveAllowedOutputFormats = ["json-ld", "n-quads"];

class RequestValidationService {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  validateContent(content) {
    // TODO checks if it is json
    if (!content) throw Error("No content provided");
    if (typeof content !== "object" || Array.isArray(content))
      throw Error("Provided content is not a JSON object");
    if (Buffer.byteLength(JSON.stringify(content), "utf-8") > MAX_FILE_SIZE)
      throw Error(`File size limit is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
  }

  validateKeywords(keywords) {
    if (!keywords) throw Error("No keywords provided");
    if (!Array.isArray(keywords)) throw Error("Keywords must be an array");
    if (keywords.length <= 0) throw Error("Keywords array must be non empty");
    if (keywords.length > 10)
      throw Error("Too many keywords provided, limit is 10.");
    if (!keywords.every((i) => typeof i === "string" && i !== ""))
      throw Error("all keywords must be non empty strings");
  }

  validateVisibility(visibility) {
    if (!publishAllowedVisibilityParams.includes(visibility))
      throw Error(
        `Please set visibility to one of these values : ${publishAllowedVisibilityParams}`
      );
  }

  validatePublicKey(publicKey) {
    if (nodeSupported() && !publicKey) {
      throw Error(`No publicKey key provided`);
    }
  }

  validatePrivateKey(privateKey) {
    if (nodeSupported() && !privateKey) {
      throw Error(`No private key provided`);
    }
  }

  validatePublishRequest(content, options, walletInformation) {
    this.validateVisibility(options.visibility);
    this.validateKeywords(options.keywords);
    this.validateContent(content);
    this.validatePublicKey(walletInformation.publicKey);
    this.validatePrivateKey(walletInformation.privateKey);

    // TODO update with assetUpdate method
    // TODO validate UAL format
    if (options.method === PUBLISH_METHOD.UPDATE && !options.ual)
      throw Error("No ual provided");
  }

  // RESOLVE

  validateResolveId(id) {
    if (!id) throw Error("No id provided");
  }

  validateOutputFormat(OutputFormat) {
    if (
      OutputFormat &&
      !resolveAllowedOutputFormats.includes(OutputFormat.toLowerCase())
    )
      throw Error(
        `Please set OutputFormat to one of these values : ${resolveAllowedOutputFormats}`
      );
  }

  validateResponseValidation(responseValidation) {
    if (
      responseValidation &&
      !(
        typeof responseValidation === "boolean" ||
        ["true", "false"].includes(responseValidation)
      )
    )
      throw Error(
        `Please set responseValidation to one of these values : ${[
          "true",
          "false",
        ]}`
      );
  }

  validateResolveRequest(id, options) {
    this.validateResolveId(id);
    this.validateOutputFormat(options.OutputFormat);
    this.validateResponseValidation(options.responseValidation);
  }
}

function nodeSupported() {
  return typeof window === "undefined";
}

module.exports = RequestValidationService;
