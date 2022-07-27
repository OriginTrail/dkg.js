import {formatAssertion, calculateRoot} from 'assertion-tools';
import Utilities from '../services/utilities.js'
import {AssertionOperationsManager} from "./assertion-operations-manager.js";
import {OPERATIONS} from '../constants.js'

class AssetOperationsManager {
    constructor(config, services) {
        this.blockchainService = services.blockchainService;
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
        this.assertion = new AssertionOperationsManager(config, services);
    }

    async create(content, options) {
        this.validationService.validatePublishRequest(content, options);
        options.operation = OPERATIONS.publish;
        const assertion = await formatAssertion(content);
        const assertionId = calculateRoot(assertion);
        let requestData = this.blockchainService.generateCreateAssetRequest(assertion, assertionId, options);
        const UAI = await this.blockchainService.createAsset(requestData, options);
        const UAL = this.blockchainService.generateUAL(options, UAI);
        let operationId = await this.nodeApiService.publish(assertionId, assertion, UAL);
        let operationResult = await this.nodeApiService.getOperationResult(operationId, options);
        return {UAL: UAL, assertionId: assertionId, status: operationResult.status};
    }

    async get(UAL, options) {
        this.validationService.validateGetRequest(UAL, options);
        options.operation = OPERATIONS.get;
        let {
            UAI
        } = Utilities.resolveUAL(UAL);
        const assertionId = await this.blockchainService.getAssetCommitHash(UAI, options);
        return await this.assertion.get(assertionId, options);
    }

    async update(UAL, content, options) {
        this.validationService.validatePublishRequest(content, options);
        options.operation = OPERATIONS.publish;
        const assertion = await formatAssertion(content);
        const assertionId = calculateRoot(assertion);
        let {
            UAI
        } = Utilities.resolveUAL(UAL);
        let requestData = this.blockchainService.generateUpdateAssetRequest(UAI, assertion, assertionId, options);
        await this.blockchainService.updateAsset(requestData, options);
        let operationId = await this.nodeApiService.publish(assertionId, assertion, UAL);
        let operationResult = await this.nodeApiService.getOperationResult(operationId, options);
        return {UAL: UAL, assertionId: assertionId, status: operationResult.status};
    }

    async transfer(UAL, to, options) {
        this.validationService.validateAssetTransferRequest(UAL, to);
        let {
            UAI
        } = Utilities.resolveUAL(UAL);
        return await this.blockchainService.transferAsset(UAL, UAI, to, options);
    }

}

export {AssetOperationsManager};
