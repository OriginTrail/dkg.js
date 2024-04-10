class NetworkOperationsManager {
    constructor(services) {
        this.inputService = services.inputService;
        this.blockchainService = services.blockchainService;
        this.nodeApiService = services.nodeApiService;
    }

    /**
     * Sends request to the DKG node in order to get suggested bid for given parameters.
     * @async
     * @param {string} publicAssertionId - Merkle Root of the data.
     * @param {number} sizeInBytes - Size of the data in bytes.
     * @param {Object} [options={}] - Additional options for getting bid suggestion.
     * @returns {BigInt} Suggested bid for publishing Knowledge Asset with given parameters.
     */
    async getBidSuggestion(publicAssertionId, sizeInBytes, options = {}) {
        const {
            blockchain,
            endpoint,
            port,
            epochsNum,
            hashFunctionId,
            authToken,
            bidSuggestionRange,
        } = this.inputService.getBidSuggestionArguments(options);

        const contentAssetStorageAddress = await this.blockchainService.getContractAddress(
            'ContentAssetStorage',
            blockchain,
        );

        const response = await this.nodeApiService.getBidSuggestion(
            endpoint,
            port,
            authToken,
            blockchain.name,
            epochsNum,
            sizeInBytes,
            contentAssetStorageAddress,
            publicAssertionId,
            hashFunctionId,
            bidSuggestionRange,
        );

        return typeof response === 'string' ? BigInt(response) : response;
    }
}
module.exports = NetworkOperationsManager;
