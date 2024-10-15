class IdentityOperationsManager {
    constructor(services) {
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
        this.validationService = services.validationService;
    }

    /**
     * Retrieve node's identity ID
     * @async
     * @param {string} operational - Address of the node.
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {number} - Node's identity ID
     */
    async getIdentityId(operational, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateGetIdentityId(operational, blockchain);

        const identityId = await this.blockchainService.getIdentityId({ operational }, blockchain);

        return identityId;
    }
}

module.exports = IdentityOperationsManager;
