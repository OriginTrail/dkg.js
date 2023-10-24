// managers
const AssertionOperationsManager = require('./managers/assertion-operations-manager.js');
const AssetOperationsManager = require('./managers/asset-operations-manager.js');
const BlockchainOperationsManager = require('./managers/blockchain-operations-manager');
const GraphOperationsManager = require('./managers/graph-operations-manager.js');
const NetworkOperationsManager = require('./managers/network-operations-manager.js');
const NodeOperationsManager = require('./managers/node-operations-manager.js');

const BaseServiceManager = require('./services/base-service-manager.js');

class DkgClient {
    constructor(config) {
        const baseServiceManager = new BaseServiceManager(config);
        const services = baseServiceManager.getServices();

        this.assertion = new AssertionOperationsManager(services);
        this.asset = new AssetOperationsManager(services);
        this.blockchain = new BlockchainOperationsManager(services);
        this.node = new NodeOperationsManager(services);
        this.graph = new GraphOperationsManager(services);
        this.network = new NetworkOperationsManager(services);
    }
}
module.exports = DkgClient;
