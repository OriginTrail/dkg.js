import { resolveUAL, getParanetId, getKnowledgeCollectionId } from '../services/utilities.js';
import { PARANET_KNOWLEDGE_COLLECTION_STATUS } from '../constants/constants.js';

export default class ParanetOperationsManager {
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
     * @param {number} paranetNodesAccessPolicy - Paranet's policy towards including nodes.
     * @param {number} paranetMinersAccessPolicy - Paranet's policy towards including knowledge miners.
     * @returns {Object} Object containing the Paranet UAL.
     * @example
     * await dkg.paranet.create(UAL, {
     *     paranetName: 'MyParanet',
     *     paranetDescription: 'A paranet for demonstration purposes.',
     *     paranetNodesAccessPolicy: 0,
     *     paranetMinersAccessPolicy: 0
     * });
     */
    async create(UAL, options = {}) {
        const {
            blockchain,
            paranetName,
            paranetDescription,
            paranetNodesAccessPolicy,
            paranetMinersAccessPolicy,
            paranetKcSubmissionPolicy,
        } = this.inputService.getParanetCreateArguments(options);

        this.validationService.validateParanetCreate(
            UAL,
            blockchain,
            paranetName,
            paranetDescription,
            paranetNodesAccessPolicy,
            paranetMinersAccessPolicy,
            paranetKcSubmissionPolicy,
        );

        const { contract, kcTokenId, kaTokenId } = resolveUAL(UAL);

        if (!kaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const receipt = await this.blockchainService.registerParanet(
            {
                contract,
                kcTokenId,
                kaTokenId,
                paranetName,
                paranetDescription,
                paranetNodesAccessPolicy,
                paranetMinersAccessPolicy,
                paranetKcSubmissionPolicy,
            },
            blockchain,
        );

        return {
            paranetUAL: UAL,
            operation: receipt,
        };
    }

    /**
     * Check if a Knowledge Collection is registered to a Paranet.
     * @async
     * @param {string} kcUAL - Universal Asset Locator of the KC to be checked.
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for checking if a KC is registered.
     * @returns {Object} Object containing the Paranet UAL and knowledge collections.
     * @example
     * await dkg.paranet.isKnowledgeCollectionRegistered(paranetUAL, kcUAL);
     */
    async isKnowledgeCollectionRegistered(kcUAL, paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetIsKnowledgeCollectionRegistered(
            kcUAL,
            paranetUAL,
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const knowledgeCollectionId = getKnowledgeCollectionId(kcUAL);

        const isKcRegisteredToParanet =
            await this.blockchainService.isKnowledgeCollectionRegistered(
                { paranetId, knowledgeCollectionId },
                blockchain,
            );

        return { paranetUAL, isKcRegisteredToParanet };
    }

    /**
     * Adds a Knowledge Collection curator to a Paranet.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA that is created for Paranet.
     * @param {string} curatorAddress - Address of the curator to be added.
     * @param {Object} [options={}] - Additional options for adding a curator to a paranet.
     * @returns {Object} Object containing the Paranet UAL and operation receipt.
     * @example
     * await dkg.paranet.addCurator(paranetUAL, curatorAddress);
     */
    async addCurator(paranetUAL, curatorAddress, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetAddCurator(paranetUAL, curatorAddress, blockchain);

        const { contract: kcStorageContract, kcTokenId, kaTokenId } = resolveUAL(paranetUAL);

        if (!kaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const receipt = await this.blockchainService.addCurator(
            {
                kcStorageContract,
                kcTokenId,
                kaTokenId,
                curatorAddress,
            },
            blockchain,
        );

        return {
            paranetUAL,
            operation: receipt,
        };
    }

    /**
     * Removes a Knowledge Collection curator from a Paranet. Can only be done by the paranet operator.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA that is created for Paranet.
     * @param {string} curatorAddress - Address of the curator to be removed.
     * @param {Object} [options={}] - Additional options for removing a curator from a paranet.
     * @returns {Object} Object containing the Paranet UAL and operation receipt.
     * @example
     * await dkg.paranet.removeCurator(paranetUAL, curatorAddress);
     */
    async removeCurator(paranetUAL, curatorAddress, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetRemoveCurator(paranetUAL, curatorAddress, blockchain);

        const { contract: kcStorageContract, kcTokenId, kaTokenId } = resolveUAL(paranetUAL);

        if (!kaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const receipt = await this.blockchainService.removeCurator(
            {
                kcStorageContract,
                kcTokenId,
                kaTokenId,
                curatorAddress,
            },
            blockchain,
        );

        return {
            paranetUAL,
            operation: receipt,
        };
    }

    /**
     * Stages a Knowledge Collection to a Paranet.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA that is created for Paranet.
     * @param {string} kcUAL - Universal Asset Locator of the KC to be staged.
     * @param {Object} [options={}] - Additional options for staging a KC.
     * @returns {Object} Object containing the Paranet UAL and operation receipt.
     * @example
     * await dkg.paranet.stageKnowledgeCollection(paranetUAL, kcUAL);
     */
    async stageKnowledgeCollection(kcUAL, paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetStageKnowledgeCollection(
            kcUAL,
            paranetUAL,
            blockchain,
        );

        const {
            contract: paranetKcStorageContract,
            kcTokenId: paranetKcTokenId,
            kaTokenId: paranetKaTokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const { contract: kcStorageContract, kcTokenId } = resolveUAL(kcUAL);

        const receipt = await this.blockchainService.stageKnowledgeCollection(
            {
                paranetKcStorageContract,
                paranetKcTokenId,
                paranetKaTokenId,
                kcStorageContract,
                kcTokenId,
            },
            blockchain,
        );

        return {
            kcUAL,
            paranetUAL,
            operation: receipt,
        };
    }

    /**
     * Reviews a Knowledge Collection submitted to paranet which is in the staging phase.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA that is created for Paranet.
     * @param {string} kcUAL - Universal Asset Locator of the KC to be reviewed.
     * @param {boolean} accepted - Whether the KC is accepted or rejected.
     * @param {Object} [options={}] - Additional options for reviewing a KC.
     * @returns {Object} Object containing the Paranet UAL and operation receipt.
     * @example
     * await dkg.paranet.reviewKnowledgeCollection(paranetUAL, kcUAL, accepted);
     */
    async reviewKnowledgeCollection(kcUAL, paranetUAL, accepted, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetReviewKnowledgeCollection(
            kcUAL,
            paranetUAL,
            accepted,
            blockchain,
        );

        const {
            contract: paranetKcStorageContract,
            kcTokenId: paranetKcTokenId,
            kaTokenId: paranetKaTokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const { contract: kcStorageContract, kcTokenId } = resolveUAL(kcUAL);

        const receipt = await this.blockchainService.reviewKnowledgeCollection(
            {
                paranetKcStorageContract,
                paranetKcTokenId,
                paranetKaTokenId,
                kcStorageContract,
                kcTokenId,
                accepted,
            },
            blockchain,
        );

        return {
            kcUAL,
            paranetUAL,
            operation: receipt,
        };
    }

    /**
     * Checks if a Knowledge Collection is staged to a Paranet.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA that is created for Paranet.
     * @param {string} kcUAL - Universal Asset Locator of the KC to be checked.
     * @param {Object} [options={}] - Additional options for checking if a KC is staged.
     * @returns {Object} Object containing the Paranet UAL and operation receipt.
     * @example
     * await dkg.paranet.isKnowledgeCollectionStaged(paranetUAL, kcUAL);
     */
    async isKnowledgeCollectionStaged(kcUAL, paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetIsKnowledgeCollectionStaged(
            kcUAL,
            paranetUAL,
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const knowledgeCollectionId = getKnowledgeCollectionId(kcUAL);

        const isStagedToParanet = await this.blockchainService.isKnowledgeCollectionStaged(
            {
                paranetId,
                knowledgeCollectionId,
            },
            blockchain,
        );

        return {
            kcUAL,
            paranetUAL,
            isStagedToParanet,
        };
    }

    /**
     * Checks if a Knowledge Collection is approved to a Paranet.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA that is created for Paranet.
     * @param {string} kcUAL - Universal Asset Locator of the KC to be checked.
     * @param {Object} [options={}] - Additional options for checking if a KC is approved.
     * @returns {Object} Object containing the Paranet UAL and operation receipt.
     * @example
     * await dkg.paranet.isKnowledgeCollectionApproved(paranetUAL, kcUAL);
     */
    async isKnowledgeCollectionApproved(kcUAL, paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetIsKnowledgeCollectionApproved(
            kcUAL,
            paranetUAL,
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const knowledgeCollectionId = getKnowledgeCollectionId(kcUAL);

        const isApprovedToParanet = await this.blockchainService.isKnowledgeCollectionApproved(
            {
                paranetId,
                knowledgeCollectionId,
            },
            blockchain,
        );

        return {
            kcUAL,
            paranetUAL,
            isApprovedToParanet,
        };
    }

    /**
     * Gets the approval status of a Knowledge Collection to a Paranet.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA that is created for Paranet.
     * @param {string} kcUAL - Universal Asset Locator of the KC to be checked.
     * @param {Object} [options={}] - Additional options for checking if a KC is approved.
     * @returns {Object} Object containing the Paranet UAL and operation receipt.
     * @example
     * await dkg.paranet.getKnowledgeCollectionApprovalStatus(paranetUAL, kcUAL);
     */
    async getKnowledgeCollectionApprovalStatus(kcUAL, paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetGetKnowledgeCollectionApprovalStatus(
            kcUAL,
            paranetUAL,
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const knowledgeCollectionId = getKnowledgeCollectionId(kcUAL);

        const kcParanetApprovalStatus =
            await this.blockchainService.getKnowledgeCollectionApprovalStatus(
                {
                    paranetId,
                    knowledgeCollectionId,
                },
                blockchain,
            );

        return {
            kcUAL,
            paranetUAL,
            kcParanetApprovalStatus: PARANET_KNOWLEDGE_COLLECTION_STATUS[kcParanetApprovalStatus],
        };
    }

    /**
     * Adds nodes to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Array<number>} identityIds - List of node Identity IDs.
     * @param {Object} [options={}] - Additional options for adding curated nodes to a paranet.
     * @example
     * await dkg.paranet.addPermissionedNodes(UAL, identityIds: [1, 2]);
     */
    async addPermissionedNodes(paranetUAL, identityIds, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetaddPermissionedNodes(
            paranetUAL,
            blockchain,
            identityIds,
        );

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.addParanetPermissionedNodes(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                identityIds,
            },
            blockchain,
        );
    }

    /**
     * Removes nodes from a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Array<number>} identityIds - List of node Identity IDs to be removed.
     * @param {Object} [options={}] - Additional options for adding curated nodes to a paranet.
     * @example
     * await dkg.paranet.removePermissionedNodes(UAL, identityIds: [1, 2]);
     */
    async removePermissionedNodes(paranetUAL, identityIds, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetremovePermissionedNodes(
            paranetUAL,
            blockchain,
            identityIds,
        );

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.removeParanetPermissionedNodes(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                identityIds,
            },
            blockchain,
        );
    }

    /**
     * Request to become a node in a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @example
     * await dkg.paranet.requestParanetPermissionedNodeAccess(UAL);
     */
    async requestParanetPermissionedNodeAccess(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validaterequestParanetPermissionedNodeAccess(paranetUAL, blockchain);

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.requestParanetPermissionedNodeAccess(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
            },
            blockchain,
        );
    }

    /**
     * Approve a node's access request to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {number} identityId - Identity ID of the node which requested access.
     * @param {Object} [options={}] - Additional options for adding curated nodes to a paranet.
     * @example
     * await dkg.paranet.approvePermissionedNode(UAL, identityId: 1);
     */
    async approvePermissionedNode(paranetUAL, identityId, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateapprovePermissionedNode(paranetUAL, blockchain, identityId);

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.approvePermissionedNode(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                identityId,
            },
            blockchain,
        );
    }

    /**
     * Reject a node's access request to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {number} identityId - Identity ID of the node which requested access.
     * @param {Object} [options={}] - Additional options for adding curated nodes to a paranet.
     * @example
     * await dkg.paranet.rejectPermissionedNode(UAL, identityId: 1);
     */
    async rejectPermissionedNode(paranetUAL, identityId, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validaterejectPermissionedNode(paranetUAL, blockchain, identityId);

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.rejectPermissionedNode(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                identityId,
            },
            blockchain,
        );
    }

    /**
     * Get nodes of a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @returns {Array[number]} Array of nodes identity IDs.
     * @example
     * await dkg.paranet.getPermissionedNodes(UAL);
     */
    async getPermissionedNodes(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validategetPermissionedNodes(paranetUAL, blockchain);

        const paranetId = getParanetId(paranetUAL);

        const permissionedNodes = await this.blockchainService.getPermissionedNodes(
            { paranetId },
            blockchain,
        );

        return permissionedNodes;
    }

    /**
     * Adds miners to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Array<string>} minerAddresses - List of miner addresses to be added.
     * @param {Object} [options={}] - Additional options for adding curated nodes to a paranet.
     * @example
     * await dkg.paranet.addParanetPermissionedMiners(UAL, minerAddresses: [0xminerAddress1, 0xminerAddress2]);
     */
    async addParanetPermissionedMiners(paranetUAL, minerAddresses, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetaddParanetPermissionedMiners(
            paranetUAL,
            blockchain,
            minerAddresses,
        );

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.addParanetPermissionedMiners(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                minerAddresses,
            },
            blockchain,
        );
    }

    /**
     * Removes miners from a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Array<string>} minerAddresses - List of miner addresses to be removed.
     * @param {Object} [options={}] - Additional options for adding curated miners to a paranet.
     * @example
     * await dkg.paranet.removeParanetPermissionedMiners(UAL, identityIds: [1, 2]);
     */
    async removeParanetPermissionedMiners(paranetUAL, minerAddresses, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetremoveParanetPermissionedMiners(
            paranetUAL,
            blockchain,
            minerAddresses,
        );

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.removeParanetPermissionedMiners(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                minerAddresses,
            },
            blockchain,
        );
    }

    /**
     * Request to become a miner in a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @example
     * await dkg.paranet.requestParanetPermissionedMinerAccess(UAL);
     */
    async requestParanetPermissionedMinerAccess(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validaterequestParanetPermissionedMinerAccess(
            paranetUAL,
            blockchain,
        );

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.requestParanetPermissionedMinerAccess(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
            },
            blockchain,
        );
    }

    /**
     * Approve a miner's access request to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {string} minerAddress - Address of the miner which requested access.
     * @param {Object} [options={}] - Additional options for adding curated miners to a paranet.
     * @example
     * await dkg.paranet.approvePermissionedMiner(UAL, minerAddress: 1);
     */
    async approvePermissionedMiner(paranetUAL, minerAddress, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateapprovePermissionedMiner(
            paranetUAL,
            blockchain,
            minerAddress,
        );

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.approvePermissionedMiner(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                minerAddress,
            },
            blockchain,
        );
    }

    /**
     * Reject a miner's access request to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {string} minerAddress - Address of the miner which requested access.
     * @param {Object} [options={}] - Additional options for adding curated miners to a paranet.
     * @example
     * await dkg.paranet.rejectPermissionedMiner(UAL, minerAddress: 1);
     */
    async rejectPermissionedMiner(paranetUAL, minerAddress, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validaterejectPermissionedMiner(
            paranetUAL,
            blockchain,
            minerAddress,
        );

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.rejectPermissionedMiner(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                minerAddress,
            },
            blockchain,
        );
    }

    /**
     * Get miners of a paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @returns {Array[string]} Array of knowledge miners addresses.
     * @example
     * await dkg.paranet.getKnowledgeMiners(UAL);
     */
    async getKnowledgeMiners(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateGetParanetKnowledgeMiners(paranetUAL, blockchain);

        const paranetId = getParanetId(paranetUAL);

        const knowledgeMiners = await this.blockchainService.getKnowledgeMiners(
            { paranetId },
            blockchain,
        );

        return knowledgeMiners;
    }

    /**
     * Deploys an incentives contract for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for the incentives contract.
     * @param {string} options.tracToTokenEmissionMultiplier - How much incentive token is emissioned per 1 TRAC.
     * @param {string} options.operatorRewardPercentage - Percentage of the emissions as a paranet operator fee.
     * @param {string} options.incentivizationProposalVotersRewardPercentage - Percentage of the emissions that will be shared with NEURO holders supporting the proposal.
     * @returns {Object} Object containing the Paranet UAL and incentives pool contract address.
     * @example
     * await dkg.paranet.deployIncentivesContract('paranetUAL123', 'Neuroweb', {
     *     tracToTokenEmissionMultiplier: 1.5,
     *     operatorRewardPercentage: 20,
     *     incentivizationProposalVotersRewardPercentage: 10,
     * });
     */
    async deployIncentivesContract(paranetUAL, options = {}) {
        const {
            blockchain,
            tracToTokenEmissionMultiplier,
            operatorRewardPercentage,
            incentivizationProposalVotersRewardPercentage,
            incentivesPoolName,
            rewardTokenAddress,
        } = this.inputService.getParanetDeployIncentivesContractArguments(options);

        this.validationService.validateDeployIncentivesContract(
            paranetUAL,
            blockchain,
            tracToTokenEmissionMultiplier,
            operatorRewardPercentage,
            incentivizationProposalVotersRewardPercentage,
            incentivesPoolName,
            rewardTokenAddress,
        );

        const { contract: kcStorageContract, kcTokenId, kaTokenId } = resolveUAL(paranetUAL);

        if (!kaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const adjustedEmissionMultiplier = await this.blockchainService.adjustEmissionMultiplier(
            rewardTokenAddress,
            tracToTokenEmissionMultiplier,
            blockchain,
        );

        const receipt = await this.blockchainService.deployIncentivesPool(
            {
                kcStorageContract,
                kcTokenId,
                kaTokenId,
                tracToTokenEmissionMultiplier: adjustedEmissionMultiplier,
                operatorRewardPercentage,
                incentivizationProposalVotersRewardPercentage,
                incentivesPoolName,
                rewardTokenAddress,
            },
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const incentivesPoolAddress = await this.blockchainService.getIncentivesPoolAddress(
            paranetId,
            blockchain,
            {
                incentivesPoolName,
            },
        );

        return {
            paranetUAL,
            incentivesPoolContractAddress: incentivesPoolAddress,
            operation: receipt,
        };

        throw Error(`Unsupported incentive type: ${this.incentiveType}.`);
    }

    /**
     * Redeploys an incentives contract for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for the incentives contract.
     * @returns {Object} Object containing the Paranet UAL and incentives pool contract address.
     * @example
     * await dkg.paranet.redeployIncentivesContract('paranetUAL123');
     */
    async redeployIncentivesContract(paranetUAL, poolStorageAddress, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateRedeployIncentivesContract(
            paranetUAL,
            poolStorageAddress,
            blockchain,
        );

        const { contract, kcTokenId, kaTokenId } = resolveUAL(paranetUAL);

        if (!kaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const receipt = await this.blockchainService.redeployIncentivesPool(
            {
                contract,
                kcTokenId,
                kaTokenId,
                poolStorageAddress,
            },
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const incentivesPoolAddress = await this.blockchainService.getIncentivesPoolAddress(
            paranetId,
            blockchain,
            {
                incentivesPoolStorageAddress: poolStorageAddress,
            },
        );

        return {
            paranetUAL,
            incentivesPoolContractAddress: incentivesPoolAddress,
            operation: receipt,
        };
    }

    /**
     * Get all paranet incentives pools.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for the incentives contract.
     * @returns {Object} Object containing the Paranet UAL and incentives pool contract address.
     * @example
     * await dkg.paranet.getAllIncentivesPools('paranetUAL123');
     */
    async getAllIncentivesPools(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateGetAllIncentivesPools(paranetUAL, blockchain);

        const paranetId = getParanetId(paranetUAL);

        const incentivesPools = await this.blockchainService.getAllIncentivesPools(
            { paranetId },
            blockchain,
        );

        return { paranetUAL, incentivesPools };
    }

    /**
     * Get paranet incentives pool storage address.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for the incentives contract.
     * @returns {Object} Object containing the Paranet UAL and incentives pool storage address.
     * @example
     * await dkg.paranet.getIncentivesPoolStorageAddress('paranetUAL123');
     */
    async getIncentivesPoolStorageAddress(paranetUAL, options = {}) {
        const { blockchain, incentivesPoolName, incentivesPoolAddress } =
            this.inputService.getIncentivesPoolStorageAddressArguments(options);

        this.validationService.validateGetIncentivesPoolStorageAddress(
            paranetUAL,
            incentivesPoolName,
            incentivesPoolAddress,
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const incentivesPoolStorageAddress =
            await this.blockchainService.getIncentivesPoolStorageAddress(paranetId, blockchain, {
                incentivesPoolName,
                incentivesPoolAddress,
            });

        return { paranetUAL, incentivesPoolStorageAddress };
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
    async createService(serviceUAL, options = {}) {
        const {
            blockchain,
            paranetServiceName,
            paranetServiceDescription,
            paranetServiceAddresses,
        } = this.inputService.getParanetCreateServiceArguments(options);
        this.validationService.validateParanetCreateServiceArguments(
            serviceUAL,
            paranetServiceName,
            paranetServiceDescription,
            paranetServiceAddresses,
            blockchain,
        );

        const { contract: kcStorageContract, kcTokenId, kaTokenId } = resolveUAL(serviceUAL);

        if (!kaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const receipt = await this.blockchainService.registerParanetService(
            {
                kcStorageContract,
                kcTokenId,
                kaTokenId,
                paranetServiceName,
                paranetServiceDescription,
                paranetServiceAddresses,
            },
            blockchain,
        );

        return {
            serviceUAL,
            operation: receipt,
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
        const { contract: kcStorageContract, kcTokenId, kaTokenId } = resolveUAL(paranetUAL);
        if (!kaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const processedServicesArray = [];
        for (const serviceUAL of paranetServiceUALs) {
            const {
                contract: serviceContract,
                kcTokenId: serviceKCTokenId,
                kaTokenId: serviceKATokenId,
            } = resolveUAL(serviceUAL);
            processedServicesArray.push([serviceContract, serviceKCTokenId, serviceKATokenId]);
        }

        const receipt = await this.blockchainService.addParanetServices(
            {
                kcStorageContract,
                kcTokenId,
                kaTokenId,
                processedServicesArray,
            },
            blockchain,
        );

        return {
            paranetUAL,
            paranetServiceUALs,
            operation: receipt,
        };
    }

    /**
     * Claims miner reward for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {number} amount - Amount of reward to claim.
     * @param {Object} [options={}] - Additional options for claiming reward.
     * @returns {Object} Object containing the transaction hash and status.
     * @example
     * await dkg.paranet.claimMinerReward('paranetUAL123', 100);
     */
    async claimMinerReward(paranetUAL, amount, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const paranetId = getParanetId(paranetUAL);

        const receipt = await this.blockchainService.claimKnowledgeMinerReward(
            paranetId,
            amount,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
        );

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
     * await dkg.paranet.claimVoterReward('paranetUAL123', 100);
     */
    async claimVoterReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const paranetId = getParanetId(paranetUAL);

        const receipt = await this.blockchainService.claimVoterReward(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });
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
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const paranetId = getParanetId(paranetUAL);

        const receipt = await this.blockchainService.claimOperatorReward(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

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
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const paranetId = getParanetId(paranetUAL);

        const claimableValue = await this.blockchainService.getClaimableKnowledgeMinerReward(
            paranetId,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
        );

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
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const paranetId = getParanetId(paranetUAL);

        const claimableValue = await this.blockchainService.getClaimableAllKnowledgeMinersReward(
            paranetId,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
        );

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
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const paranetId = getParanetId(paranetUAL);

        const claimableValue = await this.blockchainService.getClaimableVoterReward(
            paranetId,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
        );

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
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const paranetId = getParanetId(paranetUAL);

        const claimableValue = await this.blockchainService.getClaimableAllVotersReward(
            paranetId,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
        );

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
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const paranetId = getParanetId(paranetUAL);

        const claimableValue = await this.blockchainService.getClaimableOperatorReward(
            paranetId,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
        );

        return claimableValue;
    }

    // /**
    //  * Updates claimable rewards for a Paranet.
    //  * @async
    //  * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
    //  * @param {Object} [options={}] - Additional options for updating rewards.
    //  * @returns {Object} Object containing transaction hash and status.
    //  * @example
    //  * await dkg.paranet.updateClaimableRewards(paranetUAL);
    //  */
    // async updateClaimableRewards(paranetUAL, options = {}) {
    //     const blockchain = this.inputService.getBlockchain(options);
    //     this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

    //     const { contract: kcStorageContract, kcTokenId, kaTokenId } = resolveUAL(paranetUAL);
    //     if (!kaTokenId) {
    //         throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
    //     }
    //     const paranetId = getParanetId(paranetUAL);

    //     const updatingKnowledgeAssetStates =
    //         await this.blockchainService.getUpdatingKnowledgeAssetStates(
    //             { miner: blockchain.publicKey, paranetId },
    //             blockchain,
    //         );
    //     if (updatingKnowledgeAssetStates.length > 0) {
    //         const receipt = await this.blockchainService.updateClaimableRewards(
    //             {
    //                 kcStorageContract,
    //                 kcTokenId,
    //                 kaTokenId,
    //                 start: 0,
    //                 end: updatingKnowledgeAssetStates.length,
    //             },
    //             blockchain,
    //         );

    //         return {
    //             operation: receipt,
    //             transactionHash: receipt.transactionHash,
    //             status: receipt.status,
    //         };
    //     }

    //     return {
    //         status: 'No updated knowledge assets.',
    //     };
    // }

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
        let { blockchain, roleAddress } = this.inputService.getParanetRoleCheckArguments(options);
        if (roleAddress == null) {
            roleAddress = blockchain.publicKey;
        }
        this.validationService.validateParanetRoleCheckArguments(
            roleAddress,
            paranetUAL,
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const isParanetKnowledgeMiner = await this.blockchainService.isParanetKnowledgeMiner(
            roleAddress,
            paranetId,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
        );

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
        // TODO: Add incentivesPoolName and incentivesPoolStorageAddress to the options
        let { blockchain, roleAddress } = this.inputService.getParanetRoleCheckArguments(options);
        if (roleAddress == null) {
            roleAddress = blockchain.publicKey;
        }
        this.validationService.validateParanetRoleCheckArguments(
            roleAddress,
            paranetUAL,
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const isParanetOperator = await this.blockchainService.isParanetOperator(
            roleAddress,
            paranetId,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
        );

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
        let { blockchain, roleAddress } = this.inputService.getParanetRoleCheckArguments(options);
        if (roleAddress == null) {
            roleAddress = blockchain.publicKey;
        }
        this.validationService.validateParanetRoleCheckArguments(
            roleAddress,
            paranetUAL,
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const isProposalVoter = await this.blockchainService.isParanetProposalVoter(
            roleAddress,
            paranetId,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
        );

        return isProposalVoter;
    }
}
