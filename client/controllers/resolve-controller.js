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
    if (options.responseValidation) {
      const nquadsArray = response.metadata.concat(response.data);
      const calculatedAssertionId =
        this.validationService.calculateRootHash(nquadsArray);

      const issuer = await this.blockchainService.getAssertionIssuer(
        calculatedAssertionId
      );

      if (issuer) {
        this.logger.debug("Root hash matches");
        const metadataJson = await this.dataService.fromNQuads(
          response.metadata
        );
        if (metadataJson.issuer === issuer) {
          this.logger.info("Issuer matches");
        }
      } else {
        this.logger.error("Root hash mismatch");
      }
    }
    let data = response.data;
    if (!options.resultType || options.resultType.toLowerCase() === "json-ld") {
      data = await this.dataService.fromNQuads(response.data);
      data = await this.dataService.compact(data);
    }

    return { status: response.status, data };
  }
}

module.exports = ResolveController;
