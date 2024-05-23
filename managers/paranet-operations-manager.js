const {resolveUAL} = require("../services/utilities.js");
const { ethers } = require('ethers');

class ParanetOperationsManager {
    constructor(services) {
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
    }

    /*
        address paranetKAStorageContract, <- UAL
        uint256 paranetKATokenId, <- UAL
        string calldata paranetName,
        string calldata paranetDescription,
        uint256 tracToNeuroRatio,
        uint96 tracTarget,
        uint16 operatorRewardPercentage
     */
    async create(UAL, options = {}) {
        const {
            blockchain,
            paranetName,
            paranetDescription,
            tracToNeuroRation,
            tracTarget,
            operatorRewardPercentage,
        } = this.inputService.getParanetCreateArguments(options);

        this.validationService.validateParanetCreate(
            UAL,
            blockchain,
            paranetName,
            paranetDescription,
            tracToNeuroRation,
            tracTarget,
            operatorRewardPercentage,
        );

        const { contract, tokenId } = resolveUAL(UAL);

       await this.blockchainService.registerParanet({
                contract,
                tokenId,
                paranetName,
                paranetDescription,
                tracToNeuroRation,
                tracTarget,
                operatorRewardPercentage
            },
            blockchain
        );

        const paranetId = ethers.keccak256(
            ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        return paranetId;
    }

    async registerService(paranetUAL, serviceOBj, options = {}) {

    }

    async collectMinerReward(paranetUAL, options = {}) {

    }

    async collectVoterReward(paranetUAL, options = {}) {

    }

    async collectOperatorReward(paranetUAL, options = {}) {

    }
}
module.exports = ParanetOperationsManager;
