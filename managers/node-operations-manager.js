let nodeApiService;

class NodeOperationsManager {
  constructor(config, services) {
    nodeApiService = services.nodeApiService;
  }

  async info() {
    const response = await nodeApiService.info();

    return response.data;
  }
}
module.exports = NodeOperationsManager;
