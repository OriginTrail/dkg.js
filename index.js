// managers
const AssetOperationsManager = require('./managers/asset-operations-manager.js');
const BlockchainOperationsManager = require('./managers/blockchain-operations-manager');
const GraphOperationsManager = require('./managers/graph-operations-manager.js');
const NodeOperationsManager = require('./managers/node-operations-manager.js');

const BaseServiceManager = require('./services/base-service-manager.js');

class DkgClient {
    constructor(config) {
        const baseServiceManager = new BaseServiceManager(config);
        const services = baseServiceManager.getServices();

        this.asset = new AssetOperationsManager(config, services);
        this.blockchain = new BlockchainOperationsManager(config, services);
        this.graph = new GraphOperationsManager(config, services);
        this.node = new NodeOperationsManager(config, services);
    }
}
module.exports = DkgClient;
