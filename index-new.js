// managers
import {AssetOperationsManager} from './managers/asset-operations-manager.js';
import {AssertionOperationsManager} from './managers/assertion-operations-manager.js';
import {IndexOperationsManager} from './managers/index-operations-manager.js';
import {GraphOperationsManager} from './managers/graph-operations-manager.js';
// interfaces
import NodeApiInterface from './services/node-api-service/node-api-interface.js';
import BlockchainInterface from './services/blockchain-service/blockchain-interface.js';
// services
import {ValidationService} from './services/validation-service.js';
import Utilities from './services/utilities.js';

class DkgClient extends GraphOperationsManager {
    defaultCommunicationType = NodeApiInterface.default;

    constructor(config) {
        super(config);
        this.initializeServices(config);
        this.assertion = new AssertionOperationsManager(config, this.getServices());
        this.asset = new AssetOperationsManager(config, this.getServices());
        this.index = new IndexOperationsManager(config, this.getServices());
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
        }
    }

    initializeNodeApiService(config) {
        if (config.communicationType) {
            if(NodeApiInterface[config.communicationType]) {
                return new NodeApiInterface[config.communicationType](config);
            }
            return new this.defaultCommunicationType(config);
        }
        return new this.defaultCommunicationType(config);
    }

    initializeBlockchainService(config) {
        if(Utilities.nodeSupported()) {
            return new BlockchainInterface.node(config);
        }
        return new BlockchainInterface.browser(config);
    }
}

export {DkgClient};
