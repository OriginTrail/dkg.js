/**
 * @constant {number} MAX_FILE_SIZE
 * - Max file size for publish
 */
module.exports.MAX_FILE_SIZE = 2621440;

/**
 * @constant {number} DID_PREFIX
 * - DID prefix for graph database
 */
module.exports.DID_PREFIX = 'did:dkg';

module.exports.PRIVATE_ASSERTION_PREDICATE =
    'https://ontology.origintrail.io/dkg/1.0#privateAssertionID';

module.exports.BLOCKCHAINS = {
    ganache: {
        rpc: 'http://localhost:7545',
        hubContract: '0x209679fA3B658Cd0fC74473aF28243bfe78a9b12',
    },
    polygon: {
        rpc: 'https://matic-mumbai.chainstacklabs.com',
        hubContract: '0xdaa16AC171CfE8Df6F79C06E7EEAb2249E2C9Ec8', // TODO: change to Asset Contract
    },
    'otp::testnet': {
        rpc: 'https://lofar-testnet.origin-trail.network',
        hubContract: '0xBbfF7Ea6b2Addc1f38A0798329e12C08f03750A6',
    },
    'otp::mainnet': {
        rpc: 'https://astrosat-parachain-rpc.origin-trail.network',
        hubContract: '0x5fA7916c48Fe6D5F1738d12Ad234b78c90B4cAdA',
    },
};

module.exports.WEBSOCKET_PROVIDER_OPTIONS = {
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

module.exports.OPERATIONS = {
    PUBLISH: 'publish',
    GET: 'get',
    LOCAL_STORE: 'local-store',
    QUERY: 'query',
};

module.exports.OPERATION_STATUSES = {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
};

module.exports.ASSERTION_STATES = {
    LATEST: 'latest',
    LATEST_FINALIZED: 'latest_finalized',
};

module.exports.CONTENT_TYPES = {
    PUBLIC: 'public',
    PRIVATE: 'private',
    ALL: 'all',
};

module.exports.GET_OUTPUT_FORMATS = {
    N_QUADS: 'n-quads',
    JSON_LD: 'json-ld',
};

module.exports.ASSET_STATES = {
    LATEST: 'latest',
    FINALIZED: 'finalized',
};

module.exports.QUERY_TYPES = {
    CONSTRUCT: 'CONSTRUCT',
    SELECT: 'SELECT',
};

module.exports.OPERATIONS_STEP_STATUS = {
    INCREASE_ALLOWANCE_COMPLETED: 'INCREASE_ALLOWANCE_COMPLETED',
    CREATE_ASSET_COMPLETED: 'CREATE_ASSET_COMPLETED',
    NETWORK_PUBLISH_COMPLETED: 'NETWORK_PUBLISH_COMPLETED',
};

module.exports.DEFAULT_GET_LOCAL_STORE_RESULT_FREQUENCY = 0.5;
module.exports.DEFAULT_PARAMETERS = {
    PORT: 8900,
    FREQUENCY: 5,
    MAX_NUMBER_OF_RETRIES: 5,
    HASH_FUNCTION_ID: 1,
    SCORE_FUNCTION_ID: 1,
    IMMUTABLE: false,
    VALIDATE: true,
    OUTPUT_FORMAT: this.GET_OUTPUT_FORMATS.JSON_LD,
    STATE: this.ASSET_STATES.LATEST,
    CONTENT_TYPE: this.CONTENT_TYPES.PUBLIC,
};
