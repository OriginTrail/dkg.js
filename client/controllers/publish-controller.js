const { PUBLISH_METHOD } = require("../../constants");
const axios = require("axios");
const FormData = require("form-data");

class PublishController {
  constructor(config, logger) {
    this.logger = logger;
    this.blockchainService = config.blockchainService;
    this.validationService = config.validationService;
    this.requestValidationService = config.requestValidationService;
    this.dataService = config.dataService;
  }

  async publish(options) {
    this.requestValidationService.validatePublishRequest(options);
    const content = await this.dataService.compact(options.content);
    const request = { metadata: [], data: [] };

    request.data = await this.dataService.canonize(content);

    const metadata = {
      type: content.type ?? "Thing",
      issuer: options.publicKey ?? await this.blockchainService.getAccount(),
      visibility: options.visibility,
      keywords: options.keywords,
      dataRootId: content.id ?? "https://origintrail.io/default-data-id",
    };

    metadata.keywords.sort();

    request.metadata = await this.dataService.appendMetadata(
      request.metadata,
      metadata
    );

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
    this.logger.info(`Keywords: ${metadata.keywords}`);

    const { transactionHash, blockchain } = await this.submitProofs(
      options.method,
      assertionId,
      rootHash,
      metadata,
      {
        publicKey: options.publicKey,
        privateKey: options.privateKey,
        ual: request.ual,
      }
    );
    this.logger.info(`Transaction hash is ${transactionHash} on ${blockchain}`);

    request.metadata = await this.dataService.appendMetadata(request.metadata, {
      blockchain,
      transactionHash,
    });

    console.log(JSON.stringify(request, null, 2));

    this.logger.debug("Sending publish request.");
    /* const form = new FormData();
    let axios_config;

    if (nodeSupported()) {
      axios_config = {
        method: "post",
        url: `${nodeBaseUrl}/${options.method}`,
        headers: {
          ..._getFormHeaders(form),
        },
        data: form,
      };
    } else {
      axios_config = {
        method: "post",
        url: `${nodeBaseUrl}/${options.method}`,
        data: form,
      };
    }

    return axios(axios_config); */
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
