/**
 * @constant {number} MAX_FILE_SIZE
 * - Max file size for publish
 */
export const MAX_FILE_SIZE = 10000000;

/**
 * @constant {number} DID_PREFIX
 * - DID prefix for graph database
 */
export const DID_PREFIX = 'did:dkg';

export const PRIVATE_ASSERTION_PREDICATE =
    'https://ontology.origintrail.io/dkg/1.0#privateMerkleRoot';

export const PRIVATE_RESOURCE_PREDICATE =
    'https://ontology.origintrail.io/dkg/1.0#representsPrivateResource';

export const PRIVATE_HASH_SUBJECT_PREFIX = 'https://ontology.origintrail.io/dkg/1.0#metadata-hash:';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const LABEL_PREFIX = '<http://example.org/label>';

export const BLOCKCHAINS = {
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
    devnet: {
        'base:84532': {
            hubContract: '0x3e5dd82e7529F4e55AA64893D8f8879AE14BF87D',
            rpc: 'https://sepolia.base.org',
        },
    },
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

export const PARANET_NODES_ACCESS_POLICY = {
    OPEN: 0,
    CURATED: 1,
};

export const PARANET_MINERS_ACCESS_POLICY = {
    OPEN: 0,
    CURATED: 1,
};

export const INCENTIVE_TYPE = {
    NEUROWEB: 'Neuroweb',
};

export const BLOCKCHAINS_RENAME_PAIRS = {
    hardhat1: 'hardhat1:31337',
    hardhat2: 'hardhat2:31337',
    'otp::devnet': 'otp:2160',
    'otp::testnet': 'otp:20430',
    'otp::mainnet': 'otp:2043',
};

export const MAX_BLOCKCHAIN_CALL_RETRIES = 3;

export const TRANSACTION_RETRY_ERRORS = [
    'transaction was not mined',
    'already known',
    'replacement transaction underpriced',
];

export const WEBSOCKET_PROVIDER_OPTIONS = {
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

export const OPERATIONS = {
    PUBLISH: 'publish',
    GET: 'get',
    LOCAL_STORE: 'local-store',
    QUERY: 'query',
    PUBLISH_PARANET: 'publishParanet',
    FINALITY: 'finality',
};

export const OPERATION_STATUSES = {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
};

export const OPERATION_DELAYS = {
    FINALITY: 5000,
};

export const ASSERTION_STATES = {
    LATEST: 'latest',
    LATEST_FINALIZED: 'latest_finalized',
};

export const CONTENT_TYPES = {
    PRIVATE: 'private',
    PUBLIC: 'public',
    ALL: 'all',
};

export const GET_OUTPUT_FORMATS = {
    N_QUADS: 'n-quads',
    JSON_LD: 'json-ld',
};

export const STORE_TYPES = {
    TRIPLE: 'TRIPLE',
    TRIPLE_PARANET: 'TRIPLE_PARANET',
    PENDING: 'PENDING',
};

export const GRAPH_LOCATIONS = {
    PUBLIC_KG: 'PUBLIC_KG',
    LOCAL_KG: 'LOCAL_KG',
};

export const GRAPH_STATES = {
    CURRENT: 'CURRENT',
    HISTORICAL: 'HISTORICAL',
};

export const OT_NODE_TRIPLE_STORE_REPOSITORIES = {
    PUBLIC_CURRENT: 'publicCurrent',
    PUBLIC_HISTORY: 'publicHistory',
    PRIVATE_CURRENT: 'privateCurrent',
    PRIVATE_HISTORY: 'privateHistory',
};

export const QUERY_TYPES = {
    CONSTRUCT: 'CONSTRUCT',
    SELECT: 'SELECT',
};

export const OPERATIONS_STEP_STATUS = {
    INCREASE_ALLOWANCE_COMPLETED: 'INCREASE_ALLOWANCE_COMPLETED',
    CREATE_ASSET_COMPLETED: 'CREATE_ASSET_COMPLETED',
    NETWORK_PUBLISH_COMPLETED: 'NETWORK_PUBLISH_COMPLETED',
};

export const DEFAULT_GET_LOCAL_STORE_RESULT_FREQUENCY = 0.5;

export const DEFAULT_PROXIMITY_SCORE_FUNCTIONS_PAIR_IDS = {
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

export const DEFAULT_NEUROWEB_FINALITY_PARAMETERS = {
    WAIT_NEUROWEB_TX_FINALIZATION: false,
    TX_FINALITY_POLLING_INTERVAL: 6_000,
    TX_FINALITY_MAX_WAIT_TIME: 60_000,
    TX_REMINING_POLLING_INTERVAL: 6_000,
    TX_REMINING_MAX_WAIT_TIME: 60_000,
};

export const DEFAULT_PARAMETERS = {
    ENVIRONMENT: 'mainnet',
    PORT: 8900,
    FREQUENCY: 5,
    MAX_NUMBER_OF_RETRIES: 5,
    HASH_FUNCTION_ID: 1,
    IMMUTABLE: false,
    VALIDATE: true,
    OUTPUT_FORMAT: GET_OUTPUT_FORMATS.JSON_LD,
    STATE: null,
    INCLUDE_METADATA: false,
    CONTENT_TYPE: CONTENT_TYPES.PUBLIC,
    GRAPH_LOCATION: GRAPH_LOCATIONS.LOCAL_KG,
    GRAPH_STATE: GRAPH_STATES.CURRENT,
    HANDLE_NOT_MINED_ERROR: false,
    SIMULATE_TXS: false,
    FORCE_REPLACE_TXS: false,
    GAS_LIMIT_MULTIPLIER: 1,
};

export const DEFAULT_GAS_PRICE = {
    GNOSIS: '20',
    OTP: '1',
};

export const LOW_BID_SUGGESTION = 'low';
export const MED_BID_SUGGESTION = 'med';
export const HIGH_BID_SUGGESTION = 'high';
export const ALL_BID_SUGGESTION = 'all';
export const BID_SUGGESTION_RANGE_ENUM = [
    LOW_BID_SUGGESTION,
    MED_BID_SUGGESTION,
    HIGH_BID_SUGGESTION,
    ALL_BID_SUGGESTION,
];

export const PARANET_KNOWLEDGE_ASSET_ACCESS_POLICY = {
    OPEN: 0,
};

export const CHUNK_BYTE_SIZE = 32;
