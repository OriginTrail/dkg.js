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
    let nquads = await this.dataService.canonize(options.content);

    let metadata = {};
    metadata.issuer = this.blockchainService.getPublicKey();
    metadata.visibility = options.visibility;
    metadata.keywords = options.keywords;
    metadata.keywords.sort();
    if (options.method === PUBLISH_METHOD.PROVISION) {
      // TODO: UAL calculation
      const calculatedUal = Math.random(100000);
      metadata.UALs = [calculatedUal];
    } else if (options.method === PUBLISH_METHOD.UPDATE) {
      metadata.UALs = [options.ual];
    }
    metadata.dataHash = this.validationService.calculateHash(nquads);
    const metadataHash = this.validationService.calculateHash(metadata);
    metadata.assertionId = this.validationService.calculateHash(
      metadataHash + metadata.dataHash
    );
    metadata.signature = this.validationService.sign(
      metadata.assertionId,
      this.blockchainService.getPrivateKey()
    );

    nquads = await this.dataService.appendMetadata(
      nquads,
      metadata
    );

    const rootHash = this.validationService.calculateRootHash(nquads);

    if (metadata.UALs) {
      this.logger.info(`UAL: ${metadata.UALs[0]}`);
    }
    this.logger.info(`Assertion ID: ${metadata.assertionId}`);
    this.logger.info(`Assertion metadataHash: ${metadataHash}`);
    this.logger.info(`Assertion dataHash: ${metadata.dataHash}`);
    this.logger.info(`Assertion rootHash: ${rootHash}`);
    this.logger.info(`Assertion signature: ${metadata.signature}`);
    this.logger.info(`Assertion length in N-QUADS format: ${nquads.length}`);
    this.logger.info(`Keywords: ${metadata.keywords}`);

    let result;
    switch (options.method) {
      case PUBLISH_METHOD.PUBLISH:
        result = await this.blockchainService.createAssertionRecord(
          metadata.assertionId,
          rootHash,
          metadata.issuer
        );
        break;
      case PUBLISH_METHOD.PROVISION:
        result = await this.blockchainService.registerAsset(
          metadata.UALs[0],
          metadata.type,
          metadata.UALs[0],
          metadata.assertionId,
          rootHash,
          1
        );
        break;
      case PUBLISH_METHOD.UPDATE:
        result = await this.blockchainService.updateAsset(
          metadata.UALs[0],
          metadata.assertionId,
          rootHash
        );
        break;
      default:
        break;
    }
    const { transactionHash, blockchain } = result;
    this.logger.info(`Transaction hash is ${transactionHash} on ${blockchain}`);

    const blockchainMetadata = {
      assertionId: metadata.assertionId,
      name: blockchain,
      transactionHash,
    };

    nquads = await this.dataService.appendBlockchainMetadata(nquads, blockchainMetadata);

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
}

module.exports = PublishController;
