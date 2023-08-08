class BlockchainOperationsManager {

    constructor(config, services) {
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
    }

}

module.exports = BlockchainOperationsManager;
