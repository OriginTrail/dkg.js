const MAX_FILE_SIZE = 2621440;
const publishAllowedVisibilityParams = ["public", "private"];

class RequestValidationService {
  async initialize(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  validateContent(content) {
    if (!content) throw Error("No content provided");
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

  async validatePublishRequest(options) {
    this.validateVisibility(options.visibility);
    this.validateKeywords(options.keywords);
    this.validateContent(options.content);

    if (options.method === "update" && !options.ual)
      throw Error("No ual provided");
  }
}

module.exports = RequestValidationService;
