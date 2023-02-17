// interfaces
const NodeApiInterface = require('./node-api-service/node-api-interface.js');
const BlockchainInterface = require('./blockchain-service/blockchain-interface.js');
// services
const ValidationService = require('./validation-service.js');
const Utilities = require('./utilities.js');
const InputService = require('./input-service.js');

class BaseServiceManager {
    constructor(config) {
        this.initializeServices(config);
    }

    initializeServices(config) {
        this.blockchainService = this.initializeBlockchainService(config);
        this.nodeApiService = this.initializeNodeApiService(config);
        this.inputService = new InputService(config);
        this.validationService = new ValidationService();
    }

    getServices() {
        return {
            blockchainService: this.blockchainService,
            nodeApiService: this.nodeApiService,
            validationService: this.validationService,
            inputService: this.inputService,
        };
    }

    initializeNodeApiService(config) {
        return config.communicationType && NodeApiInterface[config.communicationType]
            ? new NodeApiInterface[config.communicationType](config)
            : new NodeApiInterface.Default(config);
    }

    initializeBlockchainService(config) {
        if (Utilities.nodeSupported()) {
            return new BlockchainInterface.Node(config);
        }
        if (!Utilities.nodeSupported() && !window.ethereum && config.blockchain?.privateKey) {
            return new BlockchainInterface.Node(config);
        }
        return new BlockchainInterface.Browser(config);
    }
}

module.exports = BaseServiceManager;
