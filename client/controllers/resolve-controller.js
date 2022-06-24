class ResolveController {
  constructor(config, logger) {
    this.logger = logger;
    this.validationService = config.validationService;
    this.requestValidationService = config.requestValidationService;
  }

  async generateResolveRequest(options) {
    this.requestValidationService.validateResolveRequest(options);

    const request = { id: options.id };

    return request;
  }
}

module.exports = ResolveController;
