class NodeOperationsManager {
    constructor(config, services) {
        this.nodeApiService = services.nodeApiService;
        this.inputService = services.inputService;
    }

    async info(options = {}) {
        const endpoint = this.inputService.getEndpoint(options);
        const port = this.inputService.getPort(options);
        const authToken = this.inputService.getAuthToken(options);

        const response = await this.nodeApiService.info(endpoint, port, authToken);

        return response.data;
    }
}
module.exports = NodeOperationsManager;
