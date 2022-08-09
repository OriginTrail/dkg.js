// managers
const AssetOperationsManager = require("./managers/asset-operations-manager.js");
const AssertionOperationsManager = require("./managers/assertion-operations-manager.js");
const IndexOperationsManager = require("./managers/index-operations-manager.js");
const GraphOperationsManager = require("./managers/graph-operations-manager.js");
const NodeOperationsManager = require("./managers/node-operations-manager.js");

// interfaces
const NodeApiInterface = require("./services/node-api-service/node-api-interface.js");
const BlockchainInterface = require("./services/blockchain-service/blockchain-interface.js");
// services
const ValidationService = require("./services/validation-service.js");
const Utilities = require("./services/utilities.js");

class DkgClient extends GraphOperationsManager {
  defaultCommunicationType = NodeApiInterface.default;

  constructor(config) {
    super(config);
    this.initializeServices(config);
    this.assertion = new AssertionOperationsManager(config, this.getServices());
    this.asset = new AssetOperationsManager(config, this.getServices());
    this.index = new IndexOperationsManager(config, this.getServices());
    this.node = new NodeOperationsManager(config, this.getServices());
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
    if (config.communicationType) {
      if (NodeApiInterface[config.communicationType]) {
        return new NodeApiInterface[config.communicationType](config);
      }
      return new this.defaultCommunicationType(config);
    }
    return new this.defaultCommunicationType(config);
  }

  initializeBlockchainService(config) {
    if (Utilities.nodeSupported()) {
      return new BlockchainInterface.node(config);
    }
    return new BlockchainInterface.browser(config);
  }
}
module.exports = DkgClient;
