
class BlockchainOperationsManager {

    constructor(config, services) {
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
    }

    /**
     * Retrieve the current gas price.
     * @async
     * @param {Object} [options={}]  - Optional parameters for blockchain service.
     * @returns {Promise<string>} - A promise that resolves to the current gas price.
     */
    async getGasPrice(options = {}){
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.getGasPrice(blockchain);
    }

    /**
     * Retrieve the wallet balances.
     * @async
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Promise<Object>} - A promise that resolves to an object containing wallet balances.
     */
    async getWalletBalances(options = {}){
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.getWalletBalances(blockchain);
    }
}

module.exports = BlockchainOperationsManager;
