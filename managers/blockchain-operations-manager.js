
class BlockchainOperationsManager {

    constructor(config, services) {
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
    }

    async getGasPrice(options = {}){
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.getGasPrice(blockchain);
    }

    async getWalletBalances(options = {}){
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.getWalletBalances(blockchain);
    }
}

module.exports = BlockchainOperationsManager;
