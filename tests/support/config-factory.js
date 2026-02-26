import { getTestDkgClientConfig, TEST_PRIVATE_KEY } from './hardhat-setup.js';

export function makeClientConfig(overrides = {}) {
    const base = getTestDkgClientConfig();
    return {
        ...base,
        ...overrides,
        blockchain: { ...base.blockchain, ...overrides.blockchain },
    };
}

export { TEST_PRIVATE_KEY };
