// interfaces
import NodeApiInterface from './node-api-service/node-api-interface.js';
import BlockchainInterface from './blockchain-service/blockchain-interface.js';
// services
import ValidationService from './validation-service.js';
import { nodeSupported } from './utilities.js';
import InputService from './input-service.js';

import { BLOCKCHAINS_RENAME_PAIRS  } from '../constants.js';

export default class BaseServiceManager {
    constructor(config) {
        const blockchainName = config.blockchain?.name;
        const configWithNewBlockchainName = config;
        if (blockchainName && Object.keys(BLOCKCHAINS_RENAME_PAIRS).includes(blockchainName))
            configWithNewBlockchainName.blockchain.name = BLOCKCHAINS_RENAME_PAIRS[blockchainName];

        this.initializeServices(configWithNewBlockchainName);
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
        if (nodeSupported()) {
            return new BlockchainInterface.Node(config);
        }
        if (!nodeSupported() && !window.ethereum && config.blockchain?.privateKey) {
            return new BlockchainInterface.Node(config);
        }
        return new BlockchainInterface.Browser(config);
    }
}
