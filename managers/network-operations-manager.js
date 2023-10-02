class NetworkOperationsManager {
    constructor(services) {
        this.inputService = services.inputService;
        this.blockchainService = services.blockchainService;
        this.nodeApiService = services.nodeApiService;
    }

    /**
     * Sends request to the DKG node in order to get suggested bid for given parameters.
     * @async
     * @param {number} merkleRoot - Merkle Root of the file.
     * @param {number} sizeInBytes - Size of the data in bytes.
     * @param {Object} [options={}] - Additional options for getting bid suggestion.
     * @returns {number} Suggested bid for publishing Knowledge Asset with given parameters.
     */
    async getBidSuggestion(merkleRoot, sizeInBytes, options = {}) {
        const {
            blockchain,
            endpoint,
            port,
            epochsNum,
            hashFunctionId,
            authToken,
        } = this.inputService.getBidSuggestionArguments(options);

        const contentAssetStorageAddress = await this.blockchainService.getContractAddress(
            'ContentAssetStorage',
            blockchain,
        );

        return this.nodeApiService.getBidSuggestion(
            endpoint,
            port,
            authToken,
            blockchain.name.startsWith('otp') ? 'otp' : blockchain.name,
            epochsNum,
            sizeInBytes,
            contentAssetStorageAddress,
            merkleRoot,
            hashFunctionId,
        )
    }
    
}
module.exports = NetworkOperationsManager;
