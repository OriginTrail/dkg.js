export default class BlockchainOperationsManager {
    constructor(services) {
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
    }

    /**
     * @async
     * @param {Object} [options={}]  - Optional parameters for blockchain service.
     * @returns {Promise<number>} - A promise that resolves to the chain id.
     */
    async getChainId(options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.getChainId(blockchain);
    }

    /**
     * Retrieve the current gas price.
     * @async
     * @param {Object} [options={}]  - Optional parameters for blockchain service.
     * @returns {Promise<string>} - A promise that resolves to the current gas price.
     */
    async getGasPrice(options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.getGasPrice(blockchain);
    }

    /**
     * Retrieve the wallet balances.
     * @async
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Promise<Object>} - A promise that resolves to an object containing wallet balances.
     */
    async getWalletBalances(options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.getWalletBalances(blockchain);
    }

    /**
     * Retrieve the web3 instance.
     * @async
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Promise<Object>} - A promise that resolves to the web3 instance.
     */
    async getWeb3Instance(options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.getWeb3Instance(blockchain);
    }

    /**
     * Deploy and retrieve the owner and address of a new Paymaster contract.
     * @async
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Promise<Object>} - A promise that resolves to and object containing Paymaster deployer and address.
     */
    async createPaymaster(options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        const { deployer, paymasterAddress } = await this.blockchainService.createPaymaster(blockchain);

        return { deployer, paymasterAddress};
    }

    /**
     * Execute a contract function using the contract's address directly instead of its name
     * @param {string} contractAddress - The address of the contract
     * @param {string} contractType - The type of contract (to determine ABI, e.g., 'Paymaster')
     * @param {string} functionName - The name of the function to execute
     * @param {Array} args - The arguments to pass to the function
     * @param {Object} [options={}] - Optional parameters for blockchain service
     * @returns {Promise<Object>} - The transaction receipt
     */
    async executeContractFunctionByAddress(contractAddress, contractType, functionName, args, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.executeContractFunctionByAddress(
            contractAddress,
            contractType,
            functionName,
            args,
            blockchain
        );
    }

    /**
     * Call (read-only) a contract function using the contract's address directly instead of its name
     * @param {string} contractAddress - The address of the contract
     * @param {string} contractType - The type of contract (to determine ABI, e.g., 'Paymaster')
     * @param {string} functionName - The name of the function to call
     * @param {Array} args - The arguments to pass to the function
     * @param {Object} [options={}] - Optional parameters for blockchain service
     * @returns {Promise<any>} - The function return value
     */
    async callContractFunctionByAddress(contractAddress, contractType, functionName, args, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.callContractFunctionByAddress(
            contractAddress,
            contractType,
            functionName,
            args,
            blockchain
        );
    }
}
