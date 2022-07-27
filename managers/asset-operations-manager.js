import {formatAssertion, calculateRoot} from 'assertion-tools';
import Utilities from '../services/utilities.js'

class AssetOperationsManager {
    constructor(config, services) {
        this.blockchainService = services.blockchainService;
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
    }

    async create(content, options) {
        this.validationService.validatePublishRequest(content, options);
        const assertion = await formatAssertion(content);
        const assertionId = calculateRoot(assertion);
        let requestData = this.blockchainService.generateCreateAssetRequest(assertion, assertionId, options);
        const UAI = await this.blockchainService.createAsset(requestData, options);
        const UAL = this.blockchainService.generateUAL(options, UAI);
        // let operationId = await this.nodeApiService.publish(assertionId, assertion, UAL);
        // let operationResult = await this.nodeApiService.getPublishResult(operationId, options);
        // return { UAL : UAL, status: operationResult.status };
        return {UAL: UAL, status: "COMPLETED"};
    }

    get(UAL, options) {
        this.validationService.validateGetRequest(UAL, options);
        let {
            blockchain,
            contract,
            UAI,
            assertionId,
        } = Utilities.resolveUAL(UAL);
        this.blockchainService.getAssetCommitHash(UAI, options);
    }

    update() {

    }

    transfer() {

    }

}

export {AssetOperationsManager};
