import { MOCK_CONTRACT_ADDRESS, TEST_CHAIN_NAME } from './test-env.js';

const BASE_CONTRACT = MOCK_CONTRACT_ADDRESS.toLowerCase();

export function makeKCUAL({ kcTokenId = 1 } = {}) {
    return `did:dkg:${TEST_CHAIN_NAME}/${BASE_CONTRACT}/${kcTokenId}`;
}

export function makeKAUAL({ kcTokenId = 1, kaTokenId = 1 } = {}) {
    return `did:dkg:${TEST_CHAIN_NAME}/${BASE_CONTRACT}/${kcTokenId}/${kaTokenId}`;
}

export function makeParanetUAL({ kcTokenId = 1, kaTokenId = 1 } = {}) {
    return makeKAUAL({ kcTokenId, kaTokenId });
}

export function makeServiceUAL({ kcTokenId = 3, kaTokenId = 1 } = {}) {
    return makeKAUAL({ kcTokenId, kaTokenId });
}
