const {resolveUAL} = require("../services/utilities.js");
const { ethers } = require('ethers');

class ParanetOperationsManager {
    constructor(services) {
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
    }

    async create(UAL, options = {}) {
        const {
            blockchain,
            paranetName,
            paranetDescription,
        } = this.inputService.getParanetCreateArguments(options);

        this.validationService.validateParanetCreate(
            UAL,
            blockchain,
            paranetName,
            paranetDescription,
        );

        const { contract, tokenId } = resolveUAL(UAL);

       await this.blockchainService.registerParanet({
                contract,
                tokenId,
                paranetName,
                paranetDescription,
            },
            blockchain
        );

        return UAL;
    }

    async deployIncentivesContract(paranetUAL, incentiveType, options = {}) {
        const {
            blockchain,
            tracToNeuroEmissionMultiplier,
            operatorRewardPercentage,
            incentivizationProposalVotersRewardPercentage,
        } = this.inputService.getParanetDeployIncentivesContractArguments(options);

        this.validationService.validateDeployIncentivesContract(
            paranetUAL,
            blockchain,
            tracToNeuroEmissionMultiplier,
            operatorRewardPercentage,
            incentivizationProposalVotersRewardPercentage,
        );
        if(incentiveType === 'Neuroweb') {
            const {contract, tokenId} = resolveUAL(paranetUAL);

            await this.blockchainService.deployNeuroIncentivesPool({
                    contract,
                    tokenId,
                    tracToNeuroEmissionMultiplier,
                    operatorRewardPercentage,
                    incentivizationProposalVotersRewardPercentage,
                },
                blockchain
            );

            const paranetId = ethers.keccak256(
                ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
            );

            const neuroIncentivesPoolAddress = await this.blockchainService.getNeuroIncentivesPoolAddress(paranetId, blockchain);

            // Temporary funding of neuro incentives pool address
            await this.blockchainService.sendTokens(neuroIncentivesPoolAddress, blockchain);

            return neuroIncentivesPoolAddress;
        } else {
            throw Error(`Unsupported incentive type: ${incentiveType}.`)
        }
    }

    async registerService(paranetUAL, serviceOBj, options = {}) {

    }

    async collectMinerReward(paranetUAL, options = {}) {
        const {
            blockchain,
        } = this.inputService.getParanetCollectMinerRewardArguments(options);
        this.validationService.validateParanetCollectMinerRewardArguments(
            paranetUAL,
            blockchain,
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.keccak256(
            ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        await this.blockchainService.claimKnowledgeMinerReward(paranetId, blockchain);
    }

    async collectVoterReward(paranetUAL, options = {}) {

    }

    async collectOperatorReward(paranetUAL, options = {}) {

    }

    async getClaimableMinerReward(paranetUAL, options = {}) {
        const {
            blockchain,
        } = this.inputService.getParanetCollectMinerRewardArguments(options);
        this.validationService.validateParanetCollectMinerRewardArguments(
            paranetUAL,
            blockchain,
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.keccak256(
            ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const claimableValue = await this.blockchainService.getClaimableKnowledgeMinerReward(paranetId, blockchain);

        return claimableValue;
    }
}
module.exports = ParanetOperationsManager;
