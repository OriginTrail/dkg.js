const { ethers } = require('ethers');
const { resolveUAL } = require('../services/utilities.js');
const {
    INCENTIVE_TYPE,
} = require('../constants.js');

class ParanetOperationsManager {
    constructor(services) {
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
    }

    /**
     * Creates a new Paranet.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA that is created for Paranet.
     * @param {Object} [options={}] - Additional options for creating the Paranet.
     * @param {string} options.paranetName - Name of the Paranet.
     * @param {string} options.paranetDescription - Description of the Paranet.
     * @returns {Object} Object containing the Paranet UAL.
     * @example
     * await dkg.paranet.create(UAL, {
     *     paranetName: 'MyParanet',
     *     paranetDescription: 'A paranet for demonstration purposes.',
     * });
     */
    async create(UAL, options = {}) {
        const {
            blockchain,
            paranetName,
            paranetDescription,
            paranetNodesAccessPolicy,
            paranetMinersAccessPolicy
        } = this.inputService.getParanetCreateArguments(options);

        this.validationService.validateParanetCreate(
            UAL,
            blockchain,
            paranetName,
            paranetDescription,
            paranetNodesAccessPolicy,
            paranetMinersAccessPolicy
        );

        const { contract, tokenId } = resolveUAL(UAL);

       const receipt = await this.blockchainService.registerParanet({
                contract,
                tokenId,
                paranetName,
                paranetDescription,
                paranetNodesAccessPolicy,
                paranetMinersAccessPolicy
            },
            blockchain
        );

        return {
            paranetUAL: UAL,
            operation: receipt
        };
    }

    /**
     * Adds curated nodes to paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for adding curated nodes to a paranet.
     * @param {Array<number>} identityIds - List of node Identity IDs. 
     * @example
     * await dkg.paranet.addCuratedNodes(UAL, {
     *     identityIds: [1, 2],
     * });
     */
    async addCuratedNodes(paranetUAL, options = {}) {
        const { blockchain, identityIds } = this.inputService.getParanetAddCuratedNodes(options);

        this.validationService.validateParanetAddCuratedNodes(
            paranetUAL,
            blockchain,
            identityIds
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);

        await this.blockchainService.addParanetCuratedNodes({
                contract,
                tokenId,
                identityIds
            },
            blockchain
        );
    }

    /**
     * Removes curated nodes to paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for adding curated nodes to a paranet.
     * @param {Array<number>} identityIds - List of node Identity IDs to be removed. 
     * @example
     * await dkg.paranet.removeCuratedNodes(UAL, {
     *     identityIds: [1, 2],
     * });
     */
    async removeCuratedNodes(paranetUAL, options = {}) {
        const { blockchain, identityIds } = this.inputService.getParanetRemoveCuratedNodes(options);

        this.validationService.validateParanetRemoveCuratedNodes(
            paranetUAL,
            blockchain,
            identityIds
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);

        await this.blockchainService.removeParanetCuratedNodes({
                contract,
                tokenId,
                identityIds
            },
            blockchain
        );
    }

    /**
     * Request to become a curated node.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @example
     * await dkg.paranet.requestCuratedNodeAccess(UAL);
     */
    async requestCuratedNodeAccess(paranetUAL) {
        const { blockchain } = this.inputService.getRequestParanetCuratedNodeAccess(options);

        this.validationService.validateRequestParanetCuratedNodeAccess(
            paranetUAL,
            blockchain,
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);

        await this.blockchainService.requestParanetCuratedNodeAccess({
                contract,
                tokenId,
            },
            blockchain
        );
    }

    /**
     * Deploys an incentives contract for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {string} incentiveType - Type of incentives to deploy (only option 'Neuroweb').
     * @param {Object} [options={}] - Additional options for the incentives contract.
     * @param {string} options.tracToNeuroEmissionMultiplier - How much NEURO is emission per 1 TRAC.
     * @param {string} options.operatorRewardPercentage - Percentage of the emissions as a paranet operator fee.
     * @param {string} options.incentivizationProposalVotersRewardPercentage - Percentage of the emissions that will be shared with NEURO holders supporting the proposal.
     * @returns {Object} Object containing the Paranet UAL and incentives pool contract address.
     * @example
     * await dkg.paranet.deployIncentivesContract('paranetUAL123', 'Neuroweb', {
     *     tracToNeuroEmissionMultiplier: 1.5,
     *     operatorRewardPercentage: 20,
     *     incentivizationProposalVotersRewardPercentage: 10,
     * });
     */
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
        if(incentiveType === INCENTIVE_TYPE.NEUROWEB) {
            const {contract, tokenId} = resolveUAL(paranetUAL);

            const receipt = await this.blockchainService.deployNeuroIncentivesPool({
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

            return {
                paranetUAL,
                incentivesPoolContractAddress: neuroIncentivesPoolAddress,
                operation: receipt
            };
        }

        throw Error(`Unsupported incentive type: ${incentiveType}.`);
    }

    /**
     * Creates a new service for a Paranet.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA created for Service.
     * @param {Object} [options={}] - Additional options for creating the service.
     * @returns {Object} Object containing the service UAL.
     * @example
     * await dkg.paranet.createService(UAL, {
     *     paranetServiceName: 'MyService',
     *     paranetServiceDescription: 'Service for my Paranet',
     *     paranetServiceAddresses: ['0xServiceAddress1', '0xServiceAddress2'],
     * });
     */
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

        const receipt = await this.blockchainService.registerParanetService({
                contract,
                tokenId,
                paranetServiceName,
                paranetServiceDescription,
                paranetServiceAddresses,
            },
            blockchain
        );

        return {
            serviceUAL: UAL,
            operation: receipt
        };
    }

    /**
     * Adds services to an existing Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Array<string>} paranetServiceUALs - List of UALs of the services to add.
     * @param {Object} [options={}] - Additional options for adding services.
     * @returns {Object} Object containing the Paranet UAL and added service UALs.
     * @example
     * await dkg.paranet.addServices('paranetUAL123', ['serviceUAL1', 'serviceUAL2']);
     */
    async addServices(paranetUAL, paranetServiceUALs, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetAddServicesArguments(
            paranetUAL,
            paranetServiceUALs,
            blockchain,
        );
        const { contract, tokenId } = resolveUAL(paranetUAL);

        const processedServicesArray = [];
        for(const serviceUAL of paranetServiceUALs) {
            const { contract: serviceContract, tokenId: serviceTokenId } = resolveUAL(serviceUAL)
            processedServicesArray.push([ serviceContract, serviceTokenId ]);
        }

        const receipt = await this.blockchainService.addParanetServices({
                contract,
                tokenId,
                processedServicesArray
            },
            blockchain
        );

        return {
            paranetUAL,
            paranetServiceUALs,
            operation: receipt
        };
    }

    /**
     * Claims miner reward for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for claiming reward.
     * @returns {Object} Object containing the transaction hash and status.
     * @example
     * await dkg.paranet.claimMinerReward('paranetUAL123');
     */
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
            operation: receipt,
            transactionHash: receipt.transactionHash,
            status: receipt.status,
        };
    }

    /**
     * Claims voter reward for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for claiming reward.
     * @returns {Object} Object containing the transaction hash and status.
     * @example
     * await dkg.paranet.claimVoterReward('paranetUAL123');
     */
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
            operation: receipt,
            transactionHash: receipt.transactionHash,
            status: receipt.status,
        };
    }

    /**
     * Claims operator reward for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for claiming reward.
     * @returns {Object} Object containing the transaction hash and status.
     * @example
     * await dkg.paranet.claimOperatorReward('paranetUAL123');
     */
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
            operation: receipt,
            transactionHash: receipt.transactionHash,
            status: receipt.status,
        };
    }

    /**
     * Gets the claimable miner reward for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @returns {number} Claimable miner reward value.
     * @example
     * const reward = await dkg.paranet.getClaimableMinerReward(paranetUAL);
     */
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

    /**
     * Gets the claimable rewards for all miners of a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for getting the reward.
     * @returns {number} Claimable value for all miners.
     * @example
     * const reward = await dkg.paranet.getClaimableAllMinersReward(paranetUAL);
     */
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

    /**
     * Gets the claimable voter reward for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for getting the reward.
     * @returns {number} Claimable voter reward value.
     * @example
     * const reward = await dkg.paranet.getClaimableVoterReward(paranetUAL);
     */
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

    /**
     * Gets the claimable rewards for all voters of a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for getting the reward.
     * @returns {number} Claimable value for all voters.
     * @example
     * const reward = await dkg.paranet.getClaimableAllVotersReward(paranetUAL);
     */
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

    /**
     * Gets the claimable operator reward for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for getting the reward.
     * @returns {number} Claimable operator reward value.
     * @example
     * const reward = await dkg.paranet.getClaimableOperatorReward(paranetUAL);
     */
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

    /**
     * Updates claimable rewards for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for updating rewards.
     * @returns {Object} Object containing transaction hash and status.
     * @example
     * await dkg.paranet.updateClaimableRewards(paranetUAL);
     */
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
                operation: receipt,
                transactionHash: receipt.transactionHash,
                status: receipt.status,
            };
        }

        return {
            status: 'No updated knowledge assets.'
        };
    }

    /**
     * Checks if an address is a knowledge miner for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {string} options.roleAddress - Optional parameter, if not provided checks for the wallet that is given to the blockchain module.
     * @returns {boolean} True if the address is a knowledge miner, otherwise false.
     * @example
     * const isMiner = await dkg.paranet.isKnowledgeMiner('paranetUAL123', { roleAddress: '0xMinerAddress' });
     */
    async isKnowledgeMiner(paranetUAL, options = {}) {
        // eslint-disable-next-line prefer-const
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

    /**
     * Checks if an address is a Paranet operator.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {string} options.roleAddress - Optional parameter, if not provided checks for the wallet that is given to the blockchain module.
     * @returns {boolean} True if the address is a Paranet operator, otherwise false.
     * @example
     * const isOperator = await dkg.paranet.isParanetOperator('paranetUAL123', { roleAddress: '0xOperatorAddress' });
     */
    async isParanetOperator(paranetUAL, options = {}) {
        // eslint-disable-next-line prefer-const
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

    /**
     * Checks if an address is a proposal voter for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {string} options.roleAddress - Optional parameter, if not provided checks for the wallet that is given to the blockchain module.
     * @returns {boolean} True if the address is a proposal voter, otherwise false.
     * @example
     * const isVoter = await dkg.paranet.isProposalVoter('paranetUAL123', { roleAddress: '0xVoterAddress' });
     */
    async isProposalVoter(paranetUAL, options = {}) {
        // eslint-disable-next-line prefer-const
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
