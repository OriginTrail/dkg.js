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

/**
 * @constant {object} PUBLISH_METHOD -
 *  Possible methods for publish
 */
const PUBLISH_METHOD = {
    PUBLISH: 'publish',
    PROVISION: 'provision',
    UPDATE: 'update',
};

const BLOCKCHAINS = {
    "ethereum" : {
        "rpc": "http://localhost:7545",
        "hubContract": "0xF21dD87cFC5cF5D073398833AFe5EFC543b78a00"
    }
}

const HOLDING_TIME_IN_YEARS = 2;
const PUBLISH_TOKEN_AMOUNT = 15;

const AVAILABLE_BLOCKCHAINS = ["ethereum", "polygon"];
const VISIBILITY = {
    "public" : 1,
    "private" : 0
};
const DEFAULT_PUBLISH_VISIBILITY = VISIBILITY.public;
const DEFAULT_COMMIT_OFFSET = 0;

const OPERATIONS = {
    publish : "publish",
    get : "get",
    update : "update",
}

const OPERATION_STATUSES = {
    pending: "PENDING",
    completed: "COMPLETED",
    failed: "FAILED",
};

module.exports = { MAX_FILE_SIZE, OPERATIONS, OPERATION_STATUSES, DEFAULT_COMMIT_OFFSET, DEFAULT_PUBLISH_VISIBILITY, AVAILABLE_BLOCKCHAINS, HOLDING_TIME_IN_YEARS, PUBLISH_TOKEN_AMOUNT, DID_PREFIX, VISIBILITY, BLOCKCHAINS };
