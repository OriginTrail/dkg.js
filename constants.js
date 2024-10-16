/**
 * @constant {number} MAX_FILE_SIZE
 * - Max file size for publish
 */
const MAX_FILE_SIZE = 2621440;

/**
 * @constant {number} DID_PREFIX
 * - DID prefix for graph database
 */
const DID_PREFIX = 'did:dkg';

const PRIVATE_ASSERTION_PREDICATE = 'https://ontology.origintrail.io/dkg/1.0#privateAssertionID';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const BLOCKCHAINS = {
    development: {
        'hardhat1:31337': {
            rpc: 'http://localhost:8545',
            hubContract: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        },
        'hardhat2:31337': {
            rpc: 'http://localhost:9545',
            hubContract: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        },
    },
    devnet: {},
    stabledevnet_staging: {
        'base:84532': {
            hubContract: '0xAB4A4794Fc1F415C24807B947280aCa8dC492238',
            rpc: 'https://sepolia.base.org',
        },
    },
    stabledevnet_prod: {
        'base:84532': {
            hubContract: '0xaA849CAC4FA86f6b7484503f3c7a314772AED6d4',
            rpc: 'https://sepolia.base.org',
        },
    },
    testnet: {
        // This is V8 TESTNET HUB don't use this for V6
        'base:84532': {
            hubContract: '0xCca0eA14540588A09c85cD6A6Fc53eA3A7010692',
            rpc: 'https://sepolia.base.org',
        },
    },
    mainnet: {},
};

const PARANET_NODES_ACCESS_POLICY = {
    OPEN: 0,
    CURATED: 1,
};

const PARANET_MINERS_ACCESS_POLICY = {
    OPEN: 0,
    CURATED: 1,
};

const INCENTIVE_TYPE = {
    NEUROWEB: 'Neuroweb',
};

const BLOCKCHAINS_RENAME_PAIRS = {
    hardhat1: 'hardhat1:31337',
    hardhat2: 'hardhat2:31337',
    'otp::devnet': 'otp:2160',
    'otp::testnet': 'otp:20430',
    'otp::mainnet': 'otp:2043',
};

const MAX_BLOCKCHAIN_CALL_RETRIES = 3;

const TRANSACTION_RETRY_ERRORS = [
    'transaction was not mined',
    'already known',
    'replacement transaction underpriced',
];

const WEBSOCKET_PROVIDER_OPTIONS = {
    reconnect: {
        auto: true,
        delay: 1000, // ms
        maxAttempts: 3,
    },
    clientConfig: {
        keepalive: true,
        keepaliveInterval: 30 * 1000, // ms
    },
};

const OPERATIONS = {
    PUBLISH: 'publish',
    GET: 'get',
    LOCAL_STORE: 'local-store',
    QUERY: 'query',
    PUBLISH_PARANET: 'publishParanet',
};

const OPERATION_STATUSES = {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
};

const ASSERTION_STATES = {
    LATEST: 'latest',
    LATEST_FINALIZED: 'latest_finalized',
};

const CONTENT_TYPES = {
    PUBLIC: 'public',
    PRIVATE: 'private',
    ALL: 'all',
};

const GET_OUTPUT_FORMATS = {
    N_QUADS: 'n-quads',
    JSON_LD: 'json-ld',
};

const ASSET_STATES = {
    LATEST: 'LATEST',
    FINALIZED: 'LATEST_FINALIZED',
};

const STORE_TYPES = {
    TRIPLE: 'TRIPLE',
    PENDING: 'PENDING',
};

const GRAPH_LOCATIONS = {
    PUBLIC_KG: 'PUBLIC_KG',
    LOCAL_KG: 'LOCAL_KG',
};

const GRAPH_STATES = {
    CURRENT: 'CURRENT',
    HISTORICAL: 'HISTORICAL',
};

const OT_NODE_TRIPLE_STORE_REPOSITORIES = {
    PUBLIC_CURRENT: 'publicCurrent',
    PUBLIC_HISTORY: 'publicHistory',
    PRIVATE_CURRENT: 'privateCurrent',
    PRIVATE_HISTORY: 'privateHistory',
};

const QUERY_TYPES = {
    CONSTRUCT: 'CONSTRUCT',
    SELECT: 'SELECT',
};

const OPERATIONS_STEP_STATUS = {
    INCREASE_ALLOWANCE_COMPLETED: 'INCREASE_ALLOWANCE_COMPLETED',
    CREATE_ASSET_COMPLETED: 'CREATE_ASSET_COMPLETED',
    NETWORK_PUBLISH_COMPLETED: 'NETWORK_PUBLISH_COMPLETED',
};

const DEFAULT_GET_LOCAL_STORE_RESULT_FREQUENCY = 0.5;

const DEFAULT_PROXIMITY_SCORE_FUNCTIONS_PAIR_IDS = {
    development: { 'hardhat1:31337': 2, 'hardhat2:31337': 2, 'otp:2043': 2 },
    devnet: {
        'otp:2160': 2,
        'gnosis:10200': 2,
        'base:84532': 2,
    },
    stabledevnet_staging: {
        'base:84532': 2,
    },
    stabledevnet_prod: {
        'base:84532': 2,
    },
    testnet: {
        'otp:20430': 2,
        'gnosis:10200': 2,
        'base:84532': 2,
    },
    mainnet: {
        'otp:2043': 2,
        'gnosis:100': 2,
        'base:8453': 2,
    },
};

const DEFAULT_NEUROWEB_FINALITY_PARAMETERS = {
    WAIT_NEUROWEB_TX_FINALIZATION: false,
    TX_FINALITY_POLLING_INTERVAL: 6_000,
    TX_FINALITY_MAX_WAIT_TIME: 60_000,
    TX_REMINING_POLLING_INTERVAL: 6_000,
    TX_REMINING_MAX_WAIT_TIME: 60_000,
};

const DEFAULT_PARAMETERS = {
    ENVIRONMENT: 'mainnet',
    PORT: 8900,
    FREQUENCY: 5,
    MAX_NUMBER_OF_RETRIES: 5,
    HASH_FUNCTION_ID: 1,
    IMMUTABLE: false,
    VALIDATE: true,
    OUTPUT_FORMAT: GET_OUTPUT_FORMATS.JSON_LD,
    STATE: ASSET_STATES.LATEST,
    CONTENT_TYPE: CONTENT_TYPES.PUBLIC,
    GRAPH_LOCATION: GRAPH_LOCATIONS.LOCAL_KG,
    GRAPH_STATE: GRAPH_STATES.CURRENT,
    HANDLE_NOT_MINED_ERROR: false,
    SIMULATE_TXS: false,
    FORCE_REPLACE_TXS: false,
    GAS_LIMIT_MULTIPLIER: 1,
};

const DEFAULT_GAS_PRICE = {
    GNOSIS: '20',
    OTP: '1',
};

const LOW_BID_SUGGESTION = 'low';
const MED_BID_SUGGESTION = 'med';
const HIGH_BID_SUGGESTION = 'high';
const ALL_BID_SUGGESTION = 'all';
const BID_SUGGESTION_RANGE_ENUM = [
    LOW_BID_SUGGESTION,
    MED_BID_SUGGESTION,
    HIGH_BID_SUGGESTION,
    ALL_BID_SUGGESTION,
];

const PARANET_KNOWLEDGE_ASSET_ACCESS_POLICY = {
    OPEN: 0,
};

module.exports = {
    MAX_FILE_SIZE,
    DID_PREFIX,
    PRIVATE_ASSERTION_PREDICATE,
    ZERO_ADDRESS,
    BLOCKCHAINS,
    BLOCKCHAINS_RENAME_PAIRS,
    MAX_BLOCKCHAIN_CALL_RETRIES,
    TRANSACTION_RETRY_ERRORS,
    WEBSOCKET_PROVIDER_OPTIONS,
    OPERATIONS,
    OPERATION_STATUSES,
    ASSERTION_STATES,
    CONTENT_TYPES,
    GET_OUTPUT_FORMATS,
    INCENTIVE_TYPE,
    ASSET_STATES,
    STORE_TYPES,
    GRAPH_LOCATIONS,
    GRAPH_STATES,
    OT_NODE_TRIPLE_STORE_REPOSITORIES,
    QUERY_TYPES,
    OPERATIONS_STEP_STATUS,
    DEFAULT_GET_LOCAL_STORE_RESULT_FREQUENCY,
    DEFAULT_PROXIMITY_SCORE_FUNCTIONS_PAIR_IDS,
    DEFAULT_NEUROWEB_FINALITY_PARAMETERS,
    DEFAULT_PARAMETERS,
    DEFAULT_GAS_PRICE,
    LOW_BID_SUGGESTION,
    MED_BID_SUGGESTION,
    HIGH_BID_SUGGESTION,
    ALL_BID_SUGGESTION,
    BID_SUGGESTION_RANGE_ENUM,
    PARANET_NODES_ACCESS_POLICY,
    PARANET_MINERS_ACCESS_POLICY,
    PARANET_KNOWLEDGE_ASSET_ACCESS_POLICY,
};
