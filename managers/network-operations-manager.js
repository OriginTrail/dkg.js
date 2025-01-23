export default class NetworkOperationsManager {
    constructor(services) {
        this.inputService = services.inputService;
        this.blockchainService = services.blockchainService;
        this.nodeApiService = services.nodeApiService;
    }
}
