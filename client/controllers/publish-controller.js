const { PUBLISH_METHOD } = require("../../constants");

class PublishController {
  constructor(config, logger) {
    this.logger = logger;
    this.blockchainService = config.blockchainService;
    this.validationService = config.validationService;
    this.requestValidationService = config.requestValidationService;
    this.ualService = config.ualService;
    this.dataService = config.dataService;
  }

  async generatePublishRequest(options, walletInformation) {
    this.requestValidationService.validatePublishRequest(options, walletInformation);
    const balanceOf = await this.balanceOf(walletInformation.publicKey);
    if (balanceOf < options.tokenAmount) {
      throw Error('Insufficient funds');
    }

    const content = await this.dataService.compact(options.content);

    const request = { metadata: {}, data: [] };
    request.data = await this.dataService.canonize(content);

    request.metadata = {
      '@context': 'https://schema.org/',
      type: content.type ?? "Thing",
      issuer: walletInformation.publicKey ?? (await this.blockchainService.getAccount()),
      visibility: options.visibility,
      keywords: options.keywords,
    };

    request.metadata.keywords.sort();
    let nquadsArray = await this.dataService.canonize(request.metadata);
    nquadsArray = nquadsArray.concat(request.data)

    const assertionId = this.validationService.calculateRootHash(nquadsArray);

    let signature = await this.blockchainService.sign(
      assertionId,
      walletInformation.privateKey
    );

    signature = this.validationService.calculateHash(signature);

    const uai = await this.submitTransaction(
        options.method,
        assertionId,
        options.tokenAmount,
        nquadsArray.length,
        options.holdingTimeInSeconds,
        signature,
        {
          publicKey: walletInformation.publicKey,
          privateKey: walletInformation.privateKey,
        }
    );

    request.ual = this.ualService.deriveUAL(uai, this.blockchainService.config.blockchainTitle, this.blockchainService.config.hubContractAddress);

    this.logger.info(`Assertion ID: ${assertionId}`);
    this.logger.info(`Assertion signature: ${signature}`);
    this.logger.info(
      `Assertion length in N-QUADS format: ${request.data.length}`
    );
    this.logger.info(`Keywords: ${request.metadata.keywords}`);

    if (request.ual) {
      this.logger.info(`UAL: ${request.ual}`);
    }

    // TODO create index entry

    return request;
  }

  async submitTransaction(method, assertionId, amount, length, holdingTimeInSeconds, signature, options) {
    if (!this.blockchainService.isInitialized()) {
      await this.blockchainService.initializeContracts();
    }

    // TODO: implement other methods
    let result = await this.blockchainService.createAsset(
        assertionId, amount, length, holdingTimeInSeconds, signature,
        options
    );

    return result.UAI;
  }

  async balanceOf(address) {
    if (!this.blockchainService.isInitialized()) {
      await this.blockchainService.initializeContracts();
    }

    return parseInt(await this.blockchainService.balanceOf(address));
  }
}

module.exports = PublishController;
