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
    'https://origintrail.io/ontology#privateAssertionHash';

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

module.exports.PUBLISH_TRIPLES_NUMBER = 10;
module.exports.PUBLISH_CHUNKS_NUMBER = 10;
module.exports.PUBLISH_EPOCHS_NUM = 5;
module.exports.PUBLISH_TOKEN_AMOUNT = 15;
module.exports.DEFAULT_HASH_FUNCTION_ID = 1;
module.exports.DEFAULT_GET_OPERATION_RESULT_FREQUENCY = 5;
module.exports.DEFAULT_GET_OPERATION_RESULT_MAX_NUM_RETRIES = 5;
module.exports.DEFAULT_GET_LOCAL_STORE_RESULT_FREQUENCY = 0.5;

module.exports.OPERATIONS = {
    PUBLISH: 'publish',
    GET: 'get',
    LOCAL_STORE: 'local-store',
};

module.exports.OPERATION_STATUSES = {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
};

module.exports.GET_OUTPUT_FORMATS = {
    N_QUADS: 'n-quads',
    JSON_LD: 'json-ld',
};

module.exports.OPERATIONS_STEP_STATUS = {
    INCREASE_ALLOWANCE_COMPLETED: 'INCREASE_ALLOWANCE_COMPLETED',
    CREATE_ASSET_COMPLETED: 'CREATE_ASSET_COMPLETED',
    NETWORK_PUBLISH_COMPLETED: 'NETWORK_PUBLISH_COMPLETED',
};
