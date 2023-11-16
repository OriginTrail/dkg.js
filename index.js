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
        const blockchainName = config.blockchain?.name;

        if (blockchainName) {
            switch (blockchainName) {
                case 'hardhat':
                    config.blockchain.name = 'hardhat:31337';
                    break;
                case 'otp::devnet':
                    config.blockchain.name = 'otp:2160';
                    break;
                case 'otp::testnet':
                    config.blockchain.name = 'otp:20430';
                    break;
                case 'otp::mainnet':
                    config.blockchain.name = 'otp:2043';
                    break;
                default:
                    break;
            }
        }

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
