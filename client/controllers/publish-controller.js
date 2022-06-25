const { PUBLISH_METHOD } = require("../../constants");

class PublishController {
  constructor(config, logger) {
    this.logger = logger;
    this.blockchainService = config.blockchainService;
    this.validationService = config.validationService;
    this.requestValidationService = config.requestValidationService;
    this.dataService = config.dataService;
  }

  async generatePublishRequest(options) {
    this.requestValidationService.validatePublishRequest(options);

    const content = options.content;
    // const content = await this.dataService.compact(options.content);
    if (!content.id) {
      content.id = "https://origintrail.io/default-data-id";
    }

    const request = { metadata: {}, data: [] };
    request.data = await this.dataService.toNQuads(content);

    request.metadata = {
      '@context': 'https://schema.org/',
      type: content.type ?? "Thing",
      issuer: options.publicKey ?? (await this.blockchainService.getAccount()),
      visibility: options.visibility,
      keywords: options.keywords,
      dataRootId: content.id,
    };

    request.metadata.keywords.sort();
    let nquadsArray = await this.dataService.toNQuads(request.metadata);
    nquadsArray = nquadsArray.concat(request.data)

    console.log(nquadsArray.sort());
    const assertionId = this.validationService.calculateRootHash(nquadsArray);

    const signature = await this.blockchainService.sign(
      assertionId,
      options.privateKey
    );

    const uai = await this.submitProofs(
        options.method,
        assertionId,
        1000,
        nquadsArray.length,
        200,
        {
          publicKey: options.publicKey,
          privateKey: options.privateKey,
        }
    );

    this.logger.info(`Assertion ID: ${assertionId}`);
    this.logger.info(`Assertion signature: ${signature}`);
    this.logger.info(
      `Assertion length in N-QUADS format: ${request.data.length}`
    );
    this.logger.info(`Keywords: ${request.metadata.keywords}`);
    request.ual = `dkg://did.ganache.${this.blockchainService.config.hubContractAddress}/${uai}`

    if (request.ual) {
      this.logger.info(`UAL: ${request.ual}`);
    }

    return request;
  }

  async submitProofs(method, assertionId, amount, length, holdingTimeInSeconds, options) {
    if (!this.blockchainService.isInitialized()) {
      await this.blockchainService.initializeContracts();
    }

    // TODO: implement other methods
    let result = await this.blockchainService.createAsset(
      assertionId, amount, length, holdingTimeInSeconds,
      options
    );

    return result.UAI;
  }
}

module.exports = PublishController;
