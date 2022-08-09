class NodeOperationsManager {
  constructor(config, services) {
    this.nodeApiService = services.nodeApiService;
  }

  async info() {
    const response = await this.nodeApiService.info();

    return response.data;
  }
}
module.exports = NodeOperationsManager;
