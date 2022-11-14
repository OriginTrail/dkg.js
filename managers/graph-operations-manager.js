class GraphOperationsManager {
    constructor(config, services) {
        this.config = config;
        this.nodeApiService = services.nodeApiService;
    }

    async query(queryString, type, options = {}) {
        const operationId = await this.nodeApiService.query({query: queryString, type}, options);

        return this.nodeApiService.getOperationResult(
            operationId,
            {
                ...options,
                operation: 'query'
            }
        );
    }
}
module.exports = GraphOperationsManager;
