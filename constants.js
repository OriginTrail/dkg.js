/**
 * @constant {number} MAX_FILE_SIZE
 * - Max file size for publish
 */
export const MAX_FILE_SIZE = 2621440;

/**
 * @constant {number} DID_PREFIX
 * - DID prefix for graph database
 */
export const DID_PREFIX = 'did:dkg';

/**
 * @constant {object} PUBLISH_METHOD -
 *  Possible methods for publish
 */
export const PUBLISH_METHOD = {
    PUBLISH: 'publish',
    PROVISION: 'provision',
    UPDATE: 'update',
};

export const HOLDING_TIME_IN_YEARS = 2;
export const PUBLISH_TOKEN_AMOUNT = 15;
export const DEFAULT_BLOCKCHAIN = {
    blockchain: "polygon",
    blockchainConfig: {
        polygon: {
            "rpc" : "https://polygon.com",
            "contractAddress" : "0xF21dD87cFC5cF5D073398833AFe5EFC543b78a00",
        }
    }
};
export const AVAILABLE_BLOCKCHAINS = ["ethereum", "polygon"];
export const VISIBILITY = {
    "public" : 1,
    "private" : 0
};
export const DEFAULT_PUBLISH_VISIBILITY = VISIBILITY.public;
export const DEFAULT_COMMIT_OFFSET = 0;

export const OPERATIONS = {
    publish : "publish",
    get : "get",
    update : "update",
}

export const OPERATION_STATUSES = {
    pending: "PENDING",
    completed: "COMPLETED",
    failed: "FAILED",
};
