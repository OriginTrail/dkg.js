import sinon from 'sinon';
import { MOCK_CONTRACT_ADDRESS, createMockReceipt } from '../hardhat-setup.js';
import { safeStub } from './stub-utils.js';

export function createBlockchainServiceStubs(blockchainService) {
    const mockReceipt = createMockReceipt();

    return {
        getContractAddress: sinon
            .stub(blockchainService, 'getContractAddress')
            .resolves(MOCK_CONTRACT_ADDRESS),
        callContractFunction: sinon
            .stub(blockchainService, 'callContractFunction')
            .resolves('0'),
        executeContractFunction: sinon
            .stub(blockchainService, 'executeContractFunction')
            .resolves(mockReceipt),
        getChainId: sinon
            .stub(blockchainService, 'getChainId')
            .resolves(31337),
        getGasPrice: sinon
            .stub(blockchainService, 'getGasPrice')
            .resolves('20000000000'),
        getWalletBalances: sinon
            .stub(blockchainService, 'getWalletBalances')
            .resolves({ ethBalance: '10000000000000000000', tracBalance: '5000000000000000000000' }),
        getWeb3Instance: sinon
            .stub(blockchainService, 'getWeb3Instance')
            .resolves({}),
        getStakeWeightedAverageAsk: sinon
            .stub(blockchainService, 'getStakeWeightedAverageAsk')
            .resolves('1000000000'),
        createKnowledgeCollection: sinon
            .stub(blockchainService, 'createKnowledgeCollection')
            .resolves({ knowledgeCollectionId: 1, receipt: mockReceipt }),
        transferAsset: sinon
            .stub(blockchainService, 'transferAsset')
            .resolves(mockReceipt),
        burnAsset: sinon
            .stub(blockchainService, 'burnAsset')
            .resolves(mockReceipt),
        getIdentityId: sinon
            .stub(blockchainService, 'getIdentityId')
            .resolves(1),
        keyIsOperationalWallet: sinon
            .stub(blockchainService, 'keyIsOperationalWallet')
            .resolves(true),
        registerParanet: sinon
            .stub(blockchainService, 'registerParanet')
            .resolves(mockReceipt),
        isKnowledgeCollectionRegistered: sinon
            .stub(blockchainService, 'isKnowledgeCollectionRegistered')
            .resolves(false),
        addCurator: sinon
            .stub(blockchainService, 'addCurator')
            .resolves(mockReceipt),
        removeCurator: sinon
            .stub(blockchainService, 'removeCurator')
            .resolves(mockReceipt),
        stageKnowledgeCollection: sinon
            .stub(blockchainService, 'stageKnowledgeCollection')
            .resolves(mockReceipt),
        reviewKnowledgeCollection: sinon
            .stub(blockchainService, 'reviewKnowledgeCollection')
            .resolves(mockReceipt),
        isKnowledgeCollectionStaged: sinon
            .stub(blockchainService, 'isKnowledgeCollectionStaged')
            .resolves(false),
        isKnowledgeCollectionApproved: sinon
            .stub(blockchainService, 'isKnowledgeCollectionApproved')
            .resolves(false),
        getKnowledgeCollectionApprovalStatus: sinon
            .stub(blockchainService, 'getKnowledgeCollectionApprovalStatus')
            .resolves(0),
        submitToParanet: sinon
            .stub(blockchainService, 'submitToParanet')
            .resolves(mockReceipt),
        addParanetPermissionedNodes: sinon
            .stub(blockchainService, 'addParanetPermissionedNodes')
            .resolves(mockReceipt),
        removeParanetPermissionedNodes: sinon
            .stub(blockchainService, 'removeParanetPermissionedNodes')
            .resolves(mockReceipt),
        requestParanetPermissionedNodeAccess: sinon
            .stub(blockchainService, 'requestParanetPermissionedNodeAccess')
            .resolves(mockReceipt),
        approvePermissionedNode: sinon
            .stub(blockchainService, 'approvePermissionedNode')
            .resolves(mockReceipt),
        rejectPermissionedNode: sinon
            .stub(blockchainService, 'rejectPermissionedNode')
            .resolves(mockReceipt),
        getPermissionedNodes: sinon
            .stub(blockchainService, 'getPermissionedNodes')
            .resolves([]),
        addParanetPermissionedMiners: sinon
            .stub(blockchainService, 'addParanetPermissionedMiners')
            .resolves(mockReceipt),
        removeParanetPermissionedMiners: sinon
            .stub(blockchainService, 'removeParanetPermissionedMiners')
            .resolves(mockReceipt),
        requestParanetPermissionedMinerAccess: sinon
            .stub(blockchainService, 'requestParanetPermissionedMinerAccess')
            .resolves(mockReceipt),
        approvePermissionedMiner: sinon
            .stub(blockchainService, 'approvePermissionedMiner')
            .resolves(mockReceipt),
        rejectPermissionedMiner: sinon
            .stub(blockchainService, 'rejectPermissionedMiner')
            .resolves(mockReceipt),
        getKnowledgeMiners: sinon
            .stub(blockchainService, 'getKnowledgeMiners')
            .resolves([]),
        deployIncentivesPool: sinon
            .stub(blockchainService, 'deployIncentivesPool')
            .resolves(mockReceipt),
        redeployIncentivesPool: sinon
            .stub(blockchainService, 'redeployIncentivesPool')
            .resolves(mockReceipt),
        getIncentivesPoolAddress: sinon
            .stub(blockchainService, 'getIncentivesPoolAddress')
            .resolves(MOCK_CONTRACT_ADDRESS),
        getAllIncentivesPools: sinon
            .stub(blockchainService, 'getAllIncentivesPools')
            .resolves([]),
        getIncentivesPoolStorageAddress: sinon
            .stub(blockchainService, 'getIncentivesPoolStorageAddress')
            .resolves(MOCK_CONTRACT_ADDRESS),
        claimKnowledgeMinerReward: sinon
            .stub(blockchainService, 'claimKnowledgeMinerReward')
            .resolves(mockReceipt),
        claimVoterReward: sinon
            .stub(blockchainService, 'claimVoterReward')
            .resolves(mockReceipt),
        claimOperatorReward: sinon
            .stub(blockchainService, 'claimOperatorReward')
            .resolves(mockReceipt),
        getClaimableKnowledgeMinerReward: sinon
            .stub(blockchainService, 'getClaimableKnowledgeMinerReward')
            .resolves(0),
        getClaimableAllKnowledgeMinersReward: sinon
            .stub(blockchainService, 'getClaimableAllKnowledgeMinersReward')
            .resolves(0),
        getClaimableVoterReward: sinon
            .stub(blockchainService, 'getClaimableVoterReward')
            .resolves(0),
        getClaimableAllVotersReward: sinon
            .stub(blockchainService, 'getClaimableAllVotersReward')
            .resolves(0),
        getClaimableOperatorReward: sinon
            .stub(blockchainService, 'getClaimableOperatorReward')
            .resolves(0),
        registerParanetService: sinon
            .stub(blockchainService, 'registerParanetService')
            .resolves(mockReceipt),
        addParanetServices: sinon
            .stub(blockchainService, 'addParanetServices')
            .resolves(mockReceipt),
        isParanetKnowledgeMiner: sinon
            .stub(blockchainService, 'isParanetKnowledgeMiner')
            .resolves(false),
        isParanetOperator: sinon
            .stub(blockchainService, 'isParanetOperator')
            .resolves(false),
        isParanetProposalVoter: sinon
            .stub(blockchainService, 'isParanetProposalVoter')
            .resolves(false),
        adjustEmissionMultiplier: sinon
            .stub(blockchainService, 'adjustEmissionMultiplier')
            .resolves(1000000000000n),
        createAsset: safeStub(blockchainService, 'createAsset', { tokenId: 1, receipt: mockReceipt }),
        ensureBlockchainInfo: sinon
            .stub(blockchainService, 'ensureBlockchainInfo')
            .resolves(),
    };
}
