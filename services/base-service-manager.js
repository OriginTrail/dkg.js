// interfaces
const NodeApiInterface = require("./services/node-api-service/node-api-interface.js");
const BlockchainInterface = require("./services/blockchain-service/blockchain-interface.js");
// services
const ValidationService = require("./services/validation-service.js");
const Utilities = require("./services/utilities.js");

class BaseServiceManager {
  constructor(config) {
    this.initializeServices(config);
  }

  initializeServices(config) {
    this.blockchainService = this.initializeBlockchainService(config);
    this.nodeApiService = this.initializeNodeApiService(config);
    this.validationService = new ValidationService();
  }

  getServices() {
    return {
      blockchainService: this.blockchainService,
      nodeApiService: this.nodeApiService,
      validationService: this.validationService,
    };
  }

  initializeNodeApiService(config) {
    return config.communicationType &&
      NodeApiInterface[config.communicationType]
      ? new NodeApiInterface[config.communicationType](config)
      : new NodeApiInterface['default'](config);
  }

  initializeBlockchainService(config) {
    if (Utilities.nodeSupported()) {
      return new BlockchainInterface.node(config);
    }
    return new BlockchainInterface.browser(config);
  }
}

module.exports = BaseServiceManager;
