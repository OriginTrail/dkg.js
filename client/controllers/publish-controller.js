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

    const content = await this.dataService.compact(options.content);
    if (!content.id) {
      content.id = "https://origintrail.io/default-data-id";
    }

    const request = { metadata: {}, data: [] };
    request.data = await this.dataService.toNQuads(content);

    request.metadata = {
      type: content.type ?? "Thing",
      issuer: options.publicKey ?? (await this.blockchainService.getAccount()),
      visibility: options.visibility,
      keywords: options.keywords,
      dataRootId: content.id,
    };

    request.metadata.keywords.sort();

    const metadataHash = this.validationService.calculateHash(request.metadata);
    const dataHash = this.validationService.calculateHash(request.data);
    const assertionId = this.validationService.calculateHash(
      metadataHash + dataHash
    );
    const signature = await this.blockchainService.sign(
      assertionId,
      options.privateKey
    );

    const rootHash = this.validationService.calculateRootHash(request.data);

    if (options.method === PUBLISH_METHOD.PROVISION) {
      // TODO: get UAL from blockchain
      request.ual = rootHash;
    } else if (options.method === PUBLISH_METHOD.UPDATE) {
      request.ual = options.ual;
    }

    if (request.ual) {
      this.logger.info(`UAL: ${request.ual}`);
    }
    this.logger.info(`Assertion ID: ${assertionId}`);
    this.logger.info(`Assertion metadataHash: ${metadataHash}`);
    this.logger.info(`Assertion dataHash: ${dataHash}`);
    this.logger.info(`Assertion rootHash: ${rootHash}`);
    this.logger.info(`Assertion signature: ${signature}`);
    this.logger.info(
      `Assertion length in N-QUADS format: ${request.data.length}`
    );
    this.logger.info(`Keywords: ${request.metadata.keywords}`);

    const { transactionHash, blockchain } = await this.submitProofs(
      options.method,
      assertionId,
      rootHash,
      request.metadata,
      {
        publicKey: options.publicKey,
        privateKey: options.privateKey,
        ual: request.ual,
      }
    );
    this.logger.info(`Transaction hash is ${transactionHash} on ${blockchain}`);
    request.ual = "dkg://did.otp.0x174714134abcd13431413413/987654321"

    return request;
  }

  async submitProofs(method, assertionId, rootHash, metadata, options) {
    let result;
    switch (method) {
      case PUBLISH_METHOD.PUBLISH:
        result = await this.blockchainService.createAssertionRecord(
          assertionId,
          rootHash,
          metadata.issuer,
          options
        );
        break;
      case PUBLISH_METHOD.PROVISION:
        result = await this.blockchainService.registerAsset(
          options.ual,
          metadata.type,
          options.ual,
          assertionId,
          rootHash,
          1,
          options
        );
        break;
      case PUBLISH_METHOD.UPDATE:
        result = await this.blockchainService.updateAsset(
          options.ual,
          assertionId,
          rootHash,
          options
        );
        break;
      default:
        break;
    }
    return result;
  }
}

module.exports = PublishController;
