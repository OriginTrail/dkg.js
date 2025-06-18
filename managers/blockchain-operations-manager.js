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

        return { deployer, paymasterAddress };
    }

    /**
     * Add an allowed address to a Paymaster contract.
     * @async
     * @param {string} address - The address to add to the allowed list.
     * @param {string} paymasterAddress - The address of the Paymaster contract.
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Promise<Object>} - A promise that resolves to the transaction result.
     */
    async addAllowedAddressPaymaster(address, paymasterAddress, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.addAllowedAddressPaymaster(address, paymasterAddress, blockchain);
    }

    /**
     * Remove an allowed address from a Paymaster contract
     * @param {string} address - The address to remove from allowed list
     * @param {string} paymasterAddress - The address of the Paymaster contract
     * @param {Object} [options={}] - Optional parameters for blockchain service
     * @returns {Promise<Object>} - The transaction receipt
     */
    async removeAllowedAddressPaymaster(address, paymasterAddress, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.removeAllowedAddressPaymaster(
            address,
            paymasterAddress,
            blockchain
        );
    }

    /**
     * Fund a Paymaster contract with tokens
     * @param {string} paymasterAddress - The address of the Paymaster contract
     * @param {string|number} amount - The amount of tokens to fund
     * @param {Object} [options={}] - Optional parameters for blockchain service
     * @returns {Promise<Object>} - The transaction receipt
     */
    async fundPaymaster(paymasterAddress, amount, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.fundPaymaster(
            paymasterAddress,
            amount,
            blockchain
        );
    }

    /**
     * Withdraw tokens from a Paymaster contract (only callable by owner)
     * @param {string} paymasterAddress - The address of the Paymaster contract
     * @param {string} recipient - The address to receive the tokens
     * @param {string|number} amount - The amount of tokens to withdraw
     * @param {Object} [options={}] - Optional parameters for blockchain service
     * @returns {Promise<Object>} - The transaction receipt
     */
    async withdrawFromPaymaster(paymasterAddress, recipient, amount, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.withdrawFromPaymaster(
            paymasterAddress,
            recipient,
            amount,
            blockchain
        );
    }

    /**
     * Check if an address is allowed to use a Paymaster
     * @param {string} address - The address to check
     * @param {string} paymasterAddress - The address of the Paymaster contract
     * @param {Object} [options={}] - Optional parameters for blockchain service
     * @returns {Promise<boolean>} - Whether the address is allowed
     */
    async isAddressAllowedPaymaster(address, paymasterAddress, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.isAddressAllowedPaymaster(
            address,
            paymasterAddress,
            blockchain
        );
    }

    /**
     * Get the owner of a Paymaster contract
     * @param {string} paymasterAddress - The address of the Paymaster contract
     * @param {Object} [options={}] - Optional parameters for blockchain service
     * @returns {Promise<string>} - The owner address
     */
    async getPaymasterOwner(paymasterAddress, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.getPaymasterOwner(
            paymasterAddress,
            blockchain
        );
    }

    /**
     * Get the token balance of a Paymaster contract
     * @param {string} paymasterAddress - The address of the Paymaster contract
     * @param {Object} [options={}] - Optional parameters for blockchain service
     * @returns {Promise<string>} - The token balance
     */
    async getPaymasterBalance(paymasterAddress, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.getPaymasterBalance(
            paymasterAddress,
            blockchain
        );
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

    /**
     * Retrieve the wallet.
     * @async
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Promise<Object>} - A promise that resolves to the wallet.
     */
    async getWalletAddress(options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return blockchain.publicKey;
    }
}
