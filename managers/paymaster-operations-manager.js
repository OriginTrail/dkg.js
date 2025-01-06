export default class PaymasterOperationsManager {
    constructor(services) {
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
        this.validationService = services.validationService;
    }

    /**
     * @async
     * @param {BigInt} tokenAmount - The amount of tokens (Wei) to set the allowance.
     * @param {Object} [options={}] - Additional options for increasing allowance - currently only blockchain option expected.
     * @param {string} recipient - The address of the recipient (used for operations like withdrawal or funding).
     * @returns {Object} Object containing hash of blockchain transaction and status.
     */

    async deployPaymasterContract(options = {}) {
        try {
            const blockchain = this.inputService.getBlockchain(options);
          
            this.validationService.validateBlockchain(blockchain);

            const paymasterAddress = await this.blockchainService.deployPaymasterContract(blockchain);

            return paymasterAddress;
         
        } catch (error) {
            console.error('Error deploying Paymaster contract:', error);
        }
    }

    async addAllowedAddress(paymasterAddress,addresToBeWhitelested, options = {}) {
        try {
            const blockchain = this.inputService.getBlockchain(options);
                
            this.validationService.validatePaymasterAddress(blockchain, paymasterAddress, addresToBeWhitelested);
           
            await this.blockchainService.addAllowedAddress(blockchain, paymasterAddress, addresToBeWhitelested);
          
        } catch (error) {
            console.error('Error adding allowed address:', error);
        }
    }

    async removeAllowedAddress(paymasterAddress, addresToBeWhitelested, options = {}) {
        try {
            const blockchain = this.inputService.getBlockchain(options);

            this.validationService.validatePaymasterAddress(blockchain, paymasterAddress, addresToBeWhitelested);
                
            await this.blockchainService.removeAllowedAddress(blockchain,paymasterAddress, addresToBeWhitelested);

        } catch (error) {
            console.error('Error removing allowed address:', error);
        }
    }

    async fundPaymaster(paymasterAddress, tokenAmount, options = {}) {
        try {
            const blockchain = this.inputService.getBlockchain(options);

            this.validationService.validatePaymasterToken(blockchain, paymasterAddress, tokenAmount);

            await this.blockchainService.fundPaymaster(blockchain, paymasterAddress, tokenAmount);

        } catch (error) {
            console.error('Error funding paymaster:', error);
        }
    }

    async withdraw(paymasterAddress, recipient, tokenAmount, options = {}) {
        try {
            const blockchain = this.inputService.getBlockchain(options);

            this.validationService.validatePaymasterTokenAdress(
                blockchain,
                paymasterAddress,
                tokenAmount,
                recipient,
            )
            
            await this.blockchainService.withdrawPaymaster(blockchain, paymasterAddress, recipient, tokenAmount);
           
        } catch (error) {
            console.error('Error withdrawing:', error);
        }
    }

}
