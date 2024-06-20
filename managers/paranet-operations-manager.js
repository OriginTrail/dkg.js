const {resolveUAL, getOperationStatusObject} = require('../services/utilities.js');
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

        return {
            paranetUAL: UAL,
        };
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

            return {
                paranetUAL,
                incentivesPoolContractAddress: neuroIncentivesPoolAddress
            };
        } else {
            throw Error(`Unsupported incentive type: ${incentiveType}.`)
        }
    }

    async createService(UAL, options = {}) {
        const {
            blockchain,
            paranetServiceName,
            paranetServiceDescription,
            paranetServiceAddresses,
        } = this.inputService.getParanetCreateServiceArguments(options);
        this.validationService.validateParanetCreateServiceArguments(
            UAL,
            paranetServiceName,
            paranetServiceDescription,
            paranetServiceAddresses,
            blockchain,
        );

        const { contract, tokenId } = resolveUAL(UAL);

        await this.blockchainService.registerParanetService({
                contract,
                tokenId,
                paranetServiceName,
                paranetServiceDescription,
                paranetServiceAddresses,
            },
            blockchain
        );

        return {
            serviceUAL: UAL
        };
    }

    async addServices(paranetUAL, paranetServiceUALs, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetAddServicesArguments(
            paranetUAL,
            paranetServiceUALs,
            blockchain,
        );
        const { contract, tokenId } = resolveUAL(paranetUAL);

        const processedServicesArray = [];
        for(let serviceUAL of paranetServiceUALs) {
            const { contract: serviceContract, tokenId: serviceTokenId } = resolveUAL(serviceUAL)
            processedServicesArray.push([ serviceContract, serviceTokenId ]);
        }

        await this.blockchainService.addParanetServices({
                contract,
                tokenId,
                processedServicesArray
            },
            blockchain
        );

        return {
            paranetUAL,
            paranetServiceUALs
        };
    }

    async claimMinerReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(
            paranetUAL,
            blockchain,
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.keccak256(
            ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const receipt = await this.blockchainService.claimKnowledgeMinerReward(paranetId, blockchain);

        return {
            transactionHash: receipt.transactionHash,
            status: receipt.status,
        };
    }

    async claimVoterReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(
            paranetUAL,
            blockchain,
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.keccak256(
            ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const receipt = await this.blockchainService.claimVoterReward(paranetId, blockchain);
        return {
            transactionHash: receipt.transactionHash,
            status: receipt.status,
        };
    }

    async claimOperatorReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(
            paranetUAL,
            blockchain,
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.keccak256(
            ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const receipt = await this.blockchainService.claimOperatorReward(paranetId, blockchain);
        return {
            transactionHash: receipt.transactionHash,
            status: receipt.status,
        };
    }

    async getClaimableMinerReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(
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

    async getClaimableAllMinersReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(
            paranetUAL,
            blockchain,
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.keccak256(
            ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const claimableValue = await this.blockchainService.getClaimableAllKnowledgeMinersReward(paranetId, blockchain);

        return claimableValue;
    }

    async getClaimableVoterReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(
            paranetUAL,
            blockchain,
        );

        const {contract, tokenId} = resolveUAL(paranetUAL);
        const paranetId = ethers.keccak256(
            ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const claimableValue = await this.blockchainService.getClaimableVoterReward(paranetId, blockchain);

        return claimableValue;
    }

    async getClaimableAllVotersReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(
            paranetUAL,
            blockchain,
        );

        const {contract, tokenId} = resolveUAL(paranetUAL);
        const paranetId = ethers.keccak256(
            ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const claimableValue = await this.blockchainService.getClaimableAllVotersReward(paranetId, blockchain);

        return claimableValue;
    }

    async getClaimableOperatorReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(
            paranetUAL,
            blockchain,
        );

        const {contract, tokenId} = resolveUAL(paranetUAL);
        const paranetId = ethers.keccak256(
            ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const claimableValue = await this.blockchainService.getClaimableOperatorReward(paranetId, blockchain);

        return claimableValue;
    }

    async updateClaimableRewards(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(
            paranetUAL,
            blockchain,
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.keccak256(
            ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const updatingKnowledgeAssetStates = await this.blockchainService.getUpdatingKnowledgeAssetStates({ miner: blockchain.publicKey, paranetId }, blockchain);
        if(updatingKnowledgeAssetStates.length > 0) {
            const receipt = await this.blockchainService.updateClaimableRewards({
                contract,
                tokenId,
                start: 0,
                end: updatingKnowledgeAssetStates.length
            }, blockchain);

            return {
                transactionHash: receipt.transactionHash,
                status: receipt.status,
            };
        }
    }

    async isKnowledgeMiner(paranetUAL, options = {}) {
        let { blockchain, roleAddress }  = this.inputService.getParanetRoleCheckArguments(options);
        if (roleAddress == null) {
            roleAddress = blockchain.publicKey;
        }
        this.validationService.validateParanetRoleCheckArguments(
            roleAddress,
            paranetUAL,
            blockchain,
        );

        const {contract, tokenId} = resolveUAL(paranetUAL);
        const paranetId = ethers.keccak256(
            ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const isParanetKnowledgeMiner = await this.blockchainService.isParanetKnowledgeMiner(roleAddress ,paranetId, blockchain);

        return isParanetKnowledgeMiner;
    }

    async isParanetOperator(paranetUAL, options = {}) {
        let { blockchain, roleAddress }  = this.inputService.getParanetRoleCheckArguments(options);
        if (roleAddress == null) {
            roleAddress = blockchain.publicKey;
        }
        this.validationService.validateParanetRoleCheckArguments(
            roleAddress,
            paranetUAL,
            blockchain,
        );

        const {contract, tokenId} = resolveUAL(paranetUAL);
        const paranetId = ethers.keccak256(
            ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const isParanetOperator = await this.blockchainService.isParanetOperator(roleAddress ,paranetId, blockchain);

        return isParanetOperator;
    }

    async isProposalVoter(paranetUAL, options = {}) {
        let { blockchain, roleAddress }  = this.inputService.getParanetRoleCheckArguments(options);
        if (roleAddress == null) {
            roleAddress = blockchain.publicKey;
        }
        this.validationService.validateParanetRoleCheckArguments(
            roleAddress,
            paranetUAL,
            blockchain,
        );

        const {contract, tokenId} = resolveUAL(paranetUAL);
        const paranetId = ethers.keccak256(
            ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const isProposalVoter = await this.blockchainService.isParanetProposalVoter(roleAddress ,paranetId, blockchain);

        return isProposalVoter;
    }

}
module.exports = ParanetOperationsManager;
