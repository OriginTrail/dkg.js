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

export const BLOCKCHAIN_IDS = {
    HARDHAT_1: 'hardhat1:31337',
    HARDHAT_2: 'hardhat2:31337',
    BASE_TESTNET: 'base:84532',
    GNOSIS_TESTNET: 'gnosis:10200',
    NEUROWEB_TESTNET: 'otp:20430',
    BASE_MAINNET: 'base:8453',
    GNOSIS_MAINNET: 'gnosis:100',
    NEUROWEB_MAINNET: 'otp:2043',
};
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
    testnet: {
        'base:84532': {
            hubContract: '0xf21CE8f8b01548D97DCFb36869f1ccB0814a4e05',
            rpc: 'https://sepolia.base.org',
        },
        'otp:20430': {
            hubContract: '0xe233b5b78853a62b1e11ebe88bf083e25b0a57a6',
            rpc: 'https://lofar-testnet.origin-trail.network',
        },
        'gnosis:10200': {
            hubContract: '0x2c08AC4B630c009F709521e56Ac385A6af70650f',
            rpc: 'https://rpc.chiadochain.net',
            gasPriceOracleLink: 'https://blockscout.chiadochain.net/api/v1/gas-price-oracle',
        },
    },
    mainnet: {
        'base:8453': {
            hubContract: '0x99Aa571fD5e681c2D27ee08A7b7989DB02541d13',
            rpc: 'https://mainnet.base.org',
        },
        'otp:2043': {
            hubContract: '0x0957e25BD33034948abc28204ddA54b6E1142D6F',
            rpc: 'https://astrosat-parachain-rpc.origin-trail.network',
        },
        'gnosis:100': {
            hubContract: '0x882D0BF07F956b1b94BBfe9E77F47c6fc7D4EC8f',
            rpc: 'https://rpc.gnosischain.com/',
            gasPriceOracleLink: 'https://blockscout.com/xdai/mainnet/api/v1/gas-price-oracle',
        },
    },
};

export const PARANET_NODES_ACCESS_POLICY = {
    OPEN: 0,
    PERMISSIONED: 1,
};

export const PARANET_MINERS_ACCESS_POLICY = {
    OPEN: 0,
    PERMISSIONED: 1,
};

export const PARANET_KC_SUBMISSION_POLICY = {
    OPEN: 0,
    STAGING: 1,
};

export const PARANET_KNOWLEDGE_COLLECTION_STATUS = {
    0: 'NONE',
    1: 'PENDING',
    2: 'APPROVED',
    3: 'REJECTED',
};

export const INCENTIVE_MULTIPLIER = {
    Neuroweb: 10n ** 12n,
    NeurowebERC20: 10n ** 18n,
};

export const NEUROWEB_INCENTIVE_TYPE_CHAINS = [
    BLOCKCHAIN_IDS.NEUROWEB_TESTNET,
    BLOCKCHAIN_IDS.NEUROWEB_MAINNET,
    BLOCKCHAIN_IDS.HARDHAT_1,
    BLOCKCHAIN_IDS.HARDHAT_2,
];

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

export const CONTENT_TYPES = {
    PRIVATE: 'private',
    PUBLIC: 'public',
    ALL: 'all',
};

export const GET_OUTPUT_FORMATS = {
    N_QUADS: 'n-quads',
    JSON_LD: 'json-ld',
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

export const DEFAULT_PROXIMITY_SCORE_FUNCTIONS_PAIR_IDS = {
    development: { 'hardhat1:31337': 2, 'hardhat2:31337': 2, 'otp:2043': 2 },
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
    GNOSIS: '1.5',
    OTP: '0.001',
    BASE: '0.086',
};

export const DEFAULT_GAS_PRICE_WEI = {
    GNOSIS: '6000000000',
};

export const PARANET_KNOWLEDGE_ASSET_ACCESS_POLICY = {
    OPEN: 0,
};

export const CHUNK_BYTE_SIZE = 32;
