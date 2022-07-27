const AssetOperationsManager = require('./managers/asset-operations-manager')
const AssertionOperationsManager = require('./managers/asset-operations-manager')
const IndexOperationsManager = require('./managers/asset-operations-manager')
const GraphOperationsManager = require('./managers/asset-operations-manager')
const BlockchainService = require('./services/blockchain-service');

class DkgClient extends GraphOperationsManager {
  constructor(props) {
    super(props);
    this.initializeServices();
    this.asset = new AssetOperationsManager(props, {
      blockchainService: this.blockchainService,
    });
    this.assertion = new AssertionOperationsManager(props, {
      blockchainService: this.blockchainService,
    });
    this.index = new IndexOperationsManager(props, {
      blockchainService: this.blockchainService,
    });
  }

  initializeServices() {
    this.blockchainService = new BlockchainService();
  }
}
module.exports = DkgClient;
