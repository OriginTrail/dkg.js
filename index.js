// managers
const AssetOperationsManager = require("./managers/asset-operations-manager.js");
const AssertionOperationsManager = require("./managers/assertion-operations-manager.js");
const IndexOperationsManager = require("./managers/index-operations-manager.js");
const GraphOperationsManager = require("./managers/graph-operations-manager.js");
const NodeOperationsManager = require("./managers/node-operations-manager.js");

const BaseServiceManager = require("./services/base-service-manager.js");

class DkgClient extends GraphOperationsManager {
  constructor(config) {
    super(config);
    const baseServiceManager = new BaseServiceManager(config);
    const services = baseServiceManager.getServices();

    // this.assertion = new AssertionOperationsManager(config, services);
    this.asset = new AssetOperationsManager(config, services);
    // this.index = new IndexOperationsManager(config, services);
    this.node = new NodeOperationsManager(config, services);
  }
}
module.exports = DkgClient;
