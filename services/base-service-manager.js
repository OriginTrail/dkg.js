// interfaces
import NodeApiInterface from './node-api-service/node-api-interface.js';
import BlockchainInterface from './blockchain-service/blockchain-interface.js';
// services
import ValidationService from './validation-service.js';
import { nodeSupported } from './utilities.js';
import InputService from './input-service.js';

import { BLOCKCHAINS } from '../constants/constants.js';
import { ethers } from 'ethers';

export default class BaseServiceManager {
    constructor(config) {
        const blockchainName = config.blockchain?.name;
        if (!blockchainName) {
            throw new Error('Blockchain name is required. Please set it manually.');
        }

        for (const [env, chainsInEnv] of Object.entries(BLOCKCHAINS)) {
            if (Object.keys(chainsInEnv).includes(blockchainName)) {
                config.environment = env;
                break;
            }
        }

        if (!config.environment) {
            throw new Error(
                `Could not derive environment from blockchain name: ${blockchainName}. Ensure it's defined in BLOCKCHAINS constant.`,
            );
        }

        if (config.blockchain?.privateKey) {
            try {
                const wallet = new ethers.Wallet(config.blockchain.privateKey);
                config.blockchain.publicKey = wallet.address;
            } catch (error) {
                throw new Error(`Failed to derive public key from private key: ${error.message}`);
            }
        }

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
        if (nodeSupported()) {
            return new BlockchainInterface.Node(config);
        }
        if (!nodeSupported() && !window.ethereum && config.blockchain?.privateKey) {
            return new BlockchainInterface.Node(config);
        }
        return new BlockchainInterface.Browser(config);
    }
}
