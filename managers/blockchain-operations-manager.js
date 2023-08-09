
class BlockchainOperationsManager {

    constructor(config, services) {
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
    }

    async getGasPrice(blockchain){
        return this.blockchainService.getGasPrice(blockchain);
    }
}

module.exports = BlockchainOperationsManager;
