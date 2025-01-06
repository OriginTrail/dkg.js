'use strict';

var assertionTools = require('assertion-tools');
var ethers = require('ethers');
var jsonld = require('jsonld');
var axios = require('axios');
var Web3 = require('web3');
var module$1 = require('module');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
/**
 * @constant {number} MAX_FILE_SIZE
 * - Max file size for publish
 */
const MAX_FILE_SIZE = 10000000;

const PRIVATE_ASSERTION_PREDICATE =
    'https://ontology.origintrail.io/dkg/1.0#privateMerkleRoot';

const PRIVATE_RESOURCE_PREDICATE =
    'https://ontology.origintrail.io/dkg/1.0#representsPrivateResource';

const PRIVATE_HASH_SUBJECT_PREFIX = 'https://ontology.origintrail.io/dkg/1.0#metadata-hash:';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const LABEL_PREFIX = '<http://example.org/label>';

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
    devnet: {
        'base:84532': {
            hubContract: '0xE043daF4cC8ae2c720ef95fc82574a37a429c40A',
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
        'base:84532': {
            hubContract: '0xf21CE8f8b01548D97DCFb36869f1ccB0814a4e05',
            rpc: 'https://sepolia.base.org',
        },
        'otp:20430': {
            hubContract: '0xd7d073b560412c6A7F33dD670d323D01061E5DEb',
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
    FINALITY: 'finality',
};

const OPERATION_STATUSES = {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
};

const CONTENT_TYPES = {
    PRIVATE: 'private',
    PUBLIC: 'public',
    ALL: 'all',
};

const GET_OUTPUT_FORMATS = {
    N_QUADS: 'n-quads',
    JSON_LD: 'json-ld',
};

const GRAPH_LOCATIONS = {
    PUBLIC_KG: 'PUBLIC_KG',
    LOCAL_KG: 'LOCAL_KG',
};

const GRAPH_STATES = {
    CURRENT: 'CURRENT',
    HISTORICAL: 'HISTORICAL',
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

const DEFAULT_GAS_PRICE = {
    GNOSIS: '6',
    OTP: '0.001',
    BASE: '0.086',
};

const DEFAULT_GAS_PRICE_WEI = {
    GNOSIS: '6000000000',
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

const CHUNK_BYTE_SIZE = 32;

class AssertionOperationsManager {
    constructor(services) {
        this.nodeApiService = services.nodeApiService;
        this.inputService = services.inputService;
        this.validationService = services.validationService;
    }

    /**
     * Formats the content provided, producing both a public and, if available, a private assertion.
     *
     * @param {Object} content - The content object containing optional public and private properties.
     * @returns {Promise<Object>} a promise that resolves with an object containing the
     * formatted public assertion and, if available, the private assertion.
     */
    async formatGraph(content) {
        return assertionTools.kaTools.formatGraph(content);
    }

    /**
     * Calculates and returns the Merkle root of the public assertion from the provided content.
     *
     * @param {Object} content - The content object containing optional public and private properties.
     * @returns {Promise<String>} a promise that resolves with a string representing the
     * Merkle root of the formatted public assertion.
     */
    async getPublicAssertionId(content) {
        const assertions = await assertionTools.kaTools.formatGraph(content);
        return assertionTools.kcTools.calculateMerkleRoot(assertions.public);
    }

    /**
     * Calculates and returns the size in bytes of the public assertion from the provided content.
     *
     * @param {Object} content - The content object containing optional public and private properties.
     * @returns {Promise<Number>} a promise that resolves with a number representing the
     * size in bytes of the formatted public assertion.
     */
    async getSizeInBytes(content) {
        const assertions = await assertionTools.kaTools.formatGraph(content);
        return assertionTools.kcTools.getSizeInBytes(assertions.public);
    }

    /**
     * Calculates and returns the number of triples of the public assertion from the provided content.
     *
     * @param {Object} content - The content object containing optional public and private properties.
     * @returns {Promise<Number>} a promise that resolves with a number representing the
     * number of triples of the formatted public assertion.
     */
    async getTriplesNumber(content) {
        const assertions = await assertionTools.kaTools.formatGraph(content);
        return assertionTools.kaTools.getTriplesNumber(assertions.public);
    }

    /**
     * Calculates and returns the number of chunks of the public assertion from the provided content.
     *
     * @param {Object} content - The content object containing optional public and private properties.
     * @returns {Promise<Number>} a promise that resolves with a number representing the
     * number of chunks of the formatted public assertion.
     */
    async getChunksNumber(content) {
        const assertions = await assertionTools.kaTools.formatGraph(content);
        return assertionTools.kcTools.calculateNumberOfChunks(assertions.public);
    }

    /**
     * Adds labels to the public assertion based on provided conditions.
     *
     * @param {Object} content - The content object in JSONLD or NQUADS format.
     * @param {Array} conditions - An array of condition-label pairs. Each condition is a function that
     * tests if the triple should be labeled.
     * @returns {Promise<Object>} - Return the N-Quads formatted string
     */
    async addLabels(content, conditions) {
        this.validationService.validateJsonldOrNquads(content);
        this.validationService.validateConditions(conditions);

        const assertions = await assertionTools.kcTools.formatDataset(content);

        const resultAssertions = [];

        assertions.forEach((tripleStr) => {
            const match = tripleStr.match(/<([^>]+)> <([^>]+)> ([^\.]+) \./);
            if (!match) {
                throw new Error(`Invalid N-Quad format: ${tripleStr}`);
            }

            const subject = match[1];
            const predicate = match[2];
            let object = match[3].trim();

            if (object.startsWith('"') && object.endsWith('"')) {
                object = `"${object.slice(1, -1)}"`;
            } else {
                object = `${object}`;
            }

            resultAssertions.push(`<${subject}> <${predicate}> ${object} .`);

            conditions.forEach((condition) => {
                if (condition.condition === true) {
                    const labelTriple = `<<<${subject}> <${predicate}> ${object}>> ${LABEL_PREFIX} <${condition.label}> .`;
                    resultAssertions.push(labelTriple);
                } else if (condition.condition({ subject, predicate, object })) {
                        const labelTriple = `<<<${subject}> <${predicate}> ${object}>> ${LABEL_PREFIX} <${condition.label}> .`;
                        resultAssertions.push(labelTriple);
                    }
            });
        });
        return resultAssertions;
    }
}

function nodeSupported() {
    return typeof window === 'undefined';
}

function deriveUAL(blockchain, contract, tokenId) {
    return `did:dkg:${blockchain.toLowerCase()}/${contract.toLowerCase()}/${tokenId}`;
}

function resolveUAL(ual) {
    const segments = ual.split(':');
    const argsString = segments.length === 3 ? segments[2] : `${segments[2]}:${segments[3]}`;
    const args = argsString.split('/');

    if (args.length !== 3) {
        throw new Error(`UAL doesn't have correct format: ${ual}`);
    }

    return {
        blockchain: args[0],
        contract: args[1],
        tokenId: parseInt(args[2], 10),
    };
}

async function sleepForMilliseconds(milliseconds) {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((r) => setTimeout(r, milliseconds));
}

function getOperationStatusObject(operationResult, operationId) {
    const operationData = operationResult.data?.errorType
        ? { status: operationResult.status, ...operationResult.data }
        : { status: operationResult.status };

    return {
        operationId,
        ...operationData,
    };
}

async function toNQuads(content, inputFormat) {
    const options = {
        algorithm: 'URDNA2015',
        format: 'application/n-quads',
    };

    {
        options.inputFormat = inputFormat;
    }

    const canonized = await jsonld.canonize(content, options);

    return canonized.split('\n').filter((x) => x !== '');
}

async function  toJSONLD(nquads) {
    return jsonld.fromRDF(nquads, {
        algorithm: 'URDNA2015',
        format: 'application/n-quads',
    });
}

/**
 * Empty hooks are used as a fallback hooks
 * in case user doesn't provide his own implementation
 * @type {{emptyHooks: exports.emptyHooks}}
 */
// TODO: Either to be deprecated or added to all operations

var emptyHooks = {
    afterHook: () => {},
};

class AssetOperationsManager {
    constructor(services) {
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
    }

    /**
     * Checks if given UAL is valid.
     * @async
     * @param {string} UAL - Universal Asset Locator.
     * @param {Object} [options={}] - Additional options - currently only blockchain option expected.
     * @returns {boolean} UAL have passed validation.
     * @throws {Error} Throws an error if UAL validation fails.
     * @example did:dkg:otp:2043/0x5cac41237127f94c2d21dae0b14bfefa99880630/1985318
     */
    async isValidUAL(UAL, options = {}) {
        if (typeof UAL !== 'string' || UAL.trim() === '') {
            throw new Error('UAL must be a non-empty string.');
        }

        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateIsValidUAL(blockchain);

        const parts = UAL.split('/');
        if (parts.length !== 3) {
            throw new Error('UAL format is incorrect.');
        }

        const prefixes = parts[0].split(':');
        if (prefixes.length !== 3 && prefixes.length !== 4) {
            throw new Error('Prefix format in UAL is incorrect.');
        }

        if (prefixes[0] !== 'did') {
            throw new Error(`Invalid DID prefix. Expected: 'did'. Received: '${prefixes[0]}'.`);
        }

        if (prefixes[1] !== 'dkg') {
            throw new Error(`Invalid DKG prefix. Expected: 'dkg'. Received: '${prefixes[1]}'.`);
        }

        if (prefixes[2] !== blockchain.name.split(':')[0]) {
            throw new Error(
                `Invalid blockchain name in the UAL prefix. Expected: '${
                    blockchain.name.split(':')[0]
                }'. Received: '${prefixes[2]}'.`,
            );
        }

        if (prefixes.length === 4) {
            const chainId = await this.blockchainService.getChainId(blockchain);
            if (Number(prefixes[3]) !== chainId) {
                throw new Error(
                    `Chain ID in UAL does not match the blockchain. Expected: '${chainId}'. Received: '${prefixes[3]}'.`,
                );
            }
        }

        const contractAddress = await this.blockchainService.getContractAddress(
            'ContentAssetStorage',
            blockchain,
        );
        if (parts[1].toLowerCase() !== contractAddress.toLowerCase()) {
            throw new Error(
                `Contract address in UAL does not match. Expected: '${contractAddress}'. Received: '${parts[1]}'.`,
            );
        }

        try {
            const owner = await this.blockchainService.getAssetOwner(parts[2], blockchain);
            if (!owner || owner === ZERO_ADDRESS) {
                throw new Error('Token does not exist or has no owner.');
            }
            return true;
        } catch (error) {
            throw new Error(`Error fetching asset owner: ${error.message}`);
        }
    }

    /**
     * Sets allowance to a given quantity of tokens.
     * @async
     * @param {BigInt} tokenAmount - The amount of tokens (Wei) to set the allowance.
     * @param {Object} [options={}] - Additional options for increasing allowance - currently only blockchain option expected.
     * @returns {Object} Object containing hash of blockchain transaction and status.
     */
    async setAllowance(tokenAmount, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateSetAllowance(blockchain);

        const serviceAgreementV1Address = await this.blockchainService.getContractAddress(
            'ServiceAgreementV1',
            blockchain,
        );

        const currentAllowance = BigInt(
            await this.blockchainService.callContractFunction(
                'Token',
                'allowance',
                [blockchain.publicKey, serviceAgreementV1Address],
                blockchain,
            ),
        );

        const allowanceDifference = tokenAmount - currentAllowance;

        let receipt;
        if (allowanceDifference > 0) {
            receipt = await this.blockchainService.executeContractFunction(
                'Token',
                'increaseAllowance',
                [serviceAgreementV1Address, allowanceDifference],
                blockchain,
            );
        } else if (allowanceDifference < 0) {
            receipt = await this.blockchainService.executeContractFunction(
                'Token',
                'decreaseAllowance',
                [serviceAgreementV1Address, -allowanceDifference],
                blockchain,
            );
        }

        if (receipt) {
            return {
                operation: receipt,
                transactionHash: receipt.transactionHash,
                status: receipt.status,
            };
        }

        return { status: 'Skipped: Allowance is already equal to the requested amount.' };
    }

    /**
     * Increases allowance for a set quantity of tokens.
     * @async
     * @param {BigInt} tokenAmount - The amount of tokens (Wei) to increase the allowance for.
     * @param {Object} [options={}] - Additional options for increasing allowance - currently only blockchain option expected.
     * @returns {Object} Object containing hash of blockchain transaction and status.
     */
    async increaseAllowance(tokenAmount, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateIncreaseAllowance(blockchain);

        const knowledgeCollectionAddress = await this.blockchainService.getContractAddress(
            'KnowledgeCollection',
            blockchain,
        );

        const receipt = await this.blockchainService.executeContractFunction(
            'Token',
            'increaseAllowance',
            [knowledgeCollectionAddress, tokenAmount],
            blockchain,
        );

        return {
            operation: receipt,
            transactionHash: receipt.transactionHash,
            status: receipt.status,
        };
    }

    /**
     * Decreases allowance for a set quantity of tokens.
     * @async
     * @param {BigInt} tokenAmount - The amount of tokens (Wei) to decrease the allowance for.
     * @param {Object} [options={}] - Additional options for decreasing allowance - currently only blockchain option expected.
     * @returns {Object} Object containing hash of blockchain transaction and status.
     */
    async decreaseAllowance(tokenAmount, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateDecreaseAllowance(blockchain);

        const serviceAgreementV1Address = await this.blockchainService.getContractAddress(
            'ServiceAgreementV1',
            blockchain,
        );

        const allowance = await this.blockchainService.callContractFunction(
            'Token',
            'allowance',
            [blockchain.publicKey, serviceAgreementV1Address],
            blockchain,
        );

        const receipt = await this.blockchainService.executeContractFunction(
            'Token',
            'decreaseAllowance',
            [
                serviceAgreementV1Address,
                BigInt(tokenAmount) > BigInt(allowance) ? allowance : tokenAmount,
            ], // So Error 'ERC20: decreased allowance below zero' is not emitted
            blockchain,
        );

        return {
            operation: receipt,
            transactionHash: receipt.transactionHash,
            status: receipt.status,
        };
    }

    /**
     * Gets current allowance in Wei.
     * @async
     * @param {Object} [options={}] - Additional options for decreasing allowance - currently only blockchain option expected.
     * @returns {BigInt} Current allowance (Wei).
     */
    async getCurrentAllowance(options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        const knowledgeCollectionAddress = await this.blockchainService.getContractAddress(
            'KnowledgeCollection',
            blockchain,
        );

        const allowance = await this.blockchainService.callContractFunction(
            'Token',
            'allowance',
            [blockchain.publicKey, knowledgeCollectionAddress],
            blockchain,
        );

        return BigInt(allowance);
    }

    /**
     * Helper function to process content by splitting, trimming, and filtering lines.
     * @param {string} str - The content string to process.
     * @returns {string[]} - Processed array of strings.
     */
    processContent(str) {
        return str
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line !== '');
    }

    insertTripleSorted(triplesArray, newTriple) {
        // Assuming triplesArray is already sorted
        let left = 0;
        let right = triplesArray.length;
        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (triplesArray[mid].localeCompare(newTriple) < 0) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        triplesArray.splice(left, 0, newTriple);
        return left;
    }

    manualJoinSignature({ r, s, v }) {
        // Remove the "0x" prefix from r and s
        const rNoPrefix = r.replace(/^0x/, '');
        const sNoPrefix = s.replace(/^0x/, '');

        // Convert v to a 2-digit hex string (e.g. "1b" or "1c")
        // If v is already 27 or 28, this should work fine.
        const vHex = Number(v).toString(16).padStart(2, '0');

        return '0x' + rNoPrefix + sNoPrefix + vHex;
    }

    /**
     * Creates a new knowledge collection.
     * @async
     * @param {Object} content - The content of the knowledge collection to be created, contains public, private or both keys.
     * @param {Object} [options={}] - Additional options for knowledge collection creation.
     * @param {Object} [stepHooks=emptyHooks] - Hooks to execute during knowledge collection creation.
     * @returns {Object} Object containing UAL, publicAssertionId and operation status.
     */
    async create(content, options = {}, stepHooks = emptyHooks) {
        this.validationService.validateJsonldOrNquads(content);
        const {
            blockchain,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            epochsNum,
            hashFunctionId,
            scoreFunctionId,
            immutable,
            tokenAmount,
            authToken,
            payer,
            minimumNumberOfFinalizationConfirmations,
            minimumNumberOfNodeReplications,
        } = this.inputService.getAssetCreateArguments(options);

        this.validationService.validateAssetCreate(
            content,
            blockchain,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            epochsNum,
            hashFunctionId,
            scoreFunctionId,
            immutable,
            tokenAmount,
            authToken,
            payer,
            minimumNumberOfFinalizationConfirmations,
            minimumNumberOfNodeReplications,
        );

        let dataset = {};
        if (typeof content === 'string') {
            dataset.public = this.processContent(content);
        } else if (
            typeof content.public === 'string' ||
            (!content.public && content.private && typeof content.private === 'string')
        ) {
            if (content.public) {
                dataset.public = this.processContent(content.public);
            } else {
                dataset.public = [];
            }
            if (content.private && typeof content.private === 'string') {
                dataset.private = this.processContent(content.private);
            }
        } else {
            dataset = await assertionTools.kcTools.formatDataset(content);
        }

        let publicTriplesGrouped = [];
        // Assign IDs to blank nodes

        dataset.public = assertionTools.kcTools.generateMissingIdsForBlankNodes(dataset.public);

        if (dataset.private?.length) {
            dataset.private = assertionTools.kcTools.generateMissingIdsForBlankNodes(dataset.private);

            // Group private triples by subject and flatten
            const privateTriplesGrouped = assertionTools.kcTools.groupNquadsBySubject(dataset.private, true);
            dataset.private = privateTriplesGrouped.flat();

            // Compute private root and add to public
            const privateRoot = assertionTools.kcTools.calculateMerkleRoot(dataset.private);
            dataset.public.push(
                `<${assertionTools.kaTools.generateNamedNode()}> <${PRIVATE_ASSERTION_PREDICATE}> "${privateRoot}" .`,
            );

            // Group public triples by subject
            publicTriplesGrouped = assertionTools.kcTools.groupNquadsBySubject(dataset.public, true);

            // Create a map of public subject -> index for quick lookup
            const publicSubjectMap = new Map();
            for (let i = 0; i < publicTriplesGrouped.length; i++) {
                const [publicSubject] = publicTriplesGrouped[i][0].split(' ');
                publicSubjectMap.set(publicSubject, i);
            }

            const privateTripleSubjectHashesGroupedWithoutPublicPair = [];

            // Integrate private subjects into public or store separately if no match to be appended later
            for (const privateTriples of privateTriplesGrouped) {
                const [privateSubject] = privateTriples[0].split(' ');
                const privateSubjectHash = ethers.ethers.solidityPackedSha256(
                    ['string'],
                    [privateSubject.slice(1, -1)],
                );

                if (publicSubjectMap.has(privateSubject)) {
                    // If there's a public pair, insert a representation in that group
                    const publicIndex = publicSubjectMap.get(privateSubject);
                    this.insertTripleSorted(
                        publicTriplesGrouped[publicIndex],
                        `${privateSubject} <${PRIVATE_RESOURCE_PREDICATE}> <${assertionTools.kaTools.generateNamedNode()}> .`,
                    );
                } else {
                    // If no public pair, maintain separate list, inserting sorted by hash
                    this.insertTripleSorted(
                        privateTripleSubjectHashesGroupedWithoutPublicPair,
                        `${`<${PRIVATE_HASH_SUBJECT_PREFIX}${privateSubjectHash}>`} <${PRIVATE_RESOURCE_PREDICATE}> <${assertionTools.kaTools.generateNamedNode()}> .`,
                    );
                }
            }

            // Append any non-paired private subjects at the end
            for (const triple of privateTripleSubjectHashesGroupedWithoutPublicPair) {
                publicTriplesGrouped.push([triple]);
            }

            dataset.public = publicTriplesGrouped.flat();
        } else {
            // No private triples, just group and flatten public
            publicTriplesGrouped = assertionTools.kcTools.groupNquadsBySubject(dataset.public, true);
            dataset.public = publicTriplesGrouped.flat();
        }

        const numberOfChunks = assertionTools.kcTools.calculateNumberOfChunks(dataset.public, CHUNK_BYTE_SIZE);
        const datasetSize = numberOfChunks * CHUNK_BYTE_SIZE;

        this.validationService.validateAssertionSizeInBytes(datasetSize);
        const datasetRoot = assertionTools.kcTools.calculateMerkleRoot(dataset.public);

        const contentAssetStorageAddress = await this.blockchainService.getContractAddress(
            'KnowledgeCollectionStorage',
            blockchain,
        );

        const publishOperationId = await this.nodeApiService.publish(
            endpoint,
            port,
            authToken,
            datasetRoot,
            dataset,
            blockchain.name,
            hashFunctionId,
            minimumNumberOfNodeReplications,
        );
        const publishOperationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.PUBLISH,
            maxNumberOfRetries,
            frequency,
            publishOperationId,
        );

        if (
            publishOperationResult.status !== OPERATION_STATUSES.COMPLETED &&
            !publishOperationResult.data.minAcksReached
        ) {
            return {
                datasetRoot,
                operation: {
                    publish: getOperationStatusObject(publishOperationResult, publishOperationId),
                },
            };
        }

        const { signatures } = publishOperationResult.data;

        const {
            identityId: publisherNodeIdentityId,
            r: publisherNodeR,
            vs: publisherNodeVS,
        } = publishOperationResult.data.publisherNodeSignature;

        const identityIds = [];
        const r = [];
        const vs = [];
        await Promise.all(
            signatures.map(async (signature) => {
                try {
                    const signerAddress = ethers.ethers.recoverAddress(
                        ethers.hashMessage(ethers.getBytes(datasetRoot)),
                        signature,
                    );

                    let keyIsOperationalWallet;
                    keyIsOperationalWallet = await this.blockchainService.keyIsOperationalWallet(
                        blockchain,
                        signature.identityId,
                        signerAddress,
                    );
                    if (keyIsOperationalWallet) {
                        identityIds.push(signature.identityId);
                        r.push(signature.r);
                        vs.push(signature.vs);
                    }
                } catch {}
            }),
        );

        let estimatedPublishingCost;
        if (tokenAmount) {
            estimatedPublishingCost = tokenAmount;
        } else {
            const timeUntilNextEpoch = await this.blockchainService.timeUntilNextEpoch(blockchain);
            const epochLength = await this.blockchainService.epochLength(blockchain);
            const stakeWeightedAverageAsk = await this.blockchainService.getStakeWeightedAverageAsk(
                blockchain,
            );
            estimatedPublishingCost =
                (BigInt(stakeWeightedAverageAsk) *
                    (BigInt(epochsNum) * BigInt(1e18) +
                        (BigInt(timeUntilNextEpoch) * BigInt(1e18)) / BigInt(epochLength)) *
                    BigInt(datasetSize)) /
                BigInt(1024) /
                BigInt(1e18);
        }
        let knowledgeCollectionId;
        let mintKnowledgeAssetReceipt;

        ({ knowledgeCollectionId, receipt: mintKnowledgeAssetReceipt } =
            await this.blockchainService.createKnowledgeCollection(
                {
                    publishOperationId,
                    merkleRoot: datasetRoot,
                    knowledgeAssetsAmount: assertionTools.kcTools.countDistinctSubjects(dataset.public),
                    byteSize: datasetSize,
                    epochs: epochsNum,
                    tokenAmount: estimatedPublishingCost.toString(),
                    isImmutable: immutable,
                    paymaster: payer,
                    publisherNodeIdentityId,
                    publisherNodeR,
                    publisherNodeVS,
                    identityIds,
                    r,
                    vs,
                },
                null,
                null,
                blockchain,
                stepHooks,
            ));

        const UAL = deriveUAL(blockchain.name, contentAssetStorageAddress, knowledgeCollectionId);

        let finalityStatusResult = 0;
        if (minimumNumberOfFinalizationConfirmations > 0) {
            finalityStatusResult = await this.nodeApiService.finalityStatus(
                endpoint,
                port,
                authToken,
                UAL,
                minimumNumberOfFinalizationConfirmations,
                maxNumberOfRetries,
                frequency,
            );
        }

        return {
            UAL,
            datasetRoot,
            signatures: publishOperationResult.data.signatures,
            operation: {
                mintKnowledgeAsset: mintKnowledgeAssetReceipt,
                publish: getOperationStatusObject(publishOperationResult, publishOperationId),
                finality: {
                    status:
                        finalityStatusResult >= minimumNumberOfFinalizationConfirmations
                            ? 'FINALIZED'
                            : 'NOT FINALIZED',
                },
                numberOfConfirmations: finalityStatusResult,
                requiredConfirmations: minimumNumberOfFinalizationConfirmations,
            },
        };
    }

    generatePrivateRepresentation(privateSubjectHash) {
        return `${`<${PRIVATE_HASH_SUBJECT_PREFIX}${privateSubjectHash}>`} <${PRIVATE_RESOURCE_PREDICATE}> <${assertionTools.kaTools.generateNamedNode()}> .`;
    }

    /**
     * Transfer an asset to a new owner on a specified blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset to be transferred.
     * @param {string} newOwner - The address of the new owner.
     * @param {Object} [options={}] - Additional options for asset transfer.
     * @returns {Object} Object containing UAL, owner's address and operation status.
     */
    async transfer(UAL, newOwner, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateAssetTransfer(UAL, newOwner, blockchain);

        const { tokenId } = resolveUAL(UAL);
        const receipt = await this.blockchainService.transferAsset(tokenId, newOwner, blockchain);
        const owner = await this.blockchainService.getAssetOwner(tokenId, blockchain);

        return {
            UAL,
            owner,
            operation: receipt,
        };
    }

    /**
     * Retrieves the owner of a specified asset for a given blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Object} An object containing the UAL, owner and operation status.
     */
    async getOwner(UAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateAssetGetOwner(UAL, blockchain);

        const { tokenId } = resolveUAL(UAL);
        const owner = await this.blockchainService.getAssetOwner(tokenId, blockchain);
        return {
            UAL,
            owner,
            operation: getOperationStatusObject({ data: {}, status: 'COMPLETED' }, null),
        };
    }

    /**
     * Retrieves the issuer of a specified asset for a specified state index and a given blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {string} stateIndex - The state index of the assertion we want to get issuer of.
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Object} An object containing the UAL, issuer and operation status.
     */
    async getStateIssuer(UAL, stateIndex, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateAssetGetStateIssuer(UAL, stateIndex, blockchain);

        const { tokenId } = resolveUAL(UAL);

        const state = await this.blockchainService.getAssertionIdByIndex(
            tokenId,
            stateIndex,
            blockchain,
        );

        const issuer = await this.blockchainService.getAssertionIssuer(
            tokenId,
            state,
            stateIndex,
            blockchain,
        );
        return {
            UAL,
            issuer,
            state,
            operation: getOperationStatusObject({ data: {}, status: 'COMPLETED' }, null),
        };
    }

    /**
     * Retrieves the latest issuer of a specified asset and a given blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Object} An object containing the UAL, issuer and operation status.
     */
    async getLatestStateIssuer(UAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateAssetGetLatestStateIssuer(UAL, blockchain);

        const { tokenId } = resolveUAL(UAL);

        const states = await this.blockchainService.getAssertionIds(tokenId, blockchain);

        const latestStateIndex = states.length - 1;

        const latestState = states[latestStateIndex];

        const issuer = await this.blockchainService.getAssertionIssuer(
            tokenId,
            latestState,
            latestStateIndex,
            blockchain,
        );
        return {
            UAL,
            issuer,
            latestState,
            operation: getOperationStatusObject({ data: {}, status: 'COMPLETED' }, null),
        };
    }

    /**
     * Retrieves all assertion ids for a specified asset and a given blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Object} An object containing the UAL, issuer and operation status.
     */
    async getStates(UAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateAssetGetStates(UAL, blockchain);

        const { tokenId } = resolveUAL(UAL);

        const states = await this.blockchainService.getAssertionIds(tokenId, blockchain);

        return {
            UAL,
            states,
            operation: getOperationStatusObject({ data: {}, status: 'COMPLETED' }, null),
        };
    }

    /**
     * Burn an asset on a specified blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Object} An object containing the UAL and operation status.
     */
    async burn(UAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateAssetBurn(UAL, blockchain);

        const { tokenId } = resolveUAL(UAL);
        const receipt = await this.blockchainService.burnAsset(tokenId, blockchain);

        return {
            UAL,
            operation: receipt,
        };
    }

    /**
     * Extend the storing period of an asset on a specified blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {number} epochsNumber - Nmber of epochs for the extension.
     * @param {Object} [options={}] - Additional options for asset storing period extension.
     * @returns {Object} An object containing the UAL and operation status.
     */
    async extendStoringPeriod(UAL, epochsNumber, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        const tokenAmount = this.inputService.getTokenAmount(options);

        this.validationService.validateExtendAssetStoringPeriod(
            UAL,
            epochsNumber,
            tokenAmount,
            blockchain,
        );

        const { tokenId } = resolveUAL(UAL);

        let tokenAmountInWei;

        if (tokenAmount != null) {
            tokenAmountInWei = tokenAmount;
        } else {
            tokenAmountInWei =
                (await this.blockchainService.getStakeWeightedAverageAsk()) *
                epochsNumber *
                datasetSize; // need to get dataset size somewhere
        }

        const receipt = await this.blockchainService.extendAssetStoringPeriod(
            tokenId,
            epochsNumber,
            tokenAmountInWei,
            blockchain,
        );

        return {
            UAL,
            operation: receipt,
        };
    }

    /**
     * Add tokens for an asset on the specified blockchain to a ongoing publishing operation.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {Object} [options={}] - Additional options for adding tokens.
     * @returns {Object} An object containing the UAL and operation status.
     */
    async addTokens(UAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        const tokenAmount = this.inputService.getTokenAmount(options);

        this.validationService.validateAddTokens(UAL, tokenAmount, blockchain);

        const { tokenId } = resolveUAL(UAL);

        let tokenAmountInWei;

        if (tokenAmount != null) {
            tokenAmountInWei = tokenAmount;
        } else {
            const endpoint = this.inputService.getEndpoint(options);
            const port = this.inputService.getPort(options);
            const authToken = this.inputService.getAuthToken(options);
            const hashFunctionId = this.inputService.getHashFunctionId(options);

            const latestFinalizedState = await this.blockchainService.getLatestAssertionId(
                tokenId,
                blockchain,
            );

            const latestFinalizedStateSize = await this.blockchainService.getAssertionSize(
                latestFinalizedState,
                blockchain,
            );

            tokenAmountInWei = await this._getUpdateBidSuggestion(
                UAL,
                blockchain,
                endpoint,
                port,
                authToken,
                latestFinalizedState,
                latestFinalizedStateSize,
                hashFunctionId,
            );

            if (tokenAmountInWei <= 0) {
                throw new Error(
                    `Token amount is bigger than default suggested amount, please specify exact tokenAmount if you still want to add more tokens!`,
                );
            }
        }

        const receipt = await this.blockchainService.addTokens(
            tokenId,
            tokenAmountInWei,
            blockchain,
        );

        return {
            UAL,
            operation: receipt,
        };
    }

    async _getUpdateBidSuggestion(UAL, blockchain, size) {
        const { contract, tokenId } = resolveUAL(UAL);
        const firstDatasetRoot = await this.blockchainService.getAssertionIdByIndex(
            tokenId,
            0,
            blockchain,
        );

        const keyword = ethers.ethers.solidityPacked(['address', 'bytes32'], [contract, firstDatasetRoot]);

        const agreementId = ethers.ethers.sha256(
            ethers.ethers.solidityPacked(['address', 'uint256', 'bytes'], [contract, tokenId, keyword]),
        );
        const agreementData = await this.blockchainService.getAgreementData(
            agreementId,
            blockchain,
        );

        const now = await this.blockchainService.getBlockchainTimestamp(blockchain);
        const currentEpoch = Math.floor(
            (now - agreementData.startTime) / agreementData.epochLength,
        );

        const epochsLeft = agreementData.epochsNumber - currentEpoch;

        const bidSuggestion =
            (await this.blockchainService.getStakeWeightedAverageAsk()) * epochsLeft * size;

        const tokenAmountInWei =
            BigInt(bidSuggestion) -
            (BigInt(agreementData.tokenAmount) + BigInt(agreementData.updateTokenAmount ?? 0));

        return tokenAmountInWei > 0 ? tokenAmountInWei : 0;
    }

    /**
     * Add knowledge asset to a paranet.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the knowledge asset.
     * @param {string} paranetUAL - The Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for adding tokens.
     * @returns {Object} An object containing the UAL and operation status.
     */
    async submitToParanet(UAL, paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateSubmitToParanet(UAL, paranetUAL, blockchain);

        const { contract, tokenId } = resolveUAL(UAL);
        const { contract: paranetContract, tokenId: paranetTokenId } = resolveUAL(paranetUAL);

        const receipt = await this.blockchainService.submitToParanet(
            {
                paranetContract,
                paranetTokenId,
                contract,
                tokenId,
            },
            blockchain,
        );

        return {
            UAL,
            operation: receipt,
        };
    }

    /**
     * Updates an existing asset.
     * @async
     * @param {string} UAL - The Universal Asset Locator
     * @param {Object} content - The content of the asset to be updated.
     * @param {Object} [options={}] - Additional options for asset update.
     * @returns {Object} Object containing UAL, publicAssertionId and operation status.
     */
    async update(UAL, content, options = {}) {
        console.log('Update feature is currently unavailable in version 8.0.0, coming soon!');
        return;
    }

    /**
     * Retrieves a public or private assertion for a given UAL.
     * @async
     * @param {string} UAL - The Universal Asset Locator, representing asset or collection.
     * @param {Object} [options={}] - Optional parameters for the asset get operation.
     * @param {number} [options.state] - The state index of the asset. If omitted, the latest state will be used.
     * @param {boolean} [options.includeMetadata] - If metadata should be included. Default is false.
     * @param {string} [options.contentType] - The type of content to retrieve, either "public" or "all" (default)
     * @param {boolean} [options.validate] - Whether to validate the retrieved assertion.
     * @param {string} [options.outputFormat] - The format of the retrieved assertion output, either "n-quads" or "json-ld".
     * @returns {Object} - The result of the asset get operation.
     */
    async get(UAL, options = {}) {
        const {
            blockchain,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            state,
            includeMetadata,
            contentType,
            validate,
            outputFormat,
            authToken,
            hashFunctionId,
            paranetUAL,
            subjectUAL,
        } = this.inputService.getAssetGetArguments(options);

        this.validationService.validateAssetGet(
            UAL,
            blockchain,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            state,
            includeMetadata,
            contentType,
            hashFunctionId,
            validate,
            outputFormat,
            authToken,
            subjectUAL,
        );

        const getOperationId = await this.nodeApiService.get(
            endpoint,
            port,
            authToken,
            UAL,
            state,
            includeMetadata,
            subjectUAL,
            contentType,
            hashFunctionId,
            paranetUAL,
        );

        const getOperationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.GET,
            maxNumberOfRetries,
            frequency,
            getOperationId,
        );
        if (subjectUAL) {
            if (getOperationResult.data?.length) {
                return {
                    operation: {
                        get: getOperationStatusObject(getOperationResult, getOperationId),
                    },
                    subjectUALPairs: getOperationResult.data,
                };
            }
            if (getOperationResult.status !== 'FAILED') {
                getOperationResult.data = {
                    errorType: 'DKG_CLIENT_ERROR',
                    errorMessage: 'Unable to find assertion on the network!',
                };
                getOperationResult.status = 'FAILED';
            }

            return {
                operation: {
                    get: getOperationStatusObject(getOperationResult, getOperationId),
                },
            };
        }
        const { metadata } = getOperationResult.data;
        let assertion = getOperationResult.data.assertion;

        if (!assertion) {
            if (getOperationResult.status !== 'FAILED') {
                getOperationResult.data = {
                    errorType: 'DKG_CLIENT_ERROR',
                    errorMessage: 'Unable to find assertion on the network!',
                };
                getOperationResult.status = 'FAILED';
            }

            return {
                operation: {
                    get: getOperationStatusObject(getOperationResult, getOperationId),
                },
            };
        }

        let formattedAssertion = [...(assertion.public ?? []), ...(assertion.private ?? [])].join(
            '\n',
        );
        let formattedMetadata;
        if (outputFormat === GET_OUTPUT_FORMATS.JSON_LD) {
            formattedAssertion = await toJSONLD(formattedAssertion);

            if (includeMetadata) {
                formattedMetadata = await toJSONLD(metadata.join('\n'));
            }
        }
        if (outputFormat === GET_OUTPUT_FORMATS.N_QUADS) {
            formattedAssertion = await toNQuads(formattedAssertion, 'application/n-quads');
            if (includeMetadata) {
                formattedMetadata = await toNQuads(metadata.join('\n'), 'application/n-quads');
            }
        }

        return {
            assertion: formattedAssertion,
            ...(includeMetadata && metadata && { metadata: formattedMetadata }),
            operation: {
                get: getOperationStatusObject(getOperationResult, getOperationId),
            },
        };
    }
}

class BlockchainOperationsManager {
    constructor(services) {
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
    }

    /**
     * @async
     * @param {Object} [options={}]  - Optional parameters for blockchain service.
     * @returns {Promise<number>} - A promise that resolves to the chain id.
     */
    async getChainId(options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.getChainId(blockchain);
    }

    /**
     * Retrieve the current gas price.
     * @async
     * @param {Object} [options={}]  - Optional parameters for blockchain service.
     * @returns {Promise<string>} - A promise that resolves to the current gas price.
     */
    async getGasPrice(options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.getGasPrice(blockchain);
    }

    /**
     * Retrieve the wallet balances.
     * @async
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Promise<Object>} - A promise that resolves to an object containing wallet balances.
     */
    async getWalletBalances(options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.getWalletBalances(blockchain);
    }
}

class GraphOperationsManager {
    constructor(services) {
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
        this.inputService = services.inputService;
        this.blockchainService = services.blockchainService;
    }

    /**
     * An asynchronous function that executes a SPARQL query using an API endpoint and returns the query result.
     * @async
     * @param {string} queryString - The string representation of the SPARQL query to be executed.
     * @param {string} queryType - The type of the SPARQL query, "CONSTRUCT" or "SELECT".
     * @param {Object} [options={}] - An object containing additional options for the query execution.
     * @returns {Promise} A Promise that resolves to the query result.
     */
    async query(queryString, queryType, options = {}) {
        const { endpoint, port, maxNumberOfRetries, frequency, authToken, paranetUAL, repository } =
            this.inputService.getQueryArguments(options);

        this.validationService.validateGraphQuery(
            queryString,
            queryType,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            authToken,
            repository,
        );

        const operationId = await this.nodeApiService.query(
            endpoint,
            port,
            authToken,
            queryString,
            queryType,
            paranetUAL,
            repository,
        );

        return this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.QUERY,
            maxNumberOfRetries,
            frequency,
            operationId,
        );
    }

    generatePrivateRepresentation(privateSubject) {
        return `${`<${PRIVATE_HASH_SUBJECT_PREFIX}${ethers.ethers.solidityPackedSha256(
            ['string'],
            [privateSubject.slice(1, -1)],
        )}>`} <${PRIVATE_RESOURCE_PREDICATE}> <${assertionTools.kaTools.generateNamedNode()}> .`;
    }

    /**
     * Creates a new asset and stores it locally on the node.
     * @async
     * @param {Object} content - The content of the asset to be created, contains public, private or both keys.
     * @param {Object} [options={}] - Additional options for asset creation.
     * @param {Object} [stepHooks=emptyHooks] - Hooks to execute during asset creation.
     * @returns {Object} Object containing UAL, publicAssertionId and operation status.
     */
    async localStore(content, options = {}, stepHooks = emptyHooks) {
        this.validationService.validateJsonldOrNquads(content);

        const {
            blockchain,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            epochsNum,
            hashFunctionId,
            scoreFunctionId,
            immutable,
            tokenAmount,
            authToken,
            paranetUAL,
        } = this.inputService.getAssetLocalStoreArguments(options);

        this.validationService.validateAssetCreate(
            content,
            blockchain,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            epochsNum,
            hashFunctionId,
            scoreFunctionId,
            immutable,
            tokenAmount,
            authToken,
            paranetUAL,
        );

        let dataset;

        if (typeof content === 'string') {
            dataset = content
                .split('\n')
                .map((line) => line.trimStart().trimEnd())
                .filter((line) => line.trim() !== '');
        } else {
            dataset = await assertionTools.kcTools.formatDataset(content);
        }

        const numberOfChunks = assertionTools.kcTools.calculateNumberOfChunks(dataset, CHUNK_BYTE_SIZE);

        const datasetSize = numberOfChunks * CHUNK_BYTE_SIZE;

        this.validationService.validateAssertionSizeInBytes(datasetSize);
        const datasetRoot = assertionTools.kcTools.calculateMerkleRoot(dataset);

        const contentAssetStorageAddress = await this.blockchainService.getContractAddress(
            'ContentAssetStorage',
            blockchain,
        );

        const localStoreOperationId = await this.nodeApiService.localStore(
            endpoint,
            port,
            authToken,
            dataset,
            null, // full path to cached assertions
        );

        const localStoreOperationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.LOCAL_STORE,
            maxNumberOfRetries,
            frequency,
            localStoreOperationId,
        );

        if (localStoreOperationResult.status !== OPERATION_STATUSES.COMPLETED) {
            return {
                datasetRoot,
                operation: {
                    publish: getOperationStatusObject(
                        localStoreOperationResult,
                        localStoreOperationId,
                    ),
                },
            };
        }

        const estimatedPublishingCost =
            tokenAmount ??
            (await this.blockchainService.getStakeWeightedAverageAsk()) * epochsNum * datasetSize;

        const { tokenId, receipt: mintKnowledgeAssetReceipt } =
            await this.blockchainService.createAsset(
                {
                    localStoreOperationId,
                    datasetRoot,
                    assertionSize: datasetSize,
                    triplesNumber: assertionTools.kaTools.getAssertionTriplesNumber(dataset), // todo
                    chunksNumber: numberOfChunks,
                    epochsNum,
                    tokenAmount: estimatedPublishingCost,
                    scoreFunctionId: scoreFunctionId ?? 1,
                    immutable_: immutable,
                    // payer: payer,
                },
                null,
                null,
                blockchain,
                stepHooks,
            );

        const UAL = deriveUAL(blockchain.name, contentAssetStorageAddress, tokenId);
        // let fullPathToCachedAssertion = null;
        // if (assertionCachedLocally) {
        //     const absolutePath = path.resolve('.');
        //     const directory = 'local-store-cache';
        //     await mkdir(directory, { recursive: true });
        //     fullPathToCachedAssertion = path.join(
        //         absolutePath,
        //         directory,
        //         assertions[0].assertionId,
        //     );
        //     await writeFile(fullPathToCachedAssertion, JSON.stringify(assertions));
        // }

        return {
            UAL,
            datasetRoot,
            operation: {
                mintKnowledgeAsset: mintKnowledgeAssetReceipt,
                localStore: getOperationStatusObject(
                    localStoreOperationResult,
                    localStoreOperationId,
                ),
            },
        };
    }

    /**
     * Checks whether KA is finalized on the node.
     * @async
     * @param {string} UAL - The Universal Asset Locator, representing asset or collection.
     */
    async publishFinality(UAL, options = {}) {
        const {
            blockchain,
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            minimumNumberOfFinalizationConfirmations,
            authToken,
        } = this.inputService.getPublishFinalityArguments(options);

        // blockchain not mandatory so it's not validated
        this.validationService.validatePublishFinality(
            endpoint,
            port,
            maxNumberOfRetries,
            frequency,
            minimumNumberOfFinalizationConfirmations,
            authToken,
        );

        const finalityStatusResult = await this.nodeApiService.finalityStatus(
            endpoint,
            port,
            authToken,
            UAL,
        );

        if (finalityStatusResult === 0) {
            const finalityOperationId = await this.nodeApiService.finality(
                endpoint,
                port,
                authToken,
                blockchain.name,
                UAL,
                minimumNumberOfFinalizationConfirmations,
            );

            try {
                return this.nodeApiService.getOperationResult(
                    endpoint,
                    port,
                    authToken,
                    OPERATIONS.FINALITY,
                    maxNumberOfRetries,
                    frequency,
                    finalityOperationId,
                );
            } catch (error) {
                console.error(`Finality attempt failed:`, error.message);
                return {
                    status: 'NOT FINALIZED',
                    error: error.message,
                };
            }
        } else if (finalityStatusResult >= minimumNumberOfFinalizationConfirmations) {
            return {
                status: 'FINALIZED',
                numberOfConfirmations: finalityStatusResult,
                requiredConfirmations: minimumNumberOfFinalizationConfirmations,
            };
        } else {
            return {
                status: 'NOT FINALIZED',
                numberOfConfirmations: finalityStatusResult,
                requiredConfirmations: minimumNumberOfFinalizationConfirmations,
            };
        }
    }
}

class NetworkOperationsManager {
    constructor(services) {
        this.inputService = services.inputService;
        this.blockchainService = services.blockchainService;
        this.nodeApiService = services.nodeApiService;
    }
}

class NodeOperationsManager {
    constructor(services) {
        this.nodeApiService = services.nodeApiService;
        this.inputService = services.inputService;
        this.validationService = services.validationService;
        this.blockchainService = services.blockchainService;
    }

    /**
     * Gets the node info from the specified endpoint using the provided options.
     * @async
     * @param {Object} [options={}] - The options for the request.
     * @param {string} [options.endpoint] - The endpoint URL to send the request to.
     * @param {number} [options.port] - The port number to use for the request.
     * @param {string} [options.authToken] - The authentication token to include in the request headers.
     * @returns {Promise} - A promise that resolves to the node info data returned from the API.
     */
    async info(options = {}) {
        const endpoint = this.inputService.getEndpoint(options);
        const port = this.inputService.getPort(options);
        const authToken = this.inputService.getAuthToken(options);

        const response = await this.nodeApiService.info(endpoint, port, authToken);

        return response.data;
    }

    /**
     * Retrieve node's identity ID
     * @async
     * @param {string} operational - Address of the node's operational wallet.
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {number} - Node's identity ID
     */
    async getIdentityId(operational, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateGetIdentityId(operational, blockchain);

        const identityId = await this.blockchainService.getIdentityId(operational, blockchain);

        return identityId;
    }
}

class ParanetOperationsManager {
    constructor(services) {
        this.blockchainService = services.blockchainService;
        this.inputService = services.inputService;
        this.nodeApiService = services.nodeApiService;
        this.validationService = services.validationService;
    }

    /**
     * Creates a new Paranet.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA that is created for Paranet.
     * @param {Object} [options={}] - Additional options for creating the Paranet.
     * @param {string} options.paranetName - Name of the Paranet.
     * @param {string} options.paranetDescription - Description of the Paranet.
     * @param {number} paranetNodesAccessPolicy - Paranet's policy towards including nodes.
     * @param {number} paranetMinersAccessPolicy - Paranet's policy towards including knowledge miners.
     * @returns {Object} Object containing the Paranet UAL.
     * @example
     * await dkg.paranet.create(UAL, {
     *     paranetName: 'MyParanet',
     *     paranetDescription: 'A paranet for demonstration purposes.',
     *     paranetNodesAccessPolicy: 0,
     *     paranetMinersAccessPolicy: 0
     * });
     */
    async create(UAL, options = {}) {
        const {
            blockchain,
            paranetName,
            paranetDescription,
            paranetNodesAccessPolicy,
            paranetMinersAccessPolicy
        } = this.inputService.getParanetCreateArguments(options);

        this.validationService.validateParanetCreate(
            UAL,
            blockchain,
            paranetName,
            paranetDescription,
            paranetNodesAccessPolicy,
            paranetMinersAccessPolicy
        );

        const { contract, tokenId } = resolveUAL(UAL);

        const receipt = await this.blockchainService.registerParanet(
            {
                contract,
                tokenId,
                paranetName,
                paranetDescription,
                paranetNodesAccessPolicy,
                paranetMinersAccessPolicy
            },
            blockchain,
        );

        return {
            paranetUAL: UAL,
            operation: receipt,
        };
    }

    /**
     * Adds nodes to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Array<number>} identityIds - List of node Identity IDs. 
     * @param {Object} [options={}] - Additional options for adding curated nodes to a paranet.
     * @example
     * await dkg.paranet.addCuratedNodes(UAL, identityIds: [1, 2]);
     */
    async addCuratedNodes(paranetUAL, identityIds, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetAddCuratedNodes(
            paranetUAL,
            blockchain,
            identityIds
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);

        await this.blockchainService.addParanetCuratedNodes({
                contract,
                tokenId,
                identityIds
            },
            blockchain
        );
    }

    /**
     * Removes nodes from a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Array<number>} identityIds - List of node Identity IDs to be removed. 
     * @param {Object} [options={}] - Additional options for adding curated nodes to a paranet.
     * @example
     * await dkg.paranet.removeCuratedNodes(UAL, identityIds: [1, 2]);
     */
    async removeCuratedNodes(paranetUAL, identityIds, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetRemoveCuratedNodes(
            paranetUAL,
            blockchain,
            identityIds
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);

        await this.blockchainService.removeParanetCuratedNodes({
                contract,
                tokenId,
                identityIds
            },
            blockchain
        );
    }

    /**
     * Request to become a node in a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @example
     * await dkg.paranet.requestCuratedNodeAccess(UAL);
     */
    async requestCuratedNodeAccess(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateRequestParanetCuratedNodeAccess(
            paranetUAL,
            blockchain,
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);

        await this.blockchainService.requestParanetCuratedNodeAccess({
                contract,
                tokenId,
            },
            blockchain
        );
    }

    /**
     * Approve a node's access request to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {number} identityId - Identity ID of the node which requested access.
     * @param {Object} [options={}] - Additional options for adding curated nodes to a paranet.
     * @example
     * await dkg.paranet.approveCuratedNode(UAL, identityId: 1);
     */
    async approveCuratedNode(paranetUAL, identityId, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateApproveCuratedNode(
            paranetUAL,
            blockchain,
            identityId
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);

        await this.blockchainService.approveCuratedNode({
                contract,
                tokenId,
                identityId
            },
            blockchain
        );
    }

    /**
     * Reject a node's access request to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {number} identityId - Identity ID of the node which requested access.
     * @param {Object} [options={}] - Additional options for adding curated nodes to a paranet.
     * @example
     * await dkg.paranet.rejectCuratedNode(UAL, identityId: 1);
     */
    async rejectCuratedNode(paranetUAL, identityId, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateRejectCuratedNode(
            paranetUAL,
            blockchain,
            identityId
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);

        await this.blockchainService.rejectCuratedNode({
                contract,
                tokenId,
                identityId
            },
            blockchain
        );
    }

    /**
     * Get nodes of a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @returns {Array[number]} Array of nodes identity IDs.
     * @example
     * await dkg.paranet.getCuratedNodes(UAL);
     */
    async getCuratedNodes(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateGetCuratedNodes(
            paranetUAL,
            blockchain,
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.ethers.keccak256(
            ethers.ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const curatedNodes = await this.blockchainService.getCuratedNodes({ paranetId }, blockchain);

        return curatedNodes;
    }

    /**
     * Adds miners to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Array<string>} minerAddresses - List of miner addresses to be added. 
     * @param {Object} [options={}] - Additional options for adding curated nodes to a paranet.
     * @example
     * await dkg.paranet.addCuratedMiners(UAL, minerAddresses: [0xminerAddress1, 0xminerAddress2]);
     */
    async addCuratedMiners(paranetUAL, minerAddresses, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetAddCuratedMiners(
            paranetUAL,
            blockchain,
            minerAddresses
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);

        await this.blockchainService.addParanetCuratedMiners({
                contract,
                tokenId,
                minerAddresses
            },
            blockchain
        );
    }

    /**
     * Removes miners from a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Array<string>} minerAddresses - List of miner addresses to be removed.
     * @param {Object} [options={}] - Additional options for adding curated miners to a paranet.
     * @example
     * await dkg.paranet.removeCuratedMiners(UAL, identityIds: [1, 2]);
     */
    async removeCuratedMiners(paranetUAL, minerAddresses, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetRemoveCuratedMiners(
            paranetUAL,
            blockchain,
            minerAddresses
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);

        await this.blockchainService.removeParanetCuratedMiners({
                contract,
                tokenId,
                minerAddresses
            },
            blockchain
        );
    }

    /**
     * Request to become a miner in a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @example
     * await dkg.paranet.requestCuratedMinerAccess(UAL);
     */
    async requestCuratedMinerAccess(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateRequestParanetCuratedMinerAccess(
            paranetUAL,
            blockchain,
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);

        await this.blockchainService.requestParanetCuratedMinerAccess({
                contract,
                tokenId,
            },
            blockchain
        );
    }

    /**
     * Approve a miner's access request to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {string} minerAddress - Address of the miner which requested access.
     * @param {Object} [options={}] - Additional options for adding curated miners to a paranet.
     * @example
     * await dkg.paranet.approveCuratedMiner(UAL, minerAddress: 1);
     */
    async approveCuratedMiner(paranetUAL, minerAddress, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateApproveCuratedMiner(
            paranetUAL,
            blockchain,
            minerAddress
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);

        await this.blockchainService.approveCuratedMiner({
                contract,
                tokenId,
                minerAddress
            },
            blockchain
        );
    }

    /**
     * Reject a miner's access request to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {string} minerAddress - Address of the miner which requested access.
     * @param {Object} [options={}] - Additional options for adding curated miners to a paranet.
     * @example
     * await dkg.paranet.rejectCuratedMiner(UAL, minerAddress: 1);
     */
    async rejectCuratedMiner(paranetUAL, minerAddress, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateRejectCuratedMiner(
            paranetUAL,
            blockchain,
            minerAddress
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);

        await this.blockchainService.rejectCuratedMiner({
                contract,
                tokenId,
                minerAddress
            },
            blockchain
        );
    }

    /**
     * Get miners of a paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @returns {Array[string]} Array of knowledge miners addresses.
     * @example
     * await dkg.paranet.getKnowledgeMiners(UAL);
     */
    async getKnowledgeMiners(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateGetParanetKnowledgeMiners(
            paranetUAL,
            blockchain,
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.ethers.keccak256(
            ethers.ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const knowledgeMiners = await this.blockchainService.getKnowledgeMiners({ paranetId }, blockchain);

        return knowledgeMiners;
    }

    /**
     * Deploys an incentives contract for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {string} incentiveType - Type of incentives to deploy (only option 'Neuroweb').
     * @param {Object} [options={}] - Additional options for the incentives contract.
     * @param {string} options.tracToNeuroEmissionMultiplier - How much NEURO is emission per 1 TRAC.
     * @param {string} options.operatorRewardPercentage - Percentage of the emissions as a paranet operator fee.
     * @param {string} options.incentivizationProposalVotersRewardPercentage - Percentage of the emissions that will be shared with NEURO holders supporting the proposal.
     * @returns {Object} Object containing the Paranet UAL and incentives pool contract address.
     * @example
     * await dkg.paranet.deployIncentivesContract('paranetUAL123', 'Neuroweb', {
     *     tracToNeuroEmissionMultiplier: 1.5,
     *     operatorRewardPercentage: 20,
     *     incentivizationProposalVotersRewardPercentage: 10,
     * });
     */
    async deployIncentivesContract(paranetUAL, incentiveType, options = {}) {
        const {
            blockchain,
            tracToNeuroEmissionMultiplier,
            operatorRewardPercentage,
            incentivizationProposalVotersRewardPercentage,
        } = this.inputService.getParanetDeployIncentivesContractArguments(options);

        this.validationService.validateDeployIncentivesContract(
            paranetUAL,
            blockchain,
            tracToNeuroEmissionMultiplier,
            operatorRewardPercentage,
            incentivizationProposalVotersRewardPercentage,
        );
        if (incentiveType === INCENTIVE_TYPE.NEUROWEB) {
            const { contract, tokenId } = resolveUAL(paranetUAL);

            const receipt = await this.blockchainService.deployNeuroIncentivesPool(
                {
                    contract,
                    tokenId,
                    tracToNeuroEmissionMultiplier,
                    operatorRewardPercentage,
                    incentivizationProposalVotersRewardPercentage,
                },
                blockchain,
            );

            const paranetId = ethers.ethers.keccak256(
                ethers.ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
            );

            const neuroIncentivesPoolAddress =
                await this.blockchainService.getNeuroIncentivesPoolAddress(paranetId, blockchain);

            return {
                paranetUAL,
                incentivesPoolContractAddress: neuroIncentivesPoolAddress,
                operation: receipt,
            };
        }

        throw Error(`Unsupported incentive type: ${incentiveType}.`);
    }

    /**
     * Creates a new service for a Paranet.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA created for Service.
     * @param {Object} [options={}] - Additional options for creating the service.
     * @returns {Object} Object containing the service UAL.
     * @example
     * await dkg.paranet.createService(UAL, {
     *     paranetServiceName: 'MyService',
     *     paranetServiceDescription: 'Service for my Paranet',
     *     paranetServiceAddresses: ['0xServiceAddress1', '0xServiceAddress2'],
     * });
     */
    async createService(UAL, options = {}) {
        const {
            blockchain,
            paranetServiceName,
            paranetServiceDescription,
            paranetServiceAddresses,
        } = this.inputService.getParanetCreateServiceArguments(options);
        this.validationService.validateParanetCreateServiceArguments(
            UAL,
            paranetServiceName,
            paranetServiceDescription,
            paranetServiceAddresses,
            blockchain,
        );

        const { contract, tokenId } = resolveUAL(UAL);

        const receipt = await this.blockchainService.registerParanetService(
            {
                contract,
                tokenId,
                paranetServiceName,
                paranetServiceDescription,
                paranetServiceAddresses,
            },
            blockchain,
        );

        return {
            serviceUAL: UAL,
            operation: receipt,
        };
    }

    /**
     * Adds services to an existing Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Array<string>} paranetServiceUALs - List of UALs of the services to add.
     * @param {Object} [options={}] - Additional options for adding services.
     * @returns {Object} Object containing the Paranet UAL and added service UALs.
     * @example
     * await dkg.paranet.addServices('paranetUAL123', ['serviceUAL1', 'serviceUAL2']);
     */
    async addServices(paranetUAL, paranetServiceUALs, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetAddServicesArguments(
            paranetUAL,
            paranetServiceUALs,
            blockchain,
        );
        const { contract, tokenId } = resolveUAL(paranetUAL);

        const processedServicesArray = [];
        for (const serviceUAL of paranetServiceUALs) {
            const { contract: serviceContract, tokenId: serviceTokenId } = resolveUAL(serviceUAL);
            processedServicesArray.push([serviceContract, serviceTokenId]);
        }

        const receipt = await this.blockchainService.addParanetServices(
            {
                contract,
                tokenId,
                processedServicesArray,
            },
            blockchain,
        );

        return {
            paranetUAL,
            paranetServiceUALs,
            operation: receipt,
        };
    }

    /**
     * Claims miner reward for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for claiming reward.
     * @returns {Object} Object containing the transaction hash and status.
     * @example
     * await dkg.paranet.claimMinerReward('paranetUAL123');
     */
    async claimMinerReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.ethers.keccak256(
            ethers.ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const receipt = await this.blockchainService.claimKnowledgeMinerReward(
            paranetId,
            blockchain,
        );

        return {
            operation: receipt,
            transactionHash: receipt.transactionHash,
            status: receipt.status,
        };
    }

    /**
     * Claims voter reward for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for claiming reward.
     * @returns {Object} Object containing the transaction hash and status.
     * @example
     * await dkg.paranet.claimVoterReward('paranetUAL123');
     */
    async claimVoterReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.ethers.keccak256(
            ethers.ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const receipt = await this.blockchainService.claimVoterReward(paranetId, blockchain);

        return {
            operation: receipt,
            transactionHash: receipt.transactionHash,
            status: receipt.status,
        };
    }

    /**
     * Claims operator reward for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for claiming reward.
     * @returns {Object} Object containing the transaction hash and status.
     * @example
     * await dkg.paranet.claimOperatorReward('paranetUAL123');
     */
    async claimOperatorReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.ethers.keccak256(
            ethers.ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const receipt = await this.blockchainService.claimOperatorReward(paranetId, blockchain);

        return {
            operation: receipt,
            transactionHash: receipt.transactionHash,
            status: receipt.status,
        };
    }

    /**
     * Gets the claimable miner reward for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @returns {number} Claimable miner reward value.
     * @example
     * const reward = await dkg.paranet.getClaimableMinerReward(paranetUAL);
     */
    async getClaimableMinerReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.ethers.keccak256(
            ethers.ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const claimableValue = await this.blockchainService.getClaimableKnowledgeMinerReward(
            paranetId,
            blockchain,
        );

        return claimableValue;
    }

    /**
     * Gets the claimable rewards for all miners of a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for getting the reward.
     * @returns {number} Claimable value for all miners.
     * @example
     * const reward = await dkg.paranet.getClaimableAllMinersReward(paranetUAL);
     */
    async getClaimableAllMinersReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.ethers.keccak256(
            ethers.ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const claimableValue = await this.blockchainService.getClaimableAllKnowledgeMinersReward(
            paranetId,
            blockchain,
        );

        return claimableValue;
    }

    /**
     * Gets the claimable voter reward for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for getting the reward.
     * @returns {number} Claimable voter reward value.
     * @example
     * const reward = await dkg.paranet.getClaimableVoterReward(paranetUAL);
     */
    async getClaimableVoterReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.ethers.keccak256(
            ethers.ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const claimableValue = await this.blockchainService.getClaimableVoterReward(
            paranetId,
            blockchain,
        );

        return claimableValue;
    }

    /**
     * Gets the claimable rewards for all voters of a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for getting the reward.
     * @returns {number} Claimable value for all voters.
     * @example
     * const reward = await dkg.paranet.getClaimableAllVotersReward(paranetUAL);
     */
    async getClaimableAllVotersReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.ethers.keccak256(
            ethers.ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const claimableValue = await this.blockchainService.getClaimableAllVotersReward(
            paranetId,
            blockchain,
        );

        return claimableValue;
    }

    /**
     * Gets the claimable operator reward for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for getting the reward.
     * @returns {number} Claimable operator reward value.
     * @example
     * const reward = await dkg.paranet.getClaimableOperatorReward(paranetUAL);
     */
    async getClaimableOperatorReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.ethers.keccak256(
            ethers.ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const claimableValue = await this.blockchainService.getClaimableOperatorReward(
            paranetId,
            blockchain,
        );

        return claimableValue;
    }

    /**
     * Updates claimable rewards for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for updating rewards.
     * @returns {Object} Object containing transaction hash and status.
     * @example
     * await dkg.paranet.updateClaimableRewards(paranetUAL);
     */
    async updateClaimableRewards(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.ethers.keccak256(
            ethers.ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const updatingKnowledgeAssetStates =
            await this.blockchainService.getUpdatingKnowledgeAssetStates(
                { miner: blockchain.publicKey, paranetId },
                blockchain,
            );
        if (updatingKnowledgeAssetStates.length > 0) {
            const receipt = await this.blockchainService.updateClaimableRewards(
                {
                    contract,
                    tokenId,
                    start: 0,
                    end: updatingKnowledgeAssetStates.length,
                },
                blockchain,
            );

            return {
                operation: receipt,
                transactionHash: receipt.transactionHash,
                status: receipt.status,
            };
        }

        return {
            status: 'No updated knowledge assets.',
        };
    }

    /**
     * Checks if an address is a knowledge miner for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {string} options.roleAddress - Optional parameter, if not provided checks for the wallet that is given to the blockchain module.
     * @returns {boolean} True if the address is a knowledge miner, otherwise false.
     * @example
     * const isMiner = await dkg.paranet.isKnowledgeMiner('paranetUAL123', { roleAddress: '0xMinerAddress' });
     */
    async isKnowledgeMiner(paranetUAL, options = {}) {
        // eslint-disable-next-line prefer-const
        let { blockchain, roleAddress } = this.inputService.getParanetRoleCheckArguments(options);
        if (roleAddress == null) {
            roleAddress = blockchain.publicKey;
        }
        this.validationService.validateParanetRoleCheckArguments(
            roleAddress,
            paranetUAL,
            blockchain,
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.ethers.keccak256(
            ethers.ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const isParanetKnowledgeMiner = await this.blockchainService.isParanetKnowledgeMiner(
            roleAddress,
            paranetId,
            blockchain,
        );

        return isParanetKnowledgeMiner;
    }

    /**
     * Checks if an address is a Paranet operator.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {string} options.roleAddress - Optional parameter, if not provided checks for the wallet that is given to the blockchain module.
     * @returns {boolean} True if the address is a Paranet operator, otherwise false.
     * @example
     * const isOperator = await dkg.paranet.isParanetOperator('paranetUAL123', { roleAddress: '0xOperatorAddress' });
     */
    async isParanetOperator(paranetUAL, options = {}) {
        // eslint-disable-next-line prefer-const
        let { blockchain, roleAddress } = this.inputService.getParanetRoleCheckArguments(options);
        if (roleAddress == null) {
            roleAddress = blockchain.publicKey;
        }
        this.validationService.validateParanetRoleCheckArguments(
            roleAddress,
            paranetUAL,
            blockchain,
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.ethers.keccak256(
            ethers.ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const isParanetOperator = await this.blockchainService.isParanetOperator(
            roleAddress,
            paranetId,
            blockchain,
        );

        return isParanetOperator;
    }

    /**
     * Checks if an address is a proposal voter for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {string} options.roleAddress - Optional parameter, if not provided checks for the wallet that is given to the blockchain module.
     * @returns {boolean} True if the address is a proposal voter, otherwise false.
     * @example
     * const isVoter = await dkg.paranet.isProposalVoter('paranetUAL123', { roleAddress: '0xVoterAddress' });
     */
    async isProposalVoter(paranetUAL, options = {}) {
        // eslint-disable-next-line prefer-const
        let { blockchain, roleAddress } = this.inputService.getParanetRoleCheckArguments(options);
        if (roleAddress == null) {
            roleAddress = blockchain.publicKey;
        }
        this.validationService.validateParanetRoleCheckArguments(
            roleAddress,
            paranetUAL,
            blockchain,
        );

        const { contract, tokenId } = resolveUAL(paranetUAL);
        const paranetId = ethers.ethers.keccak256(
            ethers.ethers.solidityPacked(['address', 'uint256'], [contract, tokenId]),
        );

        const isProposalVoter = await this.blockchainService.isParanetProposalVoter(
            roleAddress,
            paranetId,
            blockchain,
        );

        return isProposalVoter;
    }
}

class SocketService {
    publish() {}

    getOperationResult() {}
}

class HttpService {
    constructor(config = {}) {
        this.config = config;

        if (
            config.nodeApiVersion === '/' ||
            config.nodeApiVersion === '/latest' ||
            /^\/v\d+$/.test(config.nodeApiVersion)
        ) {
            this.apiVersion = config.nodeApiVersion;
        } else {
            this.apiVersion = '/v1';
        }
    }

    async info(endpoint, port, authToken) {
        try {
            const response = await axios({
                method: 'get',
                url: `${this.getBaseUrl(endpoint, port)}/info`,
                headers: this.prepareRequestConfig(authToken),
            });

            return response;
        } catch (error) {
            throw Error(`Unable to get node info: ${error.message}`);
        }
    }

    async localStore(endpoint, port, authToken, assertions, fullPathToCachedAssertion) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/local-store`,
                data: fullPathToCachedAssertion
                    ? { filePath: fullPathToCachedAssertion }
                    : assertions,
                headers: this.prepareRequestConfig(authToken),
            });

            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to store locally: ${error.message}`);
        }
    }

    async publish(
        endpoint,
        port,
        authToken,
        datasetRoot,
        dataset,
        blockchain,
        hashFunctionId,
        minimumNumberOfNodeReplications,
    ) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/publish`,
                data: {
                    datasetRoot,
                    dataset,
                    blockchain,
                    hashFunctionId,
                    minimumNumberOfNodeReplications,
                },
                headers: this.prepareRequestConfig(authToken),
            });

            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to publish: ${error.message}`);
        }
    }

    async publishParanet(
        endpoint,
        port,
        authToken,
        assertions,
        blockchain,
        contract,
        tokenId,
        hashFunctionId,
        paranetUAL,
        sender,
        txHash,
    ) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/publish-paranet`,
                data: {
                    assertions,
                    blockchain,
                    contract,
                    tokenId,
                    hashFunctionId,
                    paranetUAL,
                    sender,
                    txHash,
                },
                headers: this.prepareRequestConfig(authToken),
            });

            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to publish: ${error.message}`);
        }
    }

    async get(
        endpoint,
        port,
        authToken,
        UAL,
        state,
        includeMetadata,
        subjectUAL,
        contentType,
        hashFunctionId,
        paranetUAL,
    ) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/get`,
                data: {
                    id: state ? `${UAL}:${state}` : UAL,
                    contentType,
                    includeMetadata,
                    hashFunctionId,
                    paranetUAL,
                    subjectUAL,
                },
                headers: this.prepareRequestConfig(authToken),
            });

            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to get assertion: ${error.message}`);
        }
    }

    async update(
        endpoint,
        port,
        authToken,
        assertionId,
        assertion,
        blockchain,
        contract,
        tokenId,
        hashFunctionId,
    ) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/update`,
                data: {
                    assertionId,
                    assertion,
                    blockchain,
                    contract,
                    tokenId,
                    hashFunctionId,
                },
                headers: this.prepareRequestConfig(authToken),
            });

            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to update: ${error.message}`);
        }
    }

    async query(endpoint, port, authToken, query, type, paranetUAL, repository) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/query`,
                data: { query, type, repository, paranetUAL },
                headers: this.prepareRequestConfig(authToken),
            });
            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to query: ${error.message}`);
        }
    }

    async finality(
        endpoint,
        port,
        authToken,
        blockchain,
        ual,
        minimumNumberOfFinalizationConfirmations,
    ) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/ask`,
                data: {
                    ual,
                    blockchain,
                    minimumNumberOfNodeReplications: minimumNumberOfFinalizationConfirmations,
                },
                headers: this.prepareRequestConfig(authToken),
            });
            return response.data.operationId;
        } catch (error) {
            throw Error(`Unable to query: ${error.message}`);
        }
    }

    async finalityStatus(
        endpoint,
        port,
        authToken,
        ual,
        requiredConfirmations,
        maxNumberOfRetries,
        frequency,
    ) {
        let retries = 0;
        let finality = 0;

        const axios_config = {
            method: 'get',
            url: `${this.getBaseUrl(endpoint, port)}/finality`,
            params: { ual },
            headers: this.prepareRequestConfig(authToken),
        };

        do {
            if (retries > maxNumberOfRetries) {
                throw Error(
                    `Unable to achieve required confirmations. Max number of retries (${maxNumberOfRetries}) reached.`,
                );
            }

            retries += 1;

            // eslint-disable-next-line no-await-in-loop
            await sleepForMilliseconds(frequency * 1000);

            try {
                // eslint-disable-next-line no-await-in-loop
                const response = await axios(axios_config);
                finality = response.data.finality || 0;
            } catch (e) {
                finality = 0;
            }
        } while (finality < requiredConfirmations && retries <= maxNumberOfRetries);

        return finality;
    }

    async getOperationResult(
        endpoint,
        port,
        authToken,
        operation,
        maxNumberOfRetries,
        frequency,
        operationId,
    ) {
        let response = {
            status: OPERATION_STATUSES.PENDING,
        };
        let retries = 0;

        const axios_config = {
            method: 'get',
            url: `${this.getBaseUrl(endpoint, port)}/${operation}/${operationId}`,
            headers: this.prepareRequestConfig(authToken),
        };
        do {
            if (retries > maxNumberOfRetries) {
                response.data = {
                    ...response.data,
                    data: {
                        errorType: 'DKG_CLIENT_ERROR',
                        errorMessage: 'Unable to get results. Max number of retries reached.',
                    },
                };
                break;
            }
            retries += 1;
            // eslint-disable-next-line no-await-in-loop
            await sleepForMilliseconds(frequency * 1000);
            try {
                // eslint-disable-next-line no-await-in-loop
                response = await axios(axios_config);
            } catch (e) {
                response = { data: { status: 'NETWORK ERROR' } };
            }
        } while (
            response.data.status !== OPERATION_STATUSES.COMPLETED &&
            response.data.status !== OPERATION_STATUSES.FAILED &&
            !response.data.data?.minAcksReached
        );
        return response.data;
    }

    prepareRequestConfig(authToken) {
        if (authToken) {
            return { Authorization: `Bearer ${authToken}` };
        }

        return {};
    }

    getBaseUrl(endpoint, port) {
        return `${endpoint}:${port}${this.apiVersion}`;
    }
}

const Sockets = SocketService;
const Https = HttpService;
const Http = HttpService;
const Default = HttpService;

var NodeApiInterface = {
    Sockets,
    Https,
    Http,
    Default,
};

/* eslint-disable dot-notation */
/* eslint-disable no-await-in-loop */

const require$1 = module$1.createRequire((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('index.cjs', document.baseURI).href)));

const HubAbi = require$1('dkg-evm-module/abi/Hub.json');
const TokenAbi = require$1('dkg-evm-module/abi/Token.json');
const ParanetAbi = require$1('dkg-evm-module/abi/Paranet.json');
const ParanetsRegistryAbi = require$1('dkg-evm-module/abi/ParanetsRegistry.json');
const ParanetIncentivesPoolFactoryAbi = require$1('dkg-evm-module/abi/ParanetIncentivesPoolFactory.json');
const ParanetNeuroIncentivesPoolAbi = require$1('dkg-evm-module/abi/ParanetNeuroIncentivesPool.json');
const ParanetKnowledgeMinersRegistryAbi = require$1('dkg-evm-module/abi/ParanetKnowledgeMinersRegistry.json');
const IdentityStorageAbi = require$1('dkg-evm-module/abi/IdentityStorage.json');
const KnowledgeCollectionAbi = require$1('dkg-evm-module/abi/KnowledgeCollection.json');
const KnowledgeCollectionStorageAbi = require$1('dkg-evm-module/abi/KnowledgeCollectionStorage.json');
const AskStorageAbi = require$1('dkg-evm-module/abi/AskStorage.json');
const ChronosAbi = require$1('dkg-evm-module/abi/Chronos.json');
const PaymasterAbi = require$1('dkg-evm-module/abi/Paymaster.json');
const PaymasterManagerAbi = require$1('dkg-evm-module/abi/PaymasterManager.json');

class BlockchainServiceBase {
    constructor(config = {}) {
        this.config = config;
        this.events = {};
        this.abis = {};
        // this.abis.AssertionStorage = AssertionStorageAbi;
        this.abis.Hub = HubAbi;
        // this.abis.ServiceAgreementV1 = ServiceAgreementV1Abi;
        // this.abis.ServiceAgreementStorageProxy = ServiceAgreementStorageProxyAbi;
        // this.abis.ContentAssetStorage = ContentAssetStorageAbi;
        // this.abis.UnfinalizedStateStorage = UnfinalizedStateStorageAbi;
        // this.abis.ContentAsset = ContentAssetAbi;
        this.abis.Token = TokenAbi;
        this.abis.Paranet = ParanetAbi;
        this.abis.ParanetsRegistry = ParanetsRegistryAbi;
        this.abis.ParanetIncentivesPoolFactory = ParanetIncentivesPoolFactoryAbi;
        this.abis.ParanetNeuroIncentivesPool = ParanetNeuroIncentivesPoolAbi;
        this.abis.ParanetKnowledgeMinersRegistry = ParanetKnowledgeMinersRegistryAbi;
        this.abis.IdentityStorage = IdentityStorageAbi;
        this.abis.KnowledgeCollection = KnowledgeCollectionAbi;
        this.abis.KnowledgeCollectionStorage = KnowledgeCollectionStorageAbi;
        this.abis.AskStorage = AskStorageAbi;
        this.abis.Chronos = ChronosAbi;
        this.abis.Paymaster = PaymasterAbi;
        this.abis.PaymasterManager = PaymasterManagerAbi;

        this.abis.KnowledgeCollectionStorage.filter((obj) => obj.type === 'event').forEach(
            (event) => {
                const concatInputs = event.inputs.map((input) => input.internalType);

                this.events[event.name] = {
                    hash: Web3.utils.keccak256(`${event.name}(${concatInputs})`),
                    inputs: event.inputs,
                };
            },
        );
    }

    initializeWeb3() {
        // overridden by subclasses
        return {};
    }

    async decodeEventLogs() {
        // overridden by subclasses
    }

    async getPublicKey() {
        // overridden by subclasses
    }

    async ensureBlockchainInfo(blockchain) {
        if (!this[blockchain.name]) {
            this[blockchain.name] = {
                contracts: { [blockchain.hubContract]: {} },
                contractAddresses: {
                    [blockchain.hubContract]: {
                        Hub: blockchain.hubContract,
                    },
                },
            };

            const web3Instance = await this.getWeb3Instance(blockchain);
            this[blockchain.name].contracts[blockchain.hubContract].Hub =
                new web3Instance.eth.Contract(this.abis.Hub, blockchain.hubContract, {
                    from: blockchain.publicKey,
                });
        }
    }

    async getWeb3Instance(blockchain) {
        if (!this[blockchain.name].web3) {
            const blockchainOptions = {
                transactionPollingTimeout: blockchain.transactionPollingTimeout,
            };
            await this.initializeWeb3(blockchain.name, blockchain.rpc, blockchainOptions);
        }

        return this[blockchain.name].web3;
    }

    async getNetworkGasPrice(blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);

        try {
            let gasPrice;

            if (blockchain.name.startsWith('otp')) {
                gasPrice = await web3Instance.eth.getGasPrice();
            } else if (blockchain.name.startsWith('base')) {
                gasPrice = await web3Instance.eth.getGasPrice();
            } else if (blockchain.name.startsWith('gnosis')) {
                try {
                    const response = await axios.get(blockchain.gasPriceOracleLink);
                    gasPrice =
                        Number(response?.data?.average) * 1e9 || DEFAULT_GAS_PRICE_WEI.GNOSIS;
                } catch (e) {
                    gasPrice = DEFAULT_GAS_PRICE_WEI.GNOSIS;
                }
            } else {
                if (blockchain.name.startsWith('otp')) {
                    gasPrice = Web3.utils.toWei(DEFAULT_GAS_PRICE.OTP, 'Gwei');
                } else if (blockchain.name.startsWith('base')) {
                    gasPrice = Web3.utils.toWei(DEFAULT_GAS_PRICE.BASE, 'Gwei');
                } else {
                    gasPrice = Web3.utils.toWei(DEFAULT_GAS_PRICE.GNOSIS, 'Gwei');
                }
            }
            return gasPrice;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(
                `Failed to fetch the gas price from the network: ${error}. Using default value.`,
            );
            return Web3.utils.toWei(
                blockchain.name.startsWith('otp')
                    ? DEFAULT_GAS_PRICE.OTP
                    : blockchain.name.startsWith('base')
                      ? DEFAULT_GAS_PRICE.BASE
                      : DEFAULT_GAS_PRICE.GNOSIS,
                'Gwei',
            );
        }
    }

    async callContractFunction(contractName, functionName, args, blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        let contractInstance = await this.getContractInstance(contractName, blockchain);

        try {
            return await contractInstance.methods[functionName](...args).call();
        } catch (error) {
            if (/revert|VM Exception/i.test(error.message)) {
                let status;
                try {
                    status = await contractInstance.methods.status().call();
                } catch (_) {
                    status = false;
                }

                if (!status && contractName !== 'ParanetNeuroIncentivesPool') {
                    await this.updateContractInstance(contractName, blockchain, true);
                    contractInstance = await this.getContractInstance(contractName, blockchain);

                    return contractInstance.methods[functionName](...args).call();
                }
            }

            throw error;
        }
    }

    async prepareTransaction(contractInstance, functionName, args, blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);
        const publicKey = await this.getPublicKey(blockchain);
        const encodedABI = await contractInstance.methods[functionName](...args).encodeABI();

        let gasLimit = Number(
            await contractInstance.methods[functionName](...args).estimateGas({
                from: publicKey,
            }),
        );
        gasLimit = Math.round(gasLimit * blockchain.gasLimitMultiplier);

        let gasPrice;
        if (blockchain.previousTxGasPrice && blockchain.retryTx) {
            // Increase previous tx gas price by 20%
            gasPrice = Math.round(blockchain.previousTxGasPrice * 1.2);
        } else if (blockchain.forceReplaceTxs) {
            // Get the current transaction count (nonce) of the wallet, including pending transactions
            const currentNonce = await web3Instance.eth.getTransactionCount(publicKey, 'pending');

            // Get the transaction count of the wallet excluding pending transactions
            const confirmedNonce = await web3Instance.eth.getTransactionCount(publicKey, 'latest');

            // If there are any pending transactions
            if (currentNonce > confirmedNonce) {
                const pendingBlock = await web3Instance.eth.getBlock('pending', true);

                // Search for pending tx in the pending block
                const pendingTx = Object.values(pendingBlock.transactions).find(
                    (tx) =>
                        tx.from.toLowerCase() === publicKey.toLowerCase() &&
                        tx.nonce === confirmedNonce,
                );

                if (pendingTx) {
                    // If found, increase gas price of pending tx by 20%
                    gasPrice = Math.round(Number(pendingTx.gasPrice) * 1.2);
                } else {
                    // If not found, use default/network gas price increased by 20%
                    // Theoretically this should never happen
                    gasPrice = Math.round(
                        (blockchain.gasPrice || (await this.getNetworkGasPrice(blockchain))) * 1.2,
                    );
                }
            }
        } else {
            gasPrice = blockchain.gasPrice || (await this.getNetworkGasPrice(blockchain));
        }

        if (blockchain.simulateTxs) {
            await web3Instance.eth.call({
                to: contractInstance.options.address,
                data: encodedABI,
                from: publicKey,
                gasPrice,
                gas: gasLimit,
            });
        }

        return {
            from: publicKey,
            to: contractInstance.options.address,
            data: encodedABI,
            gasPrice,
            gas: gasLimit,
        };
    }

    async waitForTransactionFinalization(initialReceipt, blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);

        const startTime = Date.now();
        let reminingTime = 0;
        let receipt = initialReceipt;
        let finalized = false;

        try {
            while (
                !finalized &&
                Date.now() - startTime + reminingTime < blockchain.transactionFinalityMaxWaitTime
            ) {
                try {
                    // Check if the block containing the transaction is finalized
                    const finalizedBlockNumber = (await web3Instance.eth.getBlock('finalized'))
                        .number;
                    if (finalizedBlockNumber >= receipt.blockNumber) {
                        finalized = true;
                        break;
                    } else {
                        let currentReceipt = await web3Instance.eth.getTransactionReceipt(
                            receipt.transactionHash,
                        );
                        if (currentReceipt && currentReceipt.blockNumber === receipt.blockNumber) {
                            // Transaction is still in the same block, wait and check again
                        } else if (
                            currentReceipt &&
                            currentReceipt.blockNumber !== receipt.blockNumber
                        ) {
                            // Transaction has been re-included in a different block
                            receipt = currentReceipt; // Update the receipt with the new block information
                        } else {
                            // Transaction is no longer mined, wait for it to be mined again
                            const reminingStartTime = Date.now();
                            while (
                                !currentReceipt &&
                                Date.now() - reminingStartTime <
                                    blockchain.transactionReminingMaxWaitTime
                            ) {
                                await sleepForMilliseconds(
                                    blockchain.transactionReminingPollingInterval,
                                );
                                currentReceipt = await web3Instance.eth.getTransactionReceipt(
                                    receipt.transactionHash,
                                );
                            }
                            if (!currentReceipt) {
                                throw new Error(
                                    'Transaction was not re-mined within the expected time frame.',
                                );
                            }
                            reminingTime = Date.now() - reminingStartTime;
                            receipt = currentReceipt; // Update the receipt
                        }
                        // Wait before the next check
                        await sleepForMilliseconds(blockchain.transactionFinalityPollingInterval);
                    }
                } catch (error) {
                    throw new Error(`Error during finality polling: ${error.message}`);
                }
            }

            if (!finalized) {
                throw new Error('Transaction was not finalized within the expected time frame.');
            }

            return receipt;
        } catch (error) {
            throw new Error(`Failed to wait for transaction finalization: ${error.message}`);
        }
    }

    async getContractAddress(contractName, blockchain, force = false) {
        await this.ensureBlockchainInfo(blockchain);

        if (
            force ||
            !this[blockchain.name].contractAddresses[blockchain.hubContract][contractName]
        ) {
            this[blockchain.name].contractAddresses[blockchain.hubContract][contractName] =
                await this.callContractFunction(
                    'Hub',
                    contractName.includes('AssetStorage') ||
                        contractName.includes('CollectionStorage')
                        ? 'getAssetStorageAddress'
                        : 'getContractAddress',
                    [contractName],
                    blockchain,
                );
        }
        return this[blockchain.name].contractAddresses[blockchain.hubContract][contractName];
    }

    async updateContractInstance(contractName, blockchain, force = false) {
        await this.ensureBlockchainInfo(blockchain);
        await this.getContractAddress(contractName, blockchain, force);

        if (force || !this[blockchain.name].contracts[blockchain.hubContract][contractName]) {
            const web3Instance = await this.getWeb3Instance(blockchain);
            this[blockchain.name].contracts[blockchain.hubContract][contractName] =
                await new web3Instance.eth.Contract(
                    this.abis[contractName],
                    this[blockchain.name].contractAddresses[blockchain.hubContract][contractName],
                    { from: blockchain.publicKey },
                );
        }
    }

    async getContractInstance(contractName, blockchain) {
        await this.updateContractInstance(contractName, blockchain);
        return this[blockchain.name].contracts[blockchain.hubContract][contractName];
    }

    async increaseKnowledgeCollectionAllowance(sender, tokenAmount, blockchain) {
        const knowledgeCollectionAddress = await this.getContractAddress(
            'KnowledgeCollection',
            blockchain,
        );

        const allowance = await this.callContractFunction(
            'Token',
            'allowance',
            [sender, knowledgeCollectionAddress],
            blockchain,
        );

        const allowanceGap = BigInt(tokenAmount) - BigInt(allowance);

        if (allowanceGap > 0) {
            await this.executeContractFunction(
                'Token',
                'increaseAllowance',
                [knowledgeCollectionAddress, allowanceGap],
                blockchain,
            );

            return {
                allowanceIncreased: true,
                allowanceGap,
            };
        }

        return {
            allowanceIncreased: false,
            allowanceGap,
        };
    }

    // Knowledge assets operations

    async createKnowledgeCollection(
        requestData,
        paranetKaContract,
        paranetTokenId,
        blockchain,
        paymaster = null, 
        stepHooks = emptyHooks,
    ) {
        const sender = paymaster || await this.getPublicKey(blockchain); 

        try {
            let allowanceIncreased, allowanceGap;

            if (requestData?.payer) {
                // Handle the case when payer is passed
            } else {
                ({ allowanceIncreased, allowanceGap } =
                    await this.increaseKnowledgeCollectionAllowance(
                        sender,
                        requestData.tokenAmount,
                        blockchain,
                    ));
            }

            stepHooks.afterHook({
                status: OPERATIONS_STEP_STATUS.INCREASE_ALLOWANCE_COMPLETED,
            });

            let receipt;
            if (paranetKaContract == null && paranetTokenId == null) {
                receipt = await this.executeContractFunction(
                    'KnowledgeCollection',
                    'createKnowledgeCollection',
                    [...Object.values(requestData)],
                    blockchain,
                );
            } else {
                receipt = await this.executeContractFunction(
                    'Paranet',
                    'mintKnowledgeAsset',
                    [paranetKaContract, paranetTokenId, Object.values(requestData)],
                    blockchain,
                );
            }

            let { id } = await this.decodeEventLogs(
                receipt,
                'KnowledgeCollectionCreated',
                blockchain,
            );

            id = parseInt(id, 10);

            stepHooks.afterHook({
                status: OPERATIONS_STEP_STATUS.CREATE_ASSET_COMPLETED,
                data: { id },
            });

            return { knowledgeCollectionId: id, receipt };
        } catch (error) {
            throw error;
        }
    }

    async hasPendingUpdate(tokenId, blockchain) {
        return this.callContractFunction(
            'UnfinalizedStateStorage',
            'hasPendingUpdate',
            [tokenId],
            blockchain,
        );
    }

    async cancelAssetUpdate(tokenId, blockchain) {
        return this.executeContractFunction(
            'ContentAsset',
            'cancelAssetStateUpdate',
            [tokenId],
            blockchain,
        );
    }

    async getLatestAssertionId(tokenId, blockchain) {
        return this.callContractFunction(
            'ContentAssetStorage',
            'getLatestAssertionId',
            [tokenId],
            blockchain,
        );
    }

    async getUnfinalizedState(tokenId, blockchain) {
        return this.callContractFunction(
            'UnfinalizedStateStorage',
            'getUnfinalizedState',
            [tokenId],
            blockchain,
        );
    }

    async getAssetOwner(tokenId, blockchain) {
        return this.callContractFunction('ContentAssetStorage', 'ownerOf', [tokenId], blockchain);
    }

    async burnAsset(tokenId, blockchain) {
        return this.executeContractFunction('ContentAsset', 'burnAsset', [tokenId], blockchain);
    }

    // async extendAssetStoringPeriod(tokenId, epochsNumber, tokenAmount, blockchain) {
    //     const sender = await this.getPublicKey(blockchain);
    //     let serviceAgreementV1Address;
    //     let allowanceIncreased = false;
    //     let allowanceGap = 0;

    //     try {
    //         serviceAgreementV1Address = await this.getContractAddress(
    //             'ServiceAgreementV1',
    //             blockchain,
    //         );

    //         ({ allowanceIncreased, allowanceGap } = await this.increaseServiceAgreementV1Allowance(
    //             sender,
    //             serviceAgreementV1Address,
    //             tokenAmount,
    //             blockchain,
    //         ));

    //         return this.executeContractFunction(
    //             'ContentAsset',
    //             'extendAssetStoringPeriod',
    //             [tokenId, epochsNumber, tokenAmount],
    //             blockchain,
    //         );
    //     } catch (error) {
    //         if (allowanceIncreased) {
    //             await this.executeContractFunction(
    //                 'Token',
    //                 'decreaseAllowance',
    //                 [serviceAgreementV1Address, allowanceGap],
    //                 blockchain,
    //             );
    //         }
    //         throw error;
    //     }
    // }

    // async addTokens(tokenId, tokenAmount, blockchain) {
    //     const sender = await this.getPublicKey(blockchain);
    //     let serviceAgreementV1Address;
    //     let allowanceIncreased = false;
    //     let allowanceGap = 0;

    //     try {
    //         serviceAgreementV1Address = await this.getContractAddress(
    //             'ServiceAgreementV1',
    //             blockchain,
    //         );

    //         ({ allowanceIncreased, allowanceGap } = await this.increaseServiceAgreementV1Allowance(
    //             sender,
    //             serviceAgreementV1Address,
    //             tokenAmount,
    //             blockchain,
    //         ));

    //         return this.executeContractFunction(
    //             'ContentAsset',
    //             'increaseAssetTokenAmount',
    //             [tokenId, tokenAmount],
    //             blockchain,
    //         );
    //     } catch (error) {
    //         if (allowanceIncreased) {
    //             await this.executeContractFunction(
    //                 'Token',
    //                 'decreaseAllowance',
    //                 [serviceAgreementV1Address, allowanceGap],
    //                 blockchain,
    //             );
    //         }
    //         throw error;
    //     }
    // }

    // async addUpdateTokens(tokenId, tokenAmount, blockchain) {
    //     const sender = await this.getPublicKey(blockchain);
    //     let serviceAgreementV1Address;
    //     let allowanceIncreased = false;
    //     let allowanceGap = 0;

    //     try {
    //         serviceAgreementV1Address = await this.getContractAddress(
    //             'ServiceAgreementV1',
    //             blockchain,
    //         );

    //         ({ allowanceIncreased, allowanceGap } = await this.increaseServiceAgreementV1Allowance(
    //             sender,
    //             serviceAgreementV1Address,
    //             tokenAmount,
    //             blockchain,
    //         ));

    //         return this.executeContractFunction(
    //             'ContentAsset',
    //             'increaseAssetUpdateTokenAmount',
    //             [tokenId, tokenAmount],
    //             blockchain,
    //         );
    //     } catch (error) {
    //         if (allowanceIncreased) {
    //             await this.executeContractFunction(
    //                 'Token',
    //                 'decreaseAllowance',
    //                 [serviceAgreementV1Address, allowanceGap],
    //                 blockchain,
    //             );
    //         }
    //         throw error;
    //     }
    // }

    async getAssertionIdByIndex(tokenId, index, blockchain) {
        return this.callContractFunction(
            'ContentAssetStorage',
            'getAssertionIdByIndex',
            [tokenId, index],
            blockchain,
        );
    }

    async getAssertionIds(tokenId, blockchain) {
        return this.callContractFunction(
            'ContentAssetStorage',
            'getAssertionIds',
            [tokenId],
            blockchain,
        );
    }

    async getAssertionIssuer(tokenId, assertionId, assertionIndex, blockchain) {
        return this.callContractFunction(
            'ContentAssetStorage',
            'getAssertionIssuer',
            [tokenId, assertionId, assertionIndex],
            blockchain,
        );
    }

    async getAgreementData(agreementId, blockchain) {
        const result = await this.callContractFunction(
            'ServiceAgreementStorageProxy',
            'getAgreementData',
            [agreementId],
            blockchain,
        );

        return {
            startTime: Number(result['0']),
            epochsNumber: Number(result['1']),
            epochLength: Number(result['2']),
            tokenAmount: result['3'][0],
            addedTokenAmount: result['3'][1],
            scoreFunctionId: result['4'][0],
            proofWindowOffsetPerc: result['4'][1],
        };
    }

    async getAssertionSize(assertionId, blockchain) {
        return this.callContractFunction(
            'AssertionStorage',
            'getAssertionSize',
            [assertionId],
            blockchain,
        );
    }

    // Paranets operations

    async registerParanet(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'registerParanet',
            Object.values(requestData),
            blockchain,
        );
    }

    async addParanetCuratedNodes(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'addParanetCuratedNodes',
            Object.values(requestData),
            blockchain,
        );
    }

    async removeParanetCuratedNodes(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'removeParanetCuratedNodes',
            Object.values(requestData),
            blockchain,
        );
    }

    async requestParanetCuratedNodeAccess(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'requestParanetCuratedNodeAccess',
            Object.values(requestData),
            blockchain,
        );
    }

    async approveCuratedNode(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'approveCuratedNode',
            Object.values(requestData),
            blockchain,
        );
    }

    async rejectCuratedNode(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'rejectCuratedNode',
            Object.values(requestData),
            blockchain,
        );
    }

    async getCuratedNodes(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetsRegistry',
            'getCuratedNodes',
            Object.values(requestData),
            blockchain,
        );
    }

    async getKnowledgeMiners(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetsRegistry',
            'getKnowledgeMiners',
            Object.values(requestData),
            blockchain,
        );
    }

    async addParanetCuratedMiners(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'addParanetCuratedMiners',
            Object.values(requestData),
            blockchain,
        );
    }

    async removeParanetCuratedMiners(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'removeParanetCuratedMiners',
            Object.values(requestData),
            blockchain,
        );
    }

    async requestParanetCuratedMinerAccess(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'requestParanetCuratedMinerAccess',
            Object.values(requestData),
            blockchain,
        );
    }

    async approveCuratedMiner(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'approveCuratedMiner',
            Object.values(requestData),
            blockchain,
        );
    }

    async rejectCuratedMiner(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'rejectCuratedMiner',
            Object.values(requestData),
            blockchain,
        );
    }

    async deployNeuroIncentivesPool(requestData, blockchain) {
        return this.executeContractFunction(
            'ParanetIncentivesPoolFactory',
            'deployNeuroIncentivesPool',
            Object.values(requestData),
            blockchain,
        );
    }

    async registerParanetService(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'registerParanetService',
            Object.values(requestData),
            blockchain,
        );
    }

    async addParanetServices(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'addParanetServices',
            Object.values(requestData),
            blockchain,
        );
    }

    async submitToParanet(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'submitKnowledgeAsset',
            Object.values(requestData),
            blockchain,
        );
    }

    async getUpdatingKnowledgeAssetStates(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetKnowledgeMinersRegistry',
            'getUpdatingKnowledgeAssetStates',
            Object.values(requestData),
            blockchain,
        );
    }

    async updateClaimableRewards(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'processUpdatedKnowledgeAssetStatesMetadata',
            Object.values(requestData),
            blockchain,
        );
    }

    async getIncentivesPoolAddress(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetsRegistry',
            'getIncentivesPoolAddress',
            Object.values(requestData),
            blockchain,
        );
    }

    async getNeuroIncentivesPoolAddress(paranetId, blockchain) {
        return this.getIncentivesPoolAddress(
            {
                paranetId,
                incentivesPoolType: 'Neuroweb',
            },
            blockchain,
        );
    }

    async setIncentivesPool(contractAddress, blockchain) {
        await this.ensureBlockchainInfo(blockchain);

        if (
            this[blockchain.name].contractAddresses[blockchain.hubContract][
                'ParanetNeuroIncentivesPool'
            ] !== contractAddress
        ) {
            this[blockchain.name].contractAddresses[blockchain.hubContract][
                'ParanetNeuroIncentivesPool'
            ] = contractAddress;
            const web3Instance = await this.getWeb3Instance(blockchain);
            this[blockchain.name].contracts[blockchain.hubContract]['ParanetNeuroIncentivesPool'] =
                await new web3Instance.eth.Contract(
                    this.abis['ParanetNeuroIncentivesPool'],
                    this[blockchain.name].contractAddresses[blockchain.hubContract][
                        'ParanetNeuroIncentivesPool'
                    ],
                    { from: blockchain.publicKey },
                );
        }
    }

    async claimKnowledgeMinerReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.executeContractFunction(
            'ParanetNeuroIncentivesPool',
            'claimKnowledgeMinerReward',
            [],
            blockchain,
        );
    }

    async claimVoterReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.executeContractFunction(
            'ParanetNeuroIncentivesPool',
            'claimIncentivizationProposalVoterReward',
            [],
            blockchain,
        );
    }

    async claimOperatorReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.executeContractFunction(
            'ParanetNeuroIncentivesPool',
            'claimParanetOperatorReward',
            [],
            blockchain,
        );
    }

    async getClaimableKnowledgeMinerReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'getClaimableKnowledgeMinerRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableAllKnowledgeMinersReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'getClaimableAllKnowledgeMinersRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableVoterReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'getClaimableProposalVoterRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableAllVotersReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'getClaimableAllProposalVotersRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableOperatorReward(paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'getClaimableParanetOperatorRewardAmount',
            [],
            blockchain,
        );
    }

    async isParanetKnowledgeMiner(address, paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'isKnowledgeMiner',
            [address],
            blockchain,
        );
    }

    async isParanetOperator(address, paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'isParanetOperator',
            [address],
            blockchain,
        );
    }

    async isParanetProposalVoter(address, paranetId, blockchain) {
        const neuroIncentivesPoolAddress = await this.getNeuroIncentivesPoolAddress(
            paranetId,
            blockchain,
        );

        await this.setIncentivesPool(neuroIncentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetNeuroIncentivesPool',
            'isProposalVoter',
            [address],
            blockchain,
        );
    }

    // Identity operations
    async getIdentityId(operationalWallet, blockchain) {
        return this.callContractFunction(
            'IdentityStorage',
            'getIdentityId',
            [operationalWallet],
            blockchain,
        );
    }

    // Get ask operations
    // To get price, multiply with size in bytes and epochs
    async getStakeWeightedAverageAsk(blockchain) {
        return this.callContractFunction(
            'AskStorage',
            'getStakeWeightedAverageAsk',
            [],
            blockchain,
        );
    }

    // Blockchain operations

    async getChainId(blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);

        return web3Instance.eth.getChainId();
    }

    async getBlockchainTimestamp(blockchain) {
        if (!blockchain.name.startsWith('hardhat')) return Math.floor(Date.now() / 1000);

        const latestBlock = await this.getLatestBlock(blockchain);
        return latestBlock.timestamp;
    }

    async getGasPrice(blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);
        try {
            let gasPrice;
            if (blockchain.name.startsWith('otp') || blockchain.name.startsWith('base')) {
                gasPrice = await web3Instance.eth.getGasPrice();
            } else if (blockchain.name.startsWith('gnosis')) {
                const response = await axios.get(blockchain.gasPriceOracleLink);
                if (blockchain.name.split(':')[1] === '100') {
                    gasPrice = Number(response.result, 10);
                } else if (blockchain.name.split(':')[1] === '10200') {
                    gasPrice = Math.round(response.data.average * 1e9);
                }
            } else {
                gasPrice = Web3.utils.toWei(
                    blockchain.name.startsWith('otp')
                        ? DEFAULT_GAS_PRICE.OTP
                        : DEFAULT_GAS_PRICE.GNOSIS,
                    'Gwei',
                );
            }
            return gasPrice;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(`Failed to fetch the gas price from the network: ${error}. `);
            return Web3.utils.toWei(
                blockchain.name.startsWith('otp')
                    ? DEFAULT_GAS_PRICE.OTP
                    : blockchain.name.startsWith('base')
                      ? DEFAULT_GAS_PRICE.BASE
                      : DEFAULT_GAS_PRICE.GNOSIS,
                'Gwei',
            );
        }
    }

    async getWalletBalances(blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);
        const publicKey = await this.getPublicKey(blockchain);

        const blockchainTokenBalance = await web3Instance.eth.getBalance(publicKey);
        const tracBalance = await this.callContractFunction(
            'Token',
            'balanceOf',
            [await this.getPublicKey(blockchain)],
            blockchain,
        );

        return {
            blockchainToken: blockchainTokenBalance,
            trac: tracBalance,
        };
    }

    async getLatestBlock(blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3 = await this.getWeb3Instance(blockchain);
        const blockNumber = await web3.eth.getBlockNumber();

        return web3.eth.getBlock(blockNumber);
    }

    async timeUntilNextEpoch(blockchain) {
        return this.callContractFunction('Chronos', 'timeUntilNextEpoch', [], blockchain);
    }

    async epochLength(blockchain) {
        return this.callContractFunction('Chronos', 'epochLength', [], blockchain);
    }

    async keyIsOperationalWallet(blockchain, identityId, signer) {
        const result = await this.callContractFunction(
            'IdentityStorage',
            'keyHasPurpose',
            [
                identityId,
                ethers.solidityPackedKeccak256(['address'], [signer]),
                2, // IdentityLib.OPERATIONAL_KEY
            ],
            blockchain,
        );

        return result;
    }

    convertToWei(ether) {
        return Web3.utils.toWei(ether.toString(), 'ether');
    }

    //Paymaster functions
    async deployPaymasterContract(blockchain) {
        const paymasterAddressContract = await this.callContractFunction(
            'PaymasterManager',
            'constructor',
            [],
            blockchain,
        );

        let { paymasterAddress } = await this.decodeEventLogs(paymasterAddressContract, 'deployPaymaster', blockchain); 

        return paymasterAddress;
    }

    async addAllowedAddress(blockchain, public_adress) {
        return this.callContractFunction(
            'Paymaster',
            'addAllowedAddress',
            [public_adress],
            blockchain,
        );
    }

    async removeAllowedAddress(blockchain, public_adress) {
        return this.callContractFunction(
            'Paymaster',
            'removeAllowedAddress',
            [public_adress],
            blockchain,
        );
    }

    async fundPaymaster(blockchain, tokenAmount) {
        return this.callContractFunction('Paymaster', 'fundPaymaster', [tokenAmount], blockchain);
    }

    async withdrawPaymaster(blockchain, recipient, tokenAmount) {
        return this.callContractFunction(
            'Paymaster',
            'withdraw',
            [recipient, tokenAmount],
            blockchain,
        );
    }

    async coverCostPaymaster(blockchain, tokenAmount) {
        return this.callContractFunction('Paymaster', 'coverCost', [tokenAmount], blockchain);
    }
}

/* eslint-disable no-await-in-loop */

class BrowserBlockchainService extends BlockchainServiceBase {
    constructor(config = {}) {
        super(config);
        this.config = config;
    }

    async initializeWeb3(blockchainName, blockchainRpc) {
        if (typeof window.web3 === 'undefined' || !window.web3) {
            // eslint-disable-next-line no-console
            console.error(
                'No web3 implementation injected, please inject your own Web3 implementation.',
            );
        }
        if (window.ethereum) {
            this[blockchainName].web3 = new Web3(window.ethereum);

            try {
                // Request account access if needed
                await window.ethereum.enable();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
        } else if (blockchainRpc.startsWith('ws')) {
            const provider = new Web3().providers.WebsocketProvider(
                blockchainRpc,
                WEBSOCKET_PROVIDER_OPTIONS,
            );
            this[blockchainName].web3 = new Web3(provider);
        } else {
            this[blockchainName].web3 = new Web3(blockchainRpc);
        }
    }

    async decodeEventLogs(receipt, eventName, blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);
        let result;
        const { hash, inputs } = this.events[eventName];

        const logs = Object.values(receipt.events);
        for (const log of logs) {
            if (log.raw.topics && log.raw.topics.length > 0 && log.raw.topics[0] === hash) {
                result = web3Instance.eth.abi.decodeLog(
                    inputs,
                    log.raw.data,
                    log.raw.topics.slice(1),
                );
                break;
            }
        }
        return result;
    }

    async executeContractFunction(contractName, functionName, args, blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        let contractInstance = await this.getContractInstance(contractName, blockchain);
        let tx;

        try {
            tx = await this.prepareTransaction(contractInstance, functionName, args, blockchain);

            let receipt = await contractInstance.methods[functionName](...args).send(tx);
            if (blockchain.name.startsWith('otp') && blockchain.waitNeurowebTxFinalization) {
                receipt = await this.waitForTransactionFinalization(receipt, blockchain);
            }
            return receipt;
        } catch (error) {
            if (/revert|VM Exception/i.test(error.message)) {
                let status;
                try {
                    status = await contractInstance.methods.status().call();
                } catch (_) {
                    status = false;
                }

                if (!status) {
                    await this.updateContractInstance(contractName, blockchain, true);
                    contractInstance = await this.getContractInstance(contractName, blockchain);
                    const web3Instance = await this.getWeb3Instance(blockchain);

                    await web3Instance.eth.call({
                        to: contractInstance.options.address,
                        data: tx.data,
                        from: tx.from,
                    });

                    return contractInstance.methods[functionName](...args).send(tx);
                }
            }

            throw error;
        }
    }

    async getPublicKey() {
        return this.getAccount();
    }

    async getAccount() {
        if (!this.account) {
            if (!window.ethereum) {
                throw Error('This operation can be performed only by using Metamask accounts.');
            }
            const accounts = await window.ethereum
                .request({
                    method: 'eth_requestAccounts',
                })
                // eslint-disable-next-line no-console
                .catch(() => console.error('There was an error fetching your accounts'));

            [this.account] = accounts;
        }
        return this.account;
    }

    async transferAsset(tokenId, to, blockchain) {
        return this.executeContractFunction(
            'ContentAssetStorage',
            'transferFrom',
            [await this.getAccount(), to, tokenId],
            blockchain,
        );
    }
}

/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */

class NodeBlockchainService extends BlockchainServiceBase {
    constructor(config = {}) {
        super(config);
        this.config = config;
        this.events = {};

        this.abis.KnowledgeCollectionStorage.filter((obj) => obj.type === 'event').forEach(
            (event) => {
                const concatInputs = event.inputs.map((input) => input.internalType);
                
                this.events[event.name] = {
                    hash: Web3.utils.keccak256(`${event.name}(${concatInputs})`),
                    inputs: event.inputs,
                };
            },
        );
    }

    initializeWeb3(blockchainName, blockchainRpc, blockchainOptions) {
        if (blockchainRpc.startsWith('ws')) {
            const provider = new Web3.providers.WebsocketProvider(
                blockchainRpc,
                WEBSOCKET_PROVIDER_OPTIONS,
            );

            this[blockchainName].web3 = new Web3(provider);
        } else {
            this[blockchainName].web3 = new Web3(blockchainRpc);
        }

        if (blockchainOptions.transactionPollingTimeout) {
            this[blockchainName].web3.eth.transactionPollingTimeout =
                blockchainOptions.transactionPollingTimeout;
        }
    }

    async decodeEventLogs(receipt, eventName, blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);
        let result;
        const { hash, inputs } = this.events[eventName];

        for (const log of receipt.logs) {
            if (log.topics && log.topics.length > 0 && log.topics[0] === hash) {
                result = web3Instance.eth.abi.decodeLog(inputs, log.data, log.topics.slice(1));
                break;
            }
        }
        return result;
    }

    async getPublicKey(blockchain) {
        return blockchain?.publicKey;
    }

    async executeContractFunction(contractName, functionName, args, blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);
        let contractInstance = await this.getContractInstance(contractName, blockchain);

        let receipt;
        let previousTxGasPrice;
        let simulationSucceeded = false;
        let transactionRetried = false;

        while (receipt === undefined) {
            try {
                const tx = await this.prepareTransaction(
                    contractInstance,
                    functionName,
                    args,
                    blockchain,
                );
                previousTxGasPrice = tx.gasPrice;
                simulationSucceeded = true;

                const createdTransaction = await web3Instance.eth.accounts.signTransaction(
                    tx,
                    blockchain.privateKey,
                );

                receipt = await web3Instance.eth.sendSignedTransaction(
                    createdTransaction.rawTransaction,
                );
                if (blockchain.name.startsWith('otp') && blockchain.waitNeurowebTxFinalization) {
                    receipt = await this.waitForTransactionFinalization(receipt, blockchain);
                }
            } catch (error) {
                if (
                    simulationSucceeded &&
                    !transactionRetried &&
                    blockchain.handleNotMinedError &&
                    TRANSACTION_RETRY_ERRORS.some((errorMsg) =>
                        error.message.toLowerCase().includes(errorMsg),
                    )
                ) {
                    transactionRetried = true;
                    blockchain.retryTx = true;
                    blockchain.previousTxGasPrice = previousTxGasPrice;
                } else if (!transactionRetried && /revert|VM Exception/i.test(error.message)) {
                    let status;
                    try {
                        status = await contractInstance.methods.status().call();
                    } catch (_) {
                        status = false;
                    }

                    if (!status && contractName !== 'ParanetNeuroIncentivesPool') {
                        await this.updateContractInstance(contractName, blockchain, true);
                        contractInstance = await this.getContractInstance(contractName, blockchain);
                        transactionRetried = true;
                        blockchain.retryTx = true;
                    } else {
                        throw error;
                    }
                } else {
                    throw error;
                }
            }
        }

        return receipt;
    }

    async transferAsset(tokenId, to, blockchain) {
        return this.executeContractFunction(
            'ContentAssetStorage',
            'transferFrom',
            [blockchain.publicKey, to, tokenId],
            blockchain,
        );
    }
}

const Browser = BrowserBlockchainService;
const Node = NodeBlockchainService;

var BlockchainInterface = {
    Browser,
    Node,
};

class ValidationService {
    validateNodeInfo(endpoint, port, authToken) {
        this.validateEndpoint(endpoint);
        this.validatePort(port);
        this.validateAuthToken(authToken);
    }

    validateGraphQuery(
        queryString,
        queryType,
        endpoint,
        port,
        maxNumberOfRetries,
        frequency,
        authToken,
        repository,
    ) {
        this.validateQueryString(queryString);
        this.validateQueryType(queryType);
        this.validateEndpoint(endpoint);
        this.validatePort(port);
        this.validateMaxNumberOfRetries(maxNumberOfRetries);
        this.validateFrequency(frequency);
        this.validateAuthToken(authToken);

        if (repository) {
            this.validateRepository(repository);
        }
    }

    validateIsValidUAL(blockchain) {
        this.validateBlockchain(blockchain);
    }

    validateSetAllowance(blockchain) {
        this.validateBlockchain(blockchain);
    }

    validateIncreaseAllowance(blockchain) {
        this.validateBlockchain(blockchain);
    }

    validateDecreaseAllowance(blockchain) {
        this.validateBlockchain(blockchain);
    }

    validateAssetCreate(
        content,
        blockchain,
        endpoint,
        port,
        maxNumberOfRetries,
        frequency,
        epochsNum,
        hashFunctionId,
        scoreFunctionId,
        immutable,
        tokenAmount,
        authToken,
        payer,
        minimumNumberOfFinalizationConfirmations,
        minimumNumberOfNodeReplications,
    ) {
        this.validateContent(content);
        this.validateBlockchain(blockchain, OPERATIONS.PUBLISH);
        this.validateEndpoint(endpoint);
        this.validatePort(port);
        this.validateMaxNumberOfRetries(maxNumberOfRetries);
        this.validateFrequency(frequency);
        this.validateEpochsNum(epochsNum);
        this.validateHashFunctionId(hashFunctionId);
        this.validateScoreFunctionId(scoreFunctionId);
        this.validateImmutable(immutable);
        this.validateTokenAmount(tokenAmount);
        this.validateAuthToken(authToken);
        this.validatePayer(payer);
        this.validateMinimumNumberOfFinalizationConfirmations(
            minimumNumberOfFinalizationConfirmations,
        );
        this.validateMinimumNumberOfNodeReplications(minimumNumberOfNodeReplications);
    }

    validateAssetGet(
        UAL,
        blockchain,
        endpoint,
        port,
        maxNumberOfRetries,
        frequency,
        state,
        includeMetadata,
        contentType,
        hashFunctionId,
        validate,
        outputFormat,
        authToken,
        subjectUAL,
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain, OPERATIONS.GET);
        this.validateEndpoint(endpoint);
        this.validatePort(port);
        this.validateMaxNumberOfRetries(maxNumberOfRetries);
        this.validateFrequency(frequency);
        this.validateState(state);
        this.validateIncludeMetadata(includeMetadata);
        this.validateContentType(contentType);
        this.validateHashFunctionId(hashFunctionId);
        this.validateValidate(validate);
        this.validateOutputFormat(outputFormat);
        this.validateAuthToken(authToken);
        this.validateSubjectUAL(subjectUAL);
    }

    validateAssetUpdate(
        content,
        blockchain,
        endpoint,
        port,
        maxNumberOfRetries,
        frequency,
        hashFunctionId,
        scoreFunctionId,
        tokenAmount,
        authToken,
        payer,
    ) {
        this.validateContent(content);
        this.validateBlockchain(blockchain, OPERATIONS.UPDATE);
        this.validateEndpoint(endpoint);
        this.validatePort(port);
        this.validateMaxNumberOfRetries(maxNumberOfRetries);
        this.validateFrequency(frequency);
        this.validateHashFunctionId(hashFunctionId);
        this.validateScoreFunctionId(scoreFunctionId);
        this.validateTokenAmount(tokenAmount);
        this.validateAuthToken(authToken);
        this.validatePayer(payer);
    }

    validateAssetTransfer(UAL, newOwner, blockchain) {
        this.validateUAL(UAL);
        this.validateNewOwner(newOwner);
        this.validateBlockchain(blockchain);
    }

    validateAssetGetOwner(UAL, blockchain) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateAssetGetStateIssuer(UAL, stateIndex, blockchain) {
        this.validateUAL(UAL);
        this.validateStateIndex(stateIndex);
        this.validateBlockchain(blockchain);
    }

    validateAssetGetStates(UAL, blockchain) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateAssetGetLatestStateIssuer(UAL, blockchain) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateAssetBurn(UAL, blockchain) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateExtendAssetStoringPeriod(UAL, epochsNum, tokenAmount, blockchain) {
        this.validateUAL(UAL);
        this.validateEpochsNum(epochsNum);
        this.validateTokenAmount(tokenAmount);
        this.validateBlockchain(blockchain);
    }

    validateAddTokens(UAL, tokenAmount, blockchain) {
        this.validateUAL(UAL);
        this.validateTokenAmount(tokenAmount);
        this.validateBlockchain(blockchain);
    }

    validateGetIdentityId(operational, blockchain) {
        this.validateAddress(operational);
        this.validateBlockchain(blockchain);
    }

    validateParanetCreate(
        UAL,
        blockchain,
        paranetName,
        paranetDescription,
        paranetNodesAccessPolicy,
        paranetMinersAccessPolicy,
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
        this.validateParanetName(paranetName);
        this.validateParanetDescription(paranetDescription);
        this.validateParanetNodesAccessPolicy(paranetNodesAccessPolicy);
        this.validateParanetMinersAccessPolicy(paranetMinersAccessPolicy);
    }

    validateParanetAddCuratedNodes(UAL, blockchain, identityIds) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);

        for (const identityId of identityIds) {
            this.validateIdentityId(identityId);
        }
    }

    validateParanetRemoveCuratedNodes(UAL, blockchain, identityIds) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);

        for (const identityId of identityIds) {
            this.validateIdentityId(identityId);
        }
    }

    validateRequestParanetCuratedNodeAccess(UAL, blockchain) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateApproveCuratedNode(UAL, blockchain, identityId) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
        this.validateIdentityId(identityId);
    }

    validateRejectCuratedNode(UAL, blockchain, identityId) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
        this.validateIdentityId(identityId);
    }

    validateGetCuratedNodes(UAL, blockchain) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateGetParanetKnowledgeMiners(UAL, blockchain) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateParanetAddCuratedMiners(UAL, blockchain, minerAddresses) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);

        for (const minerAddress of minerAddresses) {
            this.validateAddress(minerAddress);
        }
    }

    validateParanetRemoveCuratedMiners(UAL, blockchain, minerAddresses) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);

        for (const minerAddress of minerAddresses) {
            this.validateAddress(minerAddress);
        }
    }

    validateRequestParanetCuratedMinerAccess(UAL, blockchain) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateApproveCuratedMiner(UAL, blockchain, minerAddress) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
        this.validateAddress(minerAddress);
    }

    validateRejectCuratedMiner(UAL, blockchain, minerAddress) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
        this.validateAddress(minerAddress);
    }

    validateDeployIncentivesContract(
        UAL,
        blockchain,
        tracToNeuroEmissionMultiplier,
        operatorRewardPercentage,
        incentivizationProposalVotersRewardPercentage,
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
        this.validateTracToNeuroEmissionMultiplier(tracToNeuroEmissionMultiplier);
        this.validateOperatorRewardPercentage(operatorRewardPercentage);
        this.validateIncentivizationProposalVotersRewardPercentage(
            incentivizationProposalVotersRewardPercentage,
        );
    }

    validateParanetRewardArguments(UAL, blockchain) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateParanetRoleCheckArguments(address, UAL, blockchain) {
        this.validateAddress(address);
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateParanetCreateServiceArguments(
        UAL,
        paranetServiceName,
        paranetServiceDescription,
        paranetServiceAddresses,
        blockchain,
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
        this.validateParanetServiceName(paranetServiceName);
        this.validateParanetServiceDescription(paranetServiceDescription);
        this.validateParanetServiceAddresses(paranetServiceAddresses);
    }

    validateParanetAddServicesArguments(paranetUAL, paranetServiceUALs, blockchain) {
        this.validateUAL(paranetUAL);
        this.validateBlockchain(blockchain);

        for (const UAL of paranetServiceUALs) {
            this.validateUAL(UAL);
        }
    }

    validateSubmitToParanet(UAL, paranetUAL, blockchain) {
        this.validateUAL(UAL);
        this.validateUAL(paranetUAL);
        this.validateBlockchain(blockchain);
    }

    validateRequiredParam(paramName, param) {
        if (param == null) throw Error(`${paramName} is missing.`);
    }

    validateParamType(paramName, param, typeOrTypes) {
        const isTypesArray = Array.isArray(typeOrTypes);

        let parameter = param;
        if (isTypesArray && typeOrTypes.includes('number')) {
            const parsed = parseInt(param, 10);
            parameter = Number.isNaN(parsed) ? param : parsed;
        } else if (typeOrTypes === 'number') {
            parameter = parseInt(param, 10);
        }
        const types = isTypesArray ? typeOrTypes : [typeOrTypes];

        // eslint-disable-next-line valid-typeof
        if (!types.some((type) => typeof parameter === type)) {
            throw new Error(`${paramName} must be of type ${types.join(' or ')}.`);
        }
    }

    validateQueryString(queryString) {
        this.validateRequiredParam('queryString', queryString);
        this.validateParamType('queryString', queryString, 'string');
    }

    validateRepository(repository) {
        this.validateRequiredParam('repository', repository);
        this.validateParamType('repository', repository, 'string');
    }

    validateQueryType(queryType) {
        this.validateRequiredParam('queryType', queryType);
        const validQueryTypes = Object.values(QUERY_TYPES);
        if (!validQueryTypes.includes(queryType))
            throw Error(`Invalid query Type: available query types: ${validQueryTypes}`);
    }

    validateGraphLocation(graphLocation) {
        this.validateRequiredParam('graphLocation', graphLocation);
        const validGraphLocations = Object.keys(GRAPH_LOCATIONS);
        if (!validGraphLocations.includes(graphLocation)) {
            throw Error(`Invalid graph location: available locations are: ${validGraphLocations}`);
        }
    }

    validateGraphState(graphState) {
        this.validateRequiredParam('graphState', graphState);
        const validGraphStates = Object.keys(GRAPH_STATES);
        if (!validGraphStates.includes(graphState))
            throw Error(`Invalid graph state: available states: ${validGraphStates}`);
    }

    validateUAL(ual) {
        this.validateRequiredParam('UAL', ual);
        this.validateParamType('UAL', ual, 'string');

        const segments = ual.split(':');
        const argsString = segments.length === 3 ? segments[2] : `${segments[2]}:${segments[3]}`;
        const args = argsString.split('/');
        if (!(args?.length === 3 || args?.length === 4)) throw Error('Invalid UAL.');
        return true;
    }

    validateStateIndex(stateIndex) {
        this.validateRequiredParam('stateIndex', stateIndex);
        this.validateParamType('stateIndex', stateIndex, 'number');

        if (stateIndex < 0) throw Error('Invalid state index.');
    }

    validateObjectType(obj) {
        if (!(!!obj && typeof obj === 'object')) throw Error('Content must be an object');
    }

    validateJsonldOrNquads(input) {
        if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
            return;
        }

        if (typeof input === 'string' && input.trim().startsWith('<')) {
            const lines = input
                .trim()
                .split('\n')
                .map((line) => line.trimStart());
            if (lines.every((line) => line.match(/^\s*<.+>\s<.+>\s.+\s(?:<.+>\s)?\.\s*$/))) {
                return;
            }
        }

        throw new Error(
            'Content must be either a valid JSON-LD object or a N-Quads/N-Triples string.',
        );
    }
    validateContent(content) {
        this.validateRequiredParam('content', content);
    }

    validateAssertionSizeInBytes(assertionSizeInBytes) {
        if (assertionSizeInBytes > MAX_FILE_SIZE)
            throw Error(`File size limit is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
    }

    validateEndpoint(endpoint) {
        this.validateRequiredParam('endpoint', endpoint);
        this.validateParamType('endpoint', endpoint, 'string');
        if (!endpoint.startsWith('http') && !endpoint.startsWith('ws'))
            throw Error('Endpoint should start with either "http" or "ws"');
    }

    validatePort(port) {
        this.validateRequiredParam('port', port);
        this.validateParamType('port', port, 'number');
    }

    validateMaxNumberOfRetries(maxNumberOfRetries) {
        this.validateRequiredParam('maxNumberOfRetries', maxNumberOfRetries);
        this.validateParamType('maxNumberOfRetries', maxNumberOfRetries, 'number');
    }

    validateFrequency(frequency) {
        this.validateRequiredParam('frequency', frequency);
        this.validateParamType('frequency', frequency, 'number');
    }

    validateState(state) {
        if (state !== null) this.validateParamType('state', state, 'number');
    }

    validateIncludeMetadata(includeMetadata) {
        this.validateRequiredParam('includeMetadata', includeMetadata);
        this.validateParamType('includeMetadata', includeMetadata, 'boolean');
    }

    validateContentType(contentType) {
        this.validateRequiredParam('contentType', contentType);

        const validContentTypes = Object.values(CONTENT_TYPES);
        if (!validContentTypes.includes(contentType))
            throw Error(`Invalid content visibility! Available parameters: ${validContentTypes}`);
    }

    validateEpochsNum(epochsNum) {
        this.validateRequiredParam('epochsNum', epochsNum);
        this.validateParamType('epochsNum', epochsNum, 'number');
    }

    validateHashFunctionId(hashFunctionId) {
        this.validateRequiredParam('hashFunctionId', hashFunctionId);
        this.validateParamType('hashFunctionId', hashFunctionId, 'number');
    }

    validateScoreFunctionId(scoreFunctionId) {
        this.validateRequiredParam('scoreFunctionId', scoreFunctionId);
        this.validateParamType('scoreFunctionId', scoreFunctionId, 'number');
    }

    validateImmutable(immutable) {
        this.validateRequiredParam('immutable', immutable);
        this.validateParamType('immutable', immutable, 'boolean');
    }

    validateTokenAmount(tokenAmount) {
        if (tokenAmount == null) return;

        this.validateParamType('tokenAmount', tokenAmount, 'number');
    }

    validateGasPrice(gasPrice) {
        if (gasPrice == null) return;

        this.validateParamType('gasPrice', gasPrice, 'number');
    }

    validateTransactionPollingTimeout(transactionPollingTimeout) {
        if (transactionPollingTimeout == null) return;

        this.validateParamType('tokenAmount', transactionPollingTimeout, 'number');
    }

    validateAuthToken(authToken) {
        if (authToken == null) return;

        this.validateParamType('authToken', authToken, 'string');
    }

    validateParanetUAL(paranetUAL) {
        if (paranetUAL == null) return;

        this.validateUAL(paranetUAL);
    }

    validatePayer(payer) {
        if (payer == null) return;

        this.validateAddress(payer);
    }

    validateMinimumNumberOfFinalizationConfirmations(minimumNumberOfFinalizationConfirmations) {
        this.validateRequiredParam(
            'minimumNumberOfFinalizationConfirmations',
            minimumNumberOfFinalizationConfirmations,
        );
        this.validateParamType(
            'minimumNumberOfFinalizationConfirmations',
            minimumNumberOfFinalizationConfirmations,
            'number',
        );
    }

    validateMinimumNumberOfNodeReplications(minimumNumberOfNodeReplications) {
        // null is valid
        if (minimumNumberOfNodeReplications === null) return;

        this.validateRequiredParam(
            'minimumNumberOfNodeReplications',
            minimumNumberOfNodeReplications,
        );
        this.validateParamType(
            'minimumNumberOfNodeReplications',
            minimumNumberOfNodeReplications,
            'number',
        );
    }

    validateValidate(validate) {
        this.validateRequiredParam('validate', validate);
        this.validateParamType('validate', validate, 'boolean');
    }

    validateSubjectUAL(subjectUAL) {
        this.validateParamType('subjectUAL', subjectUAL, 'boolean');
    }

    validateOutputFormat(outputFormat) {
        this.validateRequiredParam('outputFormat', outputFormat);
        const validOutputFormats = Object.values(GET_OUTPUT_FORMATS);
        if (!validOutputFormats.includes(outputFormat))
            throw Error(`Invalid query Type: available query types: ${validOutputFormats}`);
    }

    validateBlockchain(blockchain, operation) {
        this.validateRequiredParam('blockchain', blockchain);
        this.validateRequiredParam('blockchain name', blockchain.name);
        this.validateRequiredParam('blockchain hub contract', blockchain.hubContract);
        this.validateGasPrice(blockchain.gasPrice);
        this.validateTransactionPollingTimeout(blockchain.transactionPollingTimeout);
        if (nodeSupported()) {
            this.validateRequiredParam('blockchain rpc', blockchain.rpc);

            if (operation !== OPERATIONS.GET) {
                this.validateRequiredParam('blockchain public key', blockchain.publicKey);
                this.validateRequiredParam('blockchain private key', blockchain.privateKey);
            }
        }
    }

    validateNewOwner(newOwner) {
        this.validateRequiredParam('newOwner', newOwner);
        this.validateParamType('newOwner', newOwner, 'string');
    }

    validateBidSuggestionRange(bidSuggestionRange) {
        if (!BID_SUGGESTION_RANGE_ENUM.includes(bidSuggestionRange)) {
            throw Error(
                `Invalid bidSuggestionRange parametar: supported parametars ${BID_SUGGESTION_RANGE_ENUM}`,
            );
        }
    }

    validateParanetName(paranetName) {
        this.validateRequiredParam('paranetName', paranetName);
        this.validateParamType('paranetName', paranetName, 'string');
    }

    validateParanetDescription(paranetDescription) {
        this.validateRequiredParam('paranetDescription', paranetDescription);
        this.validateParamType('paranetDescription', paranetDescription, 'string');
    }

    validateParanetNodesAccessPolicy(paranetNodesAccessPolicy) {
        this.validateRequiredParam('paranetNodesAccessPolicy', paranetNodesAccessPolicy);
        this.validateParamType('paranetNodesAccessPolicy', paranetNodesAccessPolicy, 'number');
        if (!Object.values(PARANET_NODES_ACCESS_POLICY).includes(paranetNodesAccessPolicy))
            throw Error(
                `Invalid nodes access policy: ${paranetNodesAccessPolicy}. Should be 0 for OPEN or 1 for CURATED`,
            );
    }

    validateParanetMinersAccessPolicy(paranetMinersAccessPolicy) {
        this.validateRequiredParam('paranetMinersAccessPolicy', paranetMinersAccessPolicy);
        this.validateParamType('paranetMinersAccessPolicy', paranetMinersAccessPolicy, 'number');
        if (!Object.values(PARANET_MINERS_ACCESS_POLICY).includes(paranetMinersAccessPolicy))
            throw Error(
                `Invalid miners access policy: ${paranetMinersAccessPolicy}. Should be 0 for OPEN or 1 for CURATED`,
            );
    }

    validateTracToNeuroEmissionMultiplier(tracToNeuroEmissionMultiplier) {
        this.validateRequiredParam('tracToNeuroEmissionMultiplier', tracToNeuroEmissionMultiplier);
        this.validateParamType(
            'tracToNeuroEmissionMultiplier',
            tracToNeuroEmissionMultiplier,
            'number',
        );
    }

    validateIncentivizationProposalVotersRewardPercentage(
        incentivizationProposalVotersRewardPercentage,
    ) {
        this.validateRequiredParam(
            'incentivizationProposalVotersRewardPercentage',
            incentivizationProposalVotersRewardPercentage,
        );
        this.validateParamType(
            'incentivizationProposalVotersRewardPercentage',
            incentivizationProposalVotersRewardPercentage,
            'number',
        );

        if (
            incentivizationProposalVotersRewardPercentage > 10000 ||
            incentivizationProposalVotersRewardPercentage < 0
        )
            throw Error('Invalid percentage value for incentivization proposal voters reward.');
    }

    validateOperatorRewardPercentage(operatorRewardPercentage) {
        this.validateRequiredParam('operatorRewardPercentage', operatorRewardPercentage);
        this.validateParamType('operatorRewardPercentage', operatorRewardPercentage, 'number');

        if (operatorRewardPercentage > 10000 || operatorRewardPercentage < 0)
            throw Error('Invalid percentage value for operator reward.');
    }

    validateParanetServiceName(paranetServiceName) {
        this.validateRequiredParam('paranetServiceName', paranetServiceName);
        this.validateParamType('paranetServiceName', paranetServiceName, 'string');
    }

    validateParanetServiceDescription(paranetServiceDescription) {
        this.validateRequiredParam('paranetServiceDescription', paranetServiceDescription);
        this.validateParamType('paranetServiceDescription', paranetServiceDescription, 'string');
    }

    validateParanetServiceAddresses(paranetServiceAddresses) {
        if (paranetServiceAddresses.length !== 0) {
            for (const address of paranetServiceAddresses) {
                this.validateAddress(address);
            }
        }
    }

    validateAddress(address) {
        this.validateRequiredParam('address', address);
        this.validateParamType('address', address, 'string');

        if (!ethers.isAddress(address)) throw Error(`Wrong address format. Given address: ${address}`);
    }

    validateIdentityId(identityId) {
        this.validateRequiredParam('identityId', identityId);
        this.validateParamType('identityId', identityId, 'number');
    }

    validateConditions(conditions) {
        this.validateRequiredParam('conditions', conditions);

        if (!Array.isArray(conditions)) {
            throw new Error('Conditions must be an array.');
        }

        conditions.forEach((condition, index) => {
            if (typeof condition !== 'object' || condition === null) {
                throw new Error(`Condition at index ${index} must be an object.`);
            }

            if (typeof condition.condition === 'function') {
                const testTriple = {
                    subject: 'uuid:1',
                    predicate: 'http://schema.org/city',
                    object: 'uuid:belgrade',
                };
                try {
                    condition.condition(testTriple);
                } catch (e) {
                    throw new Error(
                        `Condition function at index ${index} must be callable with a 'triple' argument.`,
                    );
                }
            } else if (condition.condition !== true) {
                throw new Error(`Condition at index ${index} must either be a function or 'true'.`);
            }

            if (typeof condition.label !== 'string') {
                throw new Error(`Label at index ${index} must be a string.`);
            }
        });
    }

    validatePublishFinality(
        endpoint,
        port,
        maxNumberOfRetries,
        frequency,
        minimumNumberOfFinalizationConfirmations,
        authToken,
    ) {
        this.validateEndpoint(endpoint);
        this.validatePort(port);
        this.validateMaxNumberOfRetries(maxNumberOfRetries);
        this.validateFrequency(frequency);
        this.validateAuthToken(authToken);
        this.validateMinimumNumberOfFinalizationConfirmations(
            minimumNumberOfFinalizationConfirmations,
        );
    }

    //Paymaster validator

    validatePaymasterAddress(blockchain, hubAddress) {
        this.validateBlockchain(blockchain);
        this.validateAddress(hubAddress);
    }
    
    validatePaymasterToken(blockchain, tokenAmount) {
        this.validateBlockchain(blockchain);
        this.validateTokenAmount(tokenAmount);
    }

    validatePaymasterTokenAdress(blockchain, tokenAmount, recipient) {
        this.validateBlockchain(blockchain);
        this.validateTokenAmount(tokenAmount);
        this.validateAddress(recipient);
    }

    
}

class InputService {
    constructor(config = {}) {
        this.config = config;
    }

    getAssetCreateArguments(options) {
        return {
            blockchain: this.getBlockchain(options),
            endpoint: this.getEndpoint(options),
            port: this.getPort(options),
            maxNumberOfRetries: this.getMaxNumberOfRetries(options),
            frequency: this.getFrequency(options),
            epochsNum: this.getEpochsNum(options),
            hashFunctionId: this.getHashFunctionId(options),
            scoreFunctionId: this.getScoreFunctionId(options),
            immutable: this.getImmutable(options),
            tokenAmount: this.getTokenAmount(options),
            authToken: this.getAuthToken(options),
            payer: this.getPayer(options),
            minimumNumberOfFinalizationConfirmations:
                this.getMinimumNumberOfFinalizationConfirmations(options) ?? 3,
            minimumNumberOfNodeReplications: this.getMinimumNumberOfNodeReplications(options),
        };
    }

    getAssetLocalStoreArguments(options) {
        return {
            blockchain: this.getBlockchain(options),
            endpoint: this.getEndpoint(options),
            port: this.getPort(options),
            maxNumberOfRetries: this.getMaxNumberOfRetries(options),
            frequency: this.getFrequency(options),
            epochsNum: this.getEpochsNum(options),
            hashFunctionId: this.getHashFunctionId(options),
            scoreFunctionId: this.getScoreFunctionId(options),
            immutable: this.getImmutable(options),
            tokenAmount: this.getTokenAmount(options),
            authToken: this.getAuthToken(options),
            paranetUAL: this.getParanetUAL(options),
            assertionCachedLocally: this.getAssertionCachedLocally(options),
        };
    }

    getAssetGetArguments(options) {
        return {
            blockchain: this.getBlockchain(options),
            endpoint: this.getEndpoint(options),
            port: this.getPort(options),
            maxNumberOfRetries: this.getMaxNumberOfRetries(options),
            frequency: this.getFrequency(options),
            state: this.getState(options),
            includeMetadata: this.getIncludeMetadata(options),
            contentType: this.getContentType(options),
            validate: this.getValidate(options),
            outputFormat: this.getOutputFormat(options),
            authToken: this.getAuthToken(options),
            hashFunctionId: this.getHashFunctionId(options),
            paranetUAL: this.getParanetUAL(options),
            metadata: this.getIncludeMetadata(options),
            subjectUAL: this.getSubjectUAL(options),
        };
    }

    getAssetUpdateArguments(options) {
        return {
            blockchain: this.getBlockchain(options),
            endpoint: this.getEndpoint(options),
            port: this.getPort(options),
            maxNumberOfRetries: this.getMaxNumberOfRetries(options),
            frequency: this.getFrequency(options),
            hashFunctionId: this.getHashFunctionId(options),
            scoreFunctionId: this.getScoreFunctionId(options),
            tokenAmount: this.getTokenAmount(options),
            authToken: this.getAuthToken(options),
            payer: this.getPayer(options),
        };
    }

    getQueryArguments(options) {
        return {
            graphLocation: this.getGraphLocation(options),
            graphState: this.getGraphState(options),
            endpoint: this.getEndpoint(options),
            port: this.getPort(options),
            maxNumberOfRetries: this.getMaxNumberOfRetries(options),
            frequency: this.getFrequency(options),
            authToken: this.getAuthToken(options),
            paranetUAL: this.getParanetUAL(options),
            repository: this.getRepository(options),
        };
    }

    getParanetCreateArguments(options) {
        return {
            blockchain: this.getBlockchain(options),
            paranetName: this.getParanetName(options),
            paranetDescription: this.getParanetDescription(options),
            paranetNodesAccessPolicy: this.getParanetNodesAccessPolicy(options),
            paranetMinersAccessPolicy: this.getParanetMinersAccessPolicy(options),
        };
    }

    getParanetDeployIncentivesContractArguments(options) {
        return {
            blockchain: this.getBlockchain(options),
            incentiveType: this.getIncentiveType(options),
            tracToNeuroEmissionMultiplier: this.getTracToNeuroEmissionMultiplier(options),
            operatorRewardPercentage: this.getOperatorRewardPercentage(options),
            incentivizationProposalVotersRewardPercentage:
                this.getIncentivizationProposalVotersRewardPercentage(options),
        };
    }

    getParanetCreateServiceArguments(options) {
        return {
            blockchain: this.getBlockchain(options),
            paranetServiceName: this.getParanetServiceName(options),
            paranetServiceDescription: this.getParanetServiceDescription(options),
            paranetServiceAddresses: this.getParanetServiceAddresses(options),
        };
    }

    getParanetRoleCheckArguments(options) {
        return {
            blockchain: this.getBlockchain(options),
            roleAddress: this.getRoleAddress(options),
        };
    }

    getBlockchain(options) {
        const environment =
            options.environment ?? this.config.environment ?? DEFAULT_PARAMETERS.ENVIRONMENT;
        const name = options.blockchain?.name ?? this.config.blockchain?.name ?? null;
        const rpc =
            options.blockchain?.rpc ??
            this.config.blockchain?.rpc ??
            BLOCKCHAINS[environment][name]?.rpc;
        const hubContract =
            options.blockchain?.hubContract ??
            this.config.blockchain?.hubContract ??
            BLOCKCHAINS[environment][name]?.hubContract;
        const publicKey =
            options.blockchain?.publicKey ?? this.config.blockchain?.publicKey ?? null;
        const privateKey =
            options.blockchain?.privateKey ?? this.config.blockchain?.privateKey ?? null;
        const handleNotMinedError =
            options.blockchain?.handleNotMinedError ??
            this.config.blockchain?.handleNotMinedError ??
            DEFAULT_PARAMETERS.HANDLE_NOT_MINED_ERROR;
        const gasLimitMultiplier =
            options.blockchain?.gasLimitMultiplier ??
            this.config.blockchain?.gasLimitMultiplier ??
            DEFAULT_PARAMETERS.GAS_LIMIT_MULTIPLIER;
        const gasPrice =
            options.blockchain?.gasPrice ?? this.config.blockchain?.gasPrice ?? undefined;
        const transactionPollingTimeout =
            options.blockchain?.transactionPollingTimeout ??
            this.config.blockchain?.transactionPollingTimeout ??
            null;
        const simulateTxs =
            options.blockchain?.simulateTxs ??
            this.config.blockchain?.simulateTxs ??
            DEFAULT_PARAMETERS.SIMULATE_TXS;
        const forceReplaceTxs =
            options.blockchain?.forceReplaceTxs ??
            this.config.blockchain?.forceReplaceTxs ??
            DEFAULT_PARAMETERS.FORCE_REPLACE_TXS;
        const gasPriceOracleLink =
            options.blockchain?.gasPriceOracleLink ??
            this.config.blockchain?.gasPriceOracleLink ??
            BLOCKCHAINS[environment][name]?.gasPriceOracleLink ??
            undefined;

        const blockchainConfig = {
            name,
            rpc,
            hubContract,
            publicKey,
            privateKey,
            gasLimitMultiplier,
            gasPrice,
            transactionPollingTimeout,
            handleNotMinedError,
            simulateTxs,
            forceReplaceTxs,
            gasPriceOracleLink,
        };

        if (name && name.startsWith('otp')) {
            blockchainConfig.waitNeurowebTxFinalization =
                options.blockchain?.waitNeurowebTxFinalization ??
                this.config.blockchain?.waitNeurowebTxFinalization ??
                DEFAULT_NEUROWEB_FINALITY_PARAMETERS.WAIT_NEUROWEB_TX_FINALIZATION;
            blockchainConfig.transactionFinalityPollingInterval =
                options.blockchain?.transactionFinalityPollingInterval ??
                this.config.blockchain?.transactionFinalityPollingInterval ??
                DEFAULT_NEUROWEB_FINALITY_PARAMETERS.TX_FINALITY_POLLING_INTERVAL;
            blockchainConfig.transactionFinalityMaxWaitTime =
                options.blockchain?.transactionFinalityMaxWaitTime ??
                this.config.blockchain?.transactionFinalityMaxWaitTime ??
                DEFAULT_NEUROWEB_FINALITY_PARAMETERS.TX_FINALITY_MAX_WAIT_TIME;
            blockchainConfig.transactionReminingPollingInterval =
                options.blockchain?.transactionReminingPollingInterval ??
                this.config.blockchain?.transactionReminingPollingInterval ??
                DEFAULT_NEUROWEB_FINALITY_PARAMETERS.TX_REMINING_POLLING_INTERVAL;
            blockchainConfig.transactionReminingMaxWaitTime =
                options.blockchain?.transactionReminingMaxWaitTime ??
                this.config.blockchain?.transactionReminingMaxWaitTime ??
                DEFAULT_NEUROWEB_FINALITY_PARAMETERS.TX_REMINING_MAX_WAIT_TIME;
        }

        return blockchainConfig;
    }

    getGraphLocation(options) {
        return (
            options.graphLocation ??
            options.paranetUAL ??
            this.config.graphLocation ??
            DEFAULT_PARAMETERS.GRAPH_LOCATION
        );
    }

    getGraphState(options) {
        return options.graphState ?? this.config.graphState ?? DEFAULT_PARAMETERS.GRAPH_STATE;
    }

    getPublishFinalityArguments(options) {
        return {
            blockchain: this.getBlockchain(options),
            endpoint: this.getEndpoint(options),
            port: this.getPort(options),
            maxNumberOfRetries: this.getMaxNumberOfRetries(options),
            frequency: this.getFrequency(options),
            authToken: this.getAuthToken(options),
            minimumNumberOfFinalizationConfirmations:
                this.getMinimumNumberOfFinalizationConfirmations(options) ?? 3,
        };
    }

    getEndpoint(options) {
        return options.endpoint ?? this.config.endpoint ?? null;
    }

    getPort(options) {
        return options.port ?? this.config.port ?? DEFAULT_PARAMETERS.PORT;
    }

    getFrequency(options) {
        return options.frequency ?? this.config.frequency ?? DEFAULT_PARAMETERS.FREQUENCY;
    }

    getHashFunctionId(options) {
        return (
            options.hashFunctionId ??
            this.config.hashFunctionId ??
            DEFAULT_PARAMETERS.HASH_FUNCTION_ID
        );
    }

    getScoreFunctionId(options) {
        const environment =
            options.environment ?? this.config.environment ?? DEFAULT_PARAMETERS.ENVIRONMENT;
        const blockchainName = this.getBlockchain(options).name;

        return DEFAULT_PROXIMITY_SCORE_FUNCTIONS_PAIR_IDS[environment][blockchainName];
    }

    getEpochsNum(options) {
        return options.epochsNum ?? this.config.epochsNum ?? null;
    }

    getImmutable(options) {
        return options.immutable ?? this.config.immutable ?? DEFAULT_PARAMETERS.IMMUTABLE;
    }

    getTokenAmount(options) {
        return options.tokenAmount ?? this.config.tokenAmount ?? null;
    }

    getState(options) {
        return options.state ?? this.config.state ?? DEFAULT_PARAMETERS.STATE;
    }

    getIncludeMetadata(options) {
        return (
            options.includeMetadata ??
            this.config.includeMetadata ??
            DEFAULT_PARAMETERS.INCLUDE_METADATA
        );
    }

    getSubjectUAL(options) {
        return options.subjectUAL ?? this.config.subjectUAL ?? false;
    }

    getContentType(options) {
        return options.contentType ?? this.config.contentType ?? DEFAULT_PARAMETERS.CONTENT_TYPE;
    }

    getValidate(options) {
        return options.validate ?? this.config.validate ?? DEFAULT_PARAMETERS.VALIDATE;
    }

    getOutputFormat(options) {
        return options.outputFormat ?? this.config.outputFormat ?? DEFAULT_PARAMETERS.OUTPUT_FORMAT;
    }

    getMaxNumberOfRetries(options) {
        return (
            options.maxNumberOfRetries ??
            this.config.maxNumberOfRetries ??
            DEFAULT_PARAMETERS.MAX_NUMBER_OF_RETRIES
        );
    }

    getAuthToken(options) {
        return options.auth?.token ?? this.config?.auth?.token ?? null;
    }

    getParanetUAL(options) {
        return options.paranetUAL ?? this.config.paranetUAL ?? null;
    }

    getRepository(options) {
        return options.repository ?? this.config.repository ?? null;
    }

    getPayer(options) {
        return options.payer ?? this.config.payer ?? ZERO_ADDRESS;
    }

    getMinimumNumberOfFinalizationConfirmations(options) {
        return (
            options.minimumNumberOfFinalizationConfirmations ??
            this.config.minimumNumberOfFinalizationConfirmations ??
            null
        );
    }

    getMinimumNumberOfNodeReplications(options) {
        return (
            options.minimumNumberOfNodeReplications ??
            this.config.minimumNumberOfNodeReplications ??
            null
        );
    }

    getParanetName(options) {
        return options.paranetName ?? null;
    }

    getParanetDescription(options) {
        return options.paranetDescription ?? null;
    }

    getParanetNodesPolicy(options) {
        return options.nodesAccessPolicy ?? PARANET_NODES_ACCESS_POLICY.OPEN;
    }

    getParanetMinersPolicy(options) {
        return options.minersAccessPolicy ?? PARANET_MINERS_ACCESS_POLICY.OPEN;
    }

    getParanetNodesAccessPolicy(options) {
        return options.paranetNodesAccessPolicy ?? PARANET_NODES_ACCESS_POLICY.OPEN;
    }

    getParanetMinersAccessPolicy(options) {
        return options.paranetMinersAccessPolicy ?? PARANET_MINERS_ACCESS_POLICY.OPEN;
    }

    getTracToNeuroEmissionMultiplier(options) {
        return options.tracToNeuroEmissionMultiplier ?? null;
    }

    getIncentivizationProposalVotersRewardPercentage(options) {
        return options.incentivizationProposalVotersRewardPercentage * 100 ?? null;
    }

    getOperatorRewardPercentage(options) {
        return options.operatorRewardPercentage * 100 ?? null;
    }

    getIncentiveType(options) {
        return options.incentiveType ?? null;
    }

    getParanetServiceName(options) {
        return options.paranetServiceName ?? null;
    }

    getParanetServiceDescription(options) {
        return options.paranetServiceDescription ?? null;
    }

    getParanetServiceAddresses(options) {
        return options.paranetServiceAddresses ?? [];
    }

    getRoleAddress(options) {
        return options.roleAddress ?? null;
    }

    getAssertionCachedLocally(options) {
        return options.assertionCachedLocally ?? false;
    }
}

// interfaces

class BaseServiceManager {
    constructor(config) {
        const blockchainName = config.blockchain?.name;
        const configWithNewBlockchainName = config;
        if (blockchainName && Object.keys(BLOCKCHAINS_RENAME_PAIRS).includes(blockchainName))
            configWithNewBlockchainName.blockchain.name = BLOCKCHAINS_RENAME_PAIRS[blockchainName];

        this.initializeServices(configWithNewBlockchainName);
    }

    initializeServices(config) {
        this.blockchainService = this.initializeBlockchainService(config);
        this.nodeApiService = this.initializeNodeApiService(config);
        this.inputService = new InputService(config);
        this.validationService = new ValidationService();
    }

    getServices() {
        return {
            blockchainService: this.blockchainService,
            nodeApiService: this.nodeApiService,
            validationService: this.validationService,
            inputService: this.inputService,
        };
    }

    initializeNodeApiService(config) {
        return config.communicationType && NodeApiInterface[config.communicationType]
            ? new NodeApiInterface[config.communicationType](config)
            : new NodeApiInterface.Default(config);
    }

    initializeBlockchainService(config) {
        if (nodeSupported()) {
            return new BlockchainInterface.Node(config);
        }
        if (!nodeSupported() && !window.ethereum && config.blockchain?.privateKey) {
            return new BlockchainInterface.Node(config);
        }
        return new BlockchainInterface.Browser(config);
    }
}

// managers

class DkgClient {
    constructor(config) {
        const baseServiceManager = new BaseServiceManager(config);
        const services = baseServiceManager.getServices();

        this.assertion = new AssertionOperationsManager(services);
        this.asset = new AssetOperationsManager(services);
        this.blockchain = new BlockchainOperationsManager(services);
        this.node = new NodeOperationsManager(services);
        this.graph = new GraphOperationsManager(services);
        this.network = new NetworkOperationsManager(services);
        this.paranet = new ParanetOperationsManager(services);

        // Backwards compatibility
        this.graph.get = this.asset.get.bind(this.asset);
        this.graph.create = this.asset.create.bind(this.asset);
    }
}

module.exports = DkgClient;
