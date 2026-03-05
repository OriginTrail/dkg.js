import { ethers } from 'ethers';
import {
    TEST_CHAIN_NAME, TEST_RPC, TEST_ENDPOINT, TEST_PORT,
    MOCK_CONTRACT_ADDRESS, MOCK_TX_HASH,
} from './test-env.js';

const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const TEST_WALLET = new ethers.Wallet(TEST_PRIVATE_KEY);
const TEST_PUBLIC_KEY = TEST_WALLET.address;

export function getTestBlockchainConfig() {
    return {
        name: TEST_CHAIN_NAME,
        rpc: TEST_RPC,
        hubContract: MOCK_CONTRACT_ADDRESS,
        publicKey: TEST_PUBLIC_KEY,
        privateKey: TEST_PRIVATE_KEY,
        gasLimitMultiplier: 1,
        handleNotMinedError: false,
        simulateTxs: false,
        forceReplaceTxs: false,
        gasMode: 'legacy',
    };
}

export function getTestDkgClientConfig() {
    return {
        endpoint: TEST_ENDPOINT,
        port: TEST_PORT,
        blockchain: {
            name: TEST_CHAIN_NAME,
            privateKey: TEST_PRIVATE_KEY,
        },
    };
}

export function createMockReceipt(overrides = {}) {
    return {
        transactionHash: MOCK_TX_HASH,
        status: true,
        blockNumber: 1,
        gasUsed: 21000n,
        ...overrides,
    };
}

export {
    TEST_PRIVATE_KEY,
    TEST_PUBLIC_KEY,
    MOCK_CONTRACT_ADDRESS,
    MOCK_TX_HASH,
};
