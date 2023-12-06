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
        'otp::alphanet': {
            rpc: 'http://parachain-alphanet-02.origin-trail.network:9933',
            hubContract: '0x7585a99C5C150a08f5CDeFD16465C6De8D41EbbD',
        },
    },
    devnet: {
        'otp:2160': {
            rpc: 'https://lofar-tm-rpc.origin-trail.network',
            hubContract: '0x833048F6e6BEa78E0AAdedeCd2Dc2231dda443FB',
        },
        'gnosis:10200': {
            rpc: 'https://rpc.chiadochain.net',
            hubContract: '0xD2bA102A0b11944d00180eE8136208ccF87bC39A',
            gasPriceOracleLink: 'https://blockscout.chiadochain.net/api/v1/gas-price-oracle',
        },
    },
    testnet: {
        'otp:20430': {
            rpc: 'https://lofar-testnet.origin-trail.network',
            hubContract: '0xBbfF7Ea6b2Addc1f38A0798329e12C08f03750A6',
        },
        'gnosis:10200': {
            rpc: 'https://rpc.chiadochain.net',
            hubContract: '0xC06210312C9217A0EdF67453618F5eB96668679A',
            gasPriceOracleLink: 'https://blockscout.chiadochain.net/api/v1/gas-price-oracle',
        },
    },
    mainnet: {
        'otp:2043': {
            rpc: 'https://astrosat-parachain-rpc.origin-trail.network',
            hubContract: '0x5fA7916c48Fe6D5F1738d12Ad234b78c90B4cAdA',
        },
        'gnosis:100': {
            rpc: 'https://rpc.gnosischain.com/',
            hubContract: '',
            gasPriceOracleLink: 'https://api.gnosisscan.io/api?module=proxy&action=eth_gasPrice',
        },
    },
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
    UPDATE: 'update',
    LOCAL_STORE: 'local-store',
    QUERY: 'query',
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

const DEFAULT_PARAMETERS = {
    ENVIRONMENT: 'mainnet',
    PORT: 8900,
    FREQUENCY: 5,
    MAX_NUMBER_OF_RETRIES: 5,
    HASH_FUNCTION_ID: 1,
    SCORE_FUNCTION_ID: 1,
    IMMUTABLE: false,
    VALIDATE: true,
    OUTPUT_FORMAT: GET_OUTPUT_FORMATS.JSON_LD,
    STATE: ASSET_STATES.LATEST,
    CONTENT_TYPE: CONTENT_TYPES.PUBLIC,
    GRAPH_LOCATION: GRAPH_LOCATIONS.LOCAL_KG,
    GRAPH_STATE: GRAPH_STATES.CURRENT,
    HANDLE_NOT_MINED_ERROR: false,
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
    ASSET_STATES,
    STORE_TYPES,
    GRAPH_LOCATIONS,
    GRAPH_STATES,
    OT_NODE_TRIPLE_STORE_REPOSITORIES,
    QUERY_TYPES,
    OPERATIONS_STEP_STATUS,
    DEFAULT_GET_LOCAL_STORE_RESULT_FREQUENCY,
    DEFAULT_PARAMETERS,
};
