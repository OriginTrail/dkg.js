class NodeOperationsManager {
    constructor(services) {
        this.nodeApiService = services.nodeApiService;
        this.inputService = services.inputService;
    }

    /**
     * Gets the node info from the specified endpoint using the provided options.
     * @async
     * @param {Object} [options={}] - The options for the request.
     * @param {string} [options.endpoint] - The endpoint URL to send the request to.
     * @param {number} [options.port] - The port number to use for the request.
     * @param {string} [options.authToken] - The authentication token to include in the request headers.
     * @returns {Promise} - A promise that resolves to the node info data returned from the API.
     */
    async info(options = {}) {
        const endpoint = this.inputService.getEndpoint(options);
        const port = this.inputService.getPort(options);
        const authToken = this.inputService.getAuthToken(options);

        const response = await this.nodeApiService.info(endpoint, port, authToken);

        return response.data;
    }
}
module.exports = NodeOperationsManager;
