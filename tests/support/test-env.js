import * as defaults from './test-constants.js';

export const TEST_CHAIN_NAME = process.env.DKG_TEST_CHAIN_NAME || defaults.TEST_CHAIN_NAME;
export const TEST_CHAIN_ID = Number(process.env.DKG_TEST_CHAIN_ID) || defaults.TEST_CHAIN_ID;
export const TEST_ENDPOINT = process.env.DKG_TEST_ENDPOINT || defaults.TEST_ENDPOINT;
export const TEST_PORT = Number(process.env.DKG_TEST_NODE_PORT) || defaults.TEST_PORT;
export const TEST_RPC = process.env.DKG_TEST_RPC || defaults.TEST_RPC;

export {
    DEFAULT_EPOCHS_NUM,
    MOCK_GAS_PRICE,
    MOCK_BALANCES,
    MOCK_CONTRACT_ADDRESS,
    MOCK_TX_HASH,
    TEST_ADDRESSES,
    SPARQL_QUERIES,
    MOCK_SIGNATURE,
} from './test-constants.js';
