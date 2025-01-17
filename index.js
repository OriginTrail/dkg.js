// managers
import AssertionOperationsManager from './managers/assertion-operations-manager.js';
import AssetOperationsManager from './managers/asset-operations-manager.js';
import BlockchainOperationsManager from './managers/blockchain-operations-manager.js';
import GraphOperationsManager from './managers/graph-operations-manager.js';
import NetworkOperationsManager from './managers/network-operations-manager.js';
import NodeOperationsManager from './managers/node-operations-manager.js';
import ParanetOperationsManager from './managers/paranet-operations-manager.js';

import BaseServiceManager from './services/base-service-manager.js';

export default class DkgClient {
    constructor(config) {
        const baseServiceManager = new BaseServiceManager(config);
        const services = baseServiceManager.getServices();

        this.assertion = new AssertionOperationsManager(services);
        this.asset = new AssetOperationsManager(services);
        this.blockchain = new BlockchainOperationsManager(services);
        this.node = new NodeOperationsManager(services);
        this.graph = new GraphOperationsManager(services);
        this.network = new NetworkOperationsManager(services);
        this.paranet = new ParanetOperationsManager(services);

        // Backwards compatibility
        this.graph.get = this.asset.get.bind(this.asset);
        this.graph.create = this.asset.create.bind(this.asset);
        this.graph.publishFinality = this.asset.publishFinality.bind(this.asset);
    }
}
