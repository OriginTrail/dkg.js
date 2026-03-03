import {
    MOCK_CONTRACT_ADDRESS, MOCK_GAS_PRICE, MOCK_BALANCES, TEST_CHAIN_ID,
} from '../test-constants.js';
import { createMockReceipt } from '../hardhat-setup.js';
import { safeStub } from './stub-utils.js';

export function createBlockchainServiceStubs(blockchainService, overrides = {}) {
    const mockReceipt = createMockReceipt();

    const defaults = {
        getContractAddress: MOCK_CONTRACT_ADDRESS,
        callContractFunction: '0',
        executeContractFunction: mockReceipt,
        getChainId: TEST_CHAIN_ID,
        getGasPrice: MOCK_GAS_PRICE,
        getWalletBalances: MOCK_BALANCES,
        getWeb3Instance: {},
        getStakeWeightedAverageAsk: '1000000000',
        createKnowledgeCollection: { knowledgeCollectionId: 1, receipt: mockReceipt },
        transferAsset: mockReceipt,
        burnAsset: mockReceipt,
        getIdentityId: 1,
        keyIsOperationalWallet: true,
        registerParanet: mockReceipt,
        isKnowledgeCollectionRegistered: false,
        addCurator: mockReceipt,
        removeCurator: mockReceipt,
        stageKnowledgeCollection: mockReceipt,
        reviewKnowledgeCollection: mockReceipt,
        isKnowledgeCollectionStaged: false,
        isKnowledgeCollectionApproved: false,
        getKnowledgeCollectionApprovalStatus: 0,
        submitToParanet: mockReceipt,
        addParanetPermissionedNodes: mockReceipt,
        removeParanetPermissionedNodes: mockReceipt,
        requestParanetPermissionedNodeAccess: mockReceipt,
        approvePermissionedNode: mockReceipt,
        rejectPermissionedNode: mockReceipt,
        getPermissionedNodes: [],
        addParanetPermissionedMiners: mockReceipt,
        removeParanetPermissionedMiners: mockReceipt,
        requestParanetPermissionedMinerAccess: mockReceipt,
        approvePermissionedMiner: mockReceipt,
        rejectPermissionedMiner: mockReceipt,
        getKnowledgeMiners: [],
        deployIncentivesPool: mockReceipt,
        redeployIncentivesPool: mockReceipt,
        getIncentivesPoolAddress: MOCK_CONTRACT_ADDRESS,
        getAllIncentivesPools: [],
        getIncentivesPoolStorageAddress: MOCK_CONTRACT_ADDRESS,
        claimKnowledgeMinerReward: mockReceipt,
        claimVoterReward: mockReceipt,
        claimOperatorReward: mockReceipt,
        getClaimableKnowledgeMinerReward: 0,
        getClaimableAllKnowledgeMinersReward: 0,
        getClaimableVoterReward: 0,
        getClaimableAllVotersReward: 0,
        getClaimableOperatorReward: 0,
        registerParanetService: mockReceipt,
        addParanetServices: mockReceipt,
        isParanetKnowledgeMiner: false,
        isParanetOperator: false,
        isParanetProposalVoter: false,
        adjustEmissionMultiplier: 1000000000000n,
        createAsset: { tokenId: 1, receipt: mockReceipt },
        ensureBlockchainInfo: undefined,
    };

    const merged = { ...defaults, ...overrides };
    const stubs = {};

    for (const [method, value] of Object.entries(merged)) {
        stubs[method] = safeStub(blockchainService, method, value);
    }

    return stubs;
}
