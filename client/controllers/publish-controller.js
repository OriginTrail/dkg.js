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

    let assertion = { metadata: {} };
    let type;
    if (options.content["@type"]) {
      type = options.content["@type"];
    } else if (options.content.type) {
      type = options.content.type;
    } else {
      type = "default";
    }
    assertion.metadata.type = type;

    assertion.metadata.issuer = this.blockchainService.getPublicKey();
    assertion.metadata.visibility = options.visibility;
    assertion.metadata.keywords = options.keywords;
    assertion.metadata.keywords.sort();
    if (options.method === PUBLISH_METHOD.PROVISION) {
      // TODO: UAL calculation
      const calculatedUal = Math.random(100000);
      assertion.metadata.UALs = [calculatedUal];
    } else if (options.method === PUBLISH_METHOD.UPDATE) {
      assertion.metadata.UALs = [options.ual];
    }
    assertion.metadata.dataHash = this.validationService.calculateHash(nquads);
    console.log(JSON.stringify(assertion, null, 2));
    assertion.metadataHash = this.validationService.calculateHash(
      assertion.metadata
    );
    assertion.id = this.validationService.calculateHash(
      assertion.metadataHash + assertion.metadata.dataHash
    );
    assertion.signature = this.validationService.sign(
      assertion.id,
      this.blockchainService.getPrivateKey()
    );

    nquads = await this.dataService.appendMetadata(nquads, assertion);

    assertion.rootHash = this.validationService.calculateRootHash(nquads);

    if (assertion.metadata.UALs) {
      this.logger.info(`UAL: ${assertion.metadata.UALs[0]}`);
    }
    this.logger.info(`Assertion ID: ${assertion.id}`);
    this.logger.info(`Assertion metadataHash: ${assertion.metadataHash}`);
    this.logger.info(`Assertion dataHash: ${assertion.metadata.dataHash}`);
    this.logger.info(`Assertion rootHash: ${assertion.rootHash}`);
    this.logger.info(`Assertion signature: ${assertion.signature}`);
    this.logger.info(`Assertion length in N-QUADS format: ${nquads.length}`);
    this.logger.info(`Keywords: ${assertion.metadata.keywords}`);

    const result = await this.submitProofs(options.method, assertion);
    const { transactionHash, blockchain } = result;
    this.logger.info(`Transaction hash is ${transactionHash} on ${blockchain}`);

    assertion.blockchain = {
      name: blockchain,
      transactionHash,
    };

    nquads = await this.dataService.appendBlockchainMetadata(nquads, assertion);

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

  async submitProofs(method, assertion) {
    let result;
    switch (method) {
      case PUBLISH_METHOD.PUBLISH:
        result = await this.blockchainService.createAssertionRecord(
          assertion.id,
          assertion.rootHash,
          assertion.metadata.issuer
        );
        break;
      case PUBLISH_METHOD.PROVISION:
        result = await this.blockchainService.registerAsset(
          assertion.metadata.UALs[0],
          assertion.metadata.type,
          assertion.metadata.UALs[0],
          assertion.id,
          assertion.rootHash,
          1
        );
        break;
      case PUBLISH_METHOD.UPDATE:
        result = await this.blockchainService.updateAsset(
          assertion.metadata.UALs[0],
          assertion.id,
          assertion.rootHash
        );
        break;
      default:
        break;
    }
    return result;
  }
}

module.exports = PublishController;
