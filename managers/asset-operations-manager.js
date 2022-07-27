import { formatAssertion, calculateRoot } from 'assertion-tools';

class AssetOperationsManager {
    constructor(config, services) {
        this.blockchainService = services.blockchainService;
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
    }

    async create(content, options) {
        this.validationService.validatePublishRequest(content, options);
        try {
            const assertion = await formatAssertion(content);
            const assertionId = calculateRoot(assertion);
            let requestData = this.blockchainService.generateCreateAssetRequest(assertion, assertionId, options);
            await this.blockchainService.createAsset(requestData, options);
            // this.nodeApiService.publish(content, options);
            return requestData;
        } catch (e) {
            console.error(e);
        }
    }

    get() {

    }

    update() {

    }

    transfer() {

    }

}
export { AssetOperationsManager };
