class ResolveController {
  constructor(config, logger) {
    this.logger = logger;
    this.validationService = config.validationService;
    this.requestValidationService = config.requestValidationService;
    this.dataService = config.dataService;
    this.blockchainService = config.blockchainService;
  }

  async generateResolveRequest(id, options) {
    this.requestValidationService.validateResolveRequest(id, options);

    const request = { id };

    return request;
  }

  async handleResolveResult(response, options) {
    const result = { status: response.status };
    if (options.validateOutput) {
      result.valid = false;
      const nquadsArray = response.data.metadata.concat(response.data.data);
      const calculatedAssertionId =
        this.validationService.calculateRootHash(nquadsArray);

      const issuer = await this.getAssertionIssuer(calculatedAssertionId);

      if (issuer) {
        let metadataJson = await this.dataService.fromNQuads(
          response.data.metadata
        );
        metadataJson = await this.dataService.compact(metadataJson);
        if (metadataJson.issuer !== issuer) {
          this.logger.info("Issuer mismatch. Resolved data can't be trusted.");
        } else {
          result.valid = true;
        }
      } else {
        this.logger.info("Root hash mismatch. Resolved data can't be trusted.");
      }
    }
    result.data = response.data.data;
    if (
      !options.outputFormat ||
      options.outputFormat.toLowerCase() === "json-ld"
    ) {
      result.data = await this.dataService.fromNQuads(response.data.data);
      result.data = await this.dataService.compact(data);
      result.data = await this.dataService.frame(data);
    }

    return result;
  }

  async getAssertionIssuer(assertionId) {
    if (!this.blockchainService.isInitialized()) {
      await this.blockchainService.initializeContracts();
    }

    return this.blockchainService.getAssertionIssuer(assertionId);
  }
}

module.exports = ResolveController;
