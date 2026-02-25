/**
 * Hardhat local blockchain setup for BDD tests.
 *
 * Currently provides mock-based blockchain service stubs since the full
 * DKG contract deployment (28+ contracts) requires compiled bytecode
 * from dkg-evm-module. When `npx hardhat compile` artifacts are
 * available, this module can be extended to start a real Hardhat node
 * and deploy contracts via ethers.js.
 *
 * To enable real Hardhat:
 *   1. Run `npm run compile-contracts` in the project root
 *   2. Set HARDHAT_TESTS=true in the environment
 *   3. This module will spawn a Hardhat node and deploy contracts
 */

import { ethers } from 'ethers';

const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const TEST_WALLET = new ethers.Wallet(TEST_PRIVATE_KEY);
const TEST_PUBLIC_KEY = TEST_WALLET.address;

const MOCK_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const MOCK_TX_HASH = '0x' + 'a'.repeat(64);

export function getTestBlockchainConfig() {
    return {
        name: 'hardhat1:31337',
        rpc: 'http://localhost:8545',
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
        endpoint: 'http://localhost',
        port: 8900,
        blockchain: {
            name: 'hardhat1:31337',
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
