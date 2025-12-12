'use strict';

var assertionTools = require('assertion-tools');
var ethers = require('ethers');
var jsonld = require('jsonld');
var axios = require('axios');
var Web3 = require('web3');
var module$1 = require('module');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
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
}

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

const BLOCKCHAIN_IDS = {
    HARDHAT_1: 'hardhat1:31337',
    HARDHAT_2: 'hardhat2:31337',
    NEUROWEB_TESTNET: 'otp:20430',
    NEUROWEB_MAINNET: 'otp:2043',
};
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

const PARANET_NODES_ACCESS_POLICY = {
    OPEN: 0,
    PERMISSIONED: 1,
};

const PARANET_MINERS_ACCESS_POLICY = {
    OPEN: 0,
    PERMISSIONED: 1,
};

const PARANET_KC_SUBMISSION_POLICY = {
    OPEN: 0,
    STAGING: 1,
};

const PARANET_KNOWLEDGE_COLLECTION_STATUS = {
    0: 'NONE',
    1: 'PENDING',
    2: 'APPROVED',
    3: 'REJECTED',
};

const NEUROWEB_INCENTIVE_TYPE_CHAINS = [
    BLOCKCHAIN_IDS.NEUROWEB_TESTNET,
    BLOCKCHAIN_IDS.NEUROWEB_MAINNET,
    BLOCKCHAIN_IDS.HARDHAT_1,
    BLOCKCHAIN_IDS.HARDHAT_2,
];

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
    FINALITY: 'finality',
};

const OPERATION_STATUSES$1 = {
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
    GNOSIS: '1.5',
    OTP: '0.001',
    BASE: '0.086',
};

const CHUNK_BYTE_SIZE$1 = 32;

function nodeSupported() {
    return typeof window === 'undefined';
}

function deriveUAL$1(blockchain, contract, kcTokenId, kaTokenId) {
    const ual = `did:dkg:${blockchain.toLowerCase()}/${contract.toLowerCase()}/${kcTokenId}`;
    return kaTokenId ? `${ual}/${kaTokenId}` : ual;
}

function resolveUAL(ual) {
    if (!ual.startsWith('did:dkg:')) {
        throw new Error(`Invalid UAL: ${ual}. UAL should start with did:dkg:`);
    }

    const args = ual.replace('did:dkg:', '').split('/');

    if (args.length === 4) {
        return {
            blockchain: args[0],
            contract: args[1],
            kcTokenId: parseInt(args[2], 10),
            kaTokenId: parseInt(args[3], 10),
        };
    }

    if (args.length === 3) {
        return {
            blockchain: args[0],
            contract: args[1],
            kcTokenId: parseInt(args[2], 10),
        };
    }

    throw new Error(`Invalid UAL: ${ual}. UAL should have 3 or 4 segments.`);
}

async function sleepForMilliseconds(milliseconds) {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((r) => setTimeout(r, milliseconds));
}

function getOperationStatusObject$1(operationResult, operationId) {
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

async function toJSONLD(nquads) {
    return jsonld.fromRDF(nquads, {
        algorithm: 'URDNA2015',
        format: 'application/n-quads',
    });
}

function getParanetId(paranetUAL) {
    const { contract, kcTokenId, kaTokenId } = resolveUAL(paranetUAL);
    if (!kaTokenId) {
        throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
    }
    return ethers.ethers.keccak256(
        ethers.ethers.solidityPacked(['address', 'uint256', 'uint256'], [contract, kcTokenId, kaTokenId]),
    );
}

function getKnowledgeCollectionId(kcUAL) {
    const { contract, kcTokenId } = resolveUAL(kcUAL);
    return ethers.ethers.keccak256(ethers.ethers.solidityPacked(['address', 'uint256'], [contract, kcTokenId]));
}

/**
 * Empty hooks are used as a fallback hooks
 * in case user doesn't provide his own implementation
 * @type {{emptyHooks: exports.emptyHooks}}
 */
// TODO: Either to be deprecated or added to all operations

var emptyHooks$1 = {
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

    /**
     * Creates a new knowledge collection.
     * @async
     * @param {Object} content - The content of the knowledge collection to be created, contains public, private or both keys.
     * @param {Object} [options={}] - Additional options for knowledge collection creation.
     * @param {Object} [stepHooks=emptyHooks] - Hooks to execute during knowledge collection creation.
     * @returns {Object} Object containing UAL, publicAssertionId and operation status.
     */
    async create(content, options = {}, stepHooks = emptyHooks$1) {
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
            const privateTriplesGrouped = assertionTools.kcTools.groupNquadsBySubject(dataset.private, false).sort();
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
            for (let i = 0; i < publicTriplesGrouped.length; i += 1) {
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

        const numberOfChunks = assertionTools.kcTools.calculateNumberOfChunks(dataset.public, CHUNK_BYTE_SIZE$1);
        const datasetSize = numberOfChunks * CHUNK_BYTE_SIZE$1;

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
            publishOperationResult.status !== OPERATION_STATUSES$1.COMPLETED &&
            !publishOperationResult.data.minAcksReached
        ) {
            return {
                datasetRoot,
                operation: {
                    publish: getOperationStatusObject$1(publishOperationResult, publishOperationId),
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

                    const keyIsOperationalWallet =
                        await this.blockchainService.keyIsOperationalWallet(
                            blockchain,
                            signature.identityId,
                            signerAddress,
                        );
                    if (keyIsOperationalWallet) {
                        identityIds.push(signature.identityId);
                        r.push(signature.r);
                        vs.push(signature.vs);
                    }
                } catch {
                    // If error happened continue
                }
            }),
        );

        let estimatedPublishingCost;
        if (tokenAmount) {
            estimatedPublishingCost = tokenAmount;
        } else {
            const stakeWeightedAverageAsk = await this.blockchainService.getStakeWeightedAverageAsk(
                blockchain,
            );

            estimatedPublishingCost =
                BigInt(stakeWeightedAverageAsk) *
                BigInt(epochsNum) *
                BigInt(datasetSize) /
                BigInt(1024);
        }
        let knowledgeCollectionId;
        let mintKnowledgeCollectionReceipt;

        ({ knowledgeCollectionId, receipt: mintKnowledgeCollectionReceipt } =
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

        // ------------------------------------------------------------------
        // Ensure KC minting transaction is reorg-safe by waiting until it is
        // included in a block with the desired depth (default = 1).
        // ------------------------------------------------------------------

        const minimumBlockConfirmations = options.minimumBlockConfirmations ?? 1;

        if (blockchain.name && blockchain.name.startsWith('otp') && minimumBlockConfirmations > 0) {
            const { receipt: finalizedMintReceipt, eventData } =
                await this.blockchainService.waitForEventFinality(
                    mintKnowledgeCollectionReceipt,
                    'KnowledgeCollectionCreated',
                    knowledgeCollectionId,
                    blockchain,
                    minimumBlockConfirmations,
                );

            mintKnowledgeCollectionReceipt = finalizedMintReceipt;
            knowledgeCollectionId = parseInt(eventData.id, 10);
        }

        const UAL = deriveUAL$1(blockchain.name, contentAssetStorageAddress, knowledgeCollectionId);

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
                mintKnowledgeCollection: mintKnowledgeCollectionReceipt,
                publish: getOperationStatusObject$1(publishOperationResult, publishOperationId),
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

        const { knowledgeCollectionId, tokenId } = resolveUAL(UAL);
        const assetId = (knowledgeCollectionId - 1) * 1_000_000 + tokenId;
        const receipt = await this.blockchainService.transferAsset(assetId, newOwner, blockchain);
        // const owner = await this.blockchainService.getAssetOwner(tokenId, blockchain);

        return {
            UAL,
            operation: receipt,
        };
    }

    /**
     * Burn an asset on a specified blockchain.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Object} An object containing the UAL and operation status.
     */

    // TODO: Update function for v8
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

    // TOOO: Update for v8
    // async extendStoringPeriod(UAL, epochsNumber, options = {}) {
    //     const blockchain = this.inputService.getBlockchain(options);
    //     const tokenAmount = this.inputService.getTokenAmount(options);

    //     this.validationService.validateExtendAssetStoringPeriod(
    //         UAL,
    //         epochsNumber,
    //         tokenAmount,
    //         blockchain,
    //     );

    //     const { tokenId } = resolveUAL(UAL);
    //     // const datasetSize = await this.blockchainService.getDatasetSize()

    //     let tokenAmountInWei;

    //     if (tokenAmount != null) {
    //         tokenAmountInWei = tokenAmount;
    //     } else {
    //         tokenAmountInWei =
    //             (await this.blockchainService.getStakeWeightedAverageAsk()) *
    //             epochsNumber *
    //             datasetSize; // need to get dataset size somewhere
    //     }

    //     const receipt = await this.blockchainService.extendAssetStoringPeriod(
    //         tokenId,
    //         epochsNumber,
    //         tokenAmountInWei,
    //         blockchain,
    //     );

    //     return {
    //         UAL,
    //         operation: receipt,
    //     };
    // }

    /**
     * Add tokens for an asset on the specified blockchain to a ongoing publishing operation.
     * @async
     * @param {string} UAL - The Universal Asset Locator of the asset.
     * @param {Object} [options={}] - Additional options for adding tokens.
     * @returns {Object} An object containing the UAL and operation status.
     */

    // TODO: Update for v8
    // async addTokens(UAL, options = {}) {
    //     const blockchain = this.inputService.getBlockchain(options);
    //     const tokenAmount = this.inputService.getTokenAmount(options);

    //     this.validationService.validateAddTokens(UAL, tokenAmount, blockchain);

    //     const { tokenId } = resolveUAL(UAL);

    //     let tokenAmountInWei;

    //     if (tokenAmount != null) {
    //         tokenAmountInWei = tokenAmount;
    //     } else {
    //         const endpoint = this.inputService.getEndpoint(options);
    //         const port = this.inputService.getPort(options);
    //         const authToken = this.inputService.getAuthToken(options);
    //         const hashFunctionId = this.inputService.getHashFunctionId(options);

    //         const latestFinalizedState = await this.blockchainService.getLatestAssertionId(
    //             tokenId,
    //             blockchain,
    //         );

    //         const latestFinalizedStateSize = await this.blockchainService.getAssertionSize(
    //             latestFinalizedState,
    //             blockchain,
    //         );

    //         tokenAmountInWei = await this._getUpdateBidSuggestion(
    //             UAL,
    //             blockchain,
    //             endpoint,
    //             port,
    //             authToken,
    //             latestFinalizedState,
    //             latestFinalizedStateSize,
    //             hashFunctionId,
    //         );

    //         if (tokenAmountInWei <= 0) {
    //             throw new Error(
    //                 `Token amount is bigger than default suggested amount, please specify exact tokenAmount if you still want to add more tokens!`,
    //             );
    //         }
    //     }

    //     const receipt = await this.blockchainService.addTokens(
    //         tokenId,
    //         tokenAmountInWei,
    //         blockchain,
    //     );

    //     return {
    //         UAL,
    //         operation: receipt,
    //     };
    // }

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

        const { contract: kcStorageContract, kcTokenId } = resolveUAL(UAL);
        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const receipt = await this.blockchainService.submitToParanet(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                kcStorageContract,
                kcTokenId,
            },
            blockchain,
        );

        return {
            UAL,
            operation: receipt,
        };
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
                        get: getOperationStatusObject$1(getOperationResult, getOperationId),
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
                    get: getOperationStatusObject$1(getOperationResult, getOperationId),
                },
            };
        }
        const { metadata } = getOperationResult.data;
        const { assertion } = getOperationResult.data;

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
                    get: getOperationStatusObject$1(getOperationResult, getOperationId),
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
                get: getOperationStatusObject$1(getOperationResult, getOperationId),
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

        if (finalityStatusResult >= minimumNumberOfFinalizationConfirmations) {
            return {
                status: 'FINALIZED',
                numberOfConfirmations: finalityStatusResult,
                requiredConfirmations: minimumNumberOfFinalizationConfirmations,
            };
        }
        return {
            status: 'NOT FINALIZED',
            numberOfConfirmations: finalityStatusResult,
            requiredConfirmations: minimumNumberOfFinalizationConfirmations,
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

    /**
     * Retrieve the web3 instance.
     * @async
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Promise<Object>} - A promise that resolves to the web3 instance.
     */
    async getWeb3Instance(options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return this.blockchainService.getWeb3Instance(blockchain);
    }

    /**
     * Retrieve the wallet.
     * @async
     * @param {Object} [options={}] - Optional parameters for blockchain service.
     * @returns {Promise<Object>} - A promise that resolves to the wallet.
     */
    async getWalletAddress(options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        return blockchain.publicKey;
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

        return this.nodeApiService.query(
            endpoint,
            port,
            authToken,
            queryString,
            queryType,
            paranetUAL,
            repository,
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
            dataset = await kcTools.formatDataset(content);
        }

        const numberOfChunks = kcTools.calculateNumberOfChunks(dataset, CHUNK_BYTE_SIZE);

        const datasetSize = numberOfChunks * CHUNK_BYTE_SIZE;

        this.validationService.validateAssertionSizeInBytes(datasetSize);
        const datasetRoot = kcTools.calculateMerkleRoot(dataset);

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

        const { tokenId, receipt: mintKnowledgeCollectionReceipt } =
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
                mintKnowledgeCollection: mintKnowledgeCollectionReceipt,
                localStore: getOperationStatusObject(
                    localStoreOperationResult,
                    localStoreOperationId,
                ),
            },
        };
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
            paranetMinersAccessPolicy,
            paranetKcSubmissionPolicy,
        } = this.inputService.getParanetCreateArguments(options);

        this.validationService.validateParanetCreate(
            UAL,
            blockchain,
            paranetName,
            paranetDescription,
            paranetNodesAccessPolicy,
            paranetMinersAccessPolicy,
            paranetKcSubmissionPolicy,
        );

        const { contract, kcTokenId, kaTokenId } = resolveUAL(UAL);

        if (!kaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const receipt = await this.blockchainService.registerParanet(
            {
                contract,
                kcTokenId,
                kaTokenId,
                paranetName,
                paranetDescription,
                paranetNodesAccessPolicy,
                paranetMinersAccessPolicy,
                paranetKcSubmissionPolicy,
            },
            blockchain,
        );

        return {
            paranetUAL: UAL,
            operation: receipt,
        };
    }

    /**
     * Check if a Knowledge Collection is registered to a Paranet.
     * @async
     * @param {string} kcUAL - Universal Asset Locator of the KC to be checked.
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for checking if a KC is registered.
     * @returns {Object} Object containing the Paranet UAL and knowledge collections.
     * @example
     * await dkg.paranet.isKnowledgeCollectionRegistered(paranetUAL, kcUAL);
     */
    async isKnowledgeCollectionRegistered(kcUAL, paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetIsKnowledgeCollectionRegistered(
            kcUAL,
            paranetUAL,
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const knowledgeCollectionId = getKnowledgeCollectionId(kcUAL);

        const isKcRegisteredToParanet =
            await this.blockchainService.isKnowledgeCollectionRegistered(
                { paranetId, knowledgeCollectionId },
                blockchain,
            );

        return { paranetUAL, isKcRegisteredToParanet };
    }

    /**
     * Adds a Knowledge Collection curator to a Paranet.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA that is created for Paranet.
     * @param {string} curatorAddress - Address of the curator to be added.
     * @param {Object} [options={}] - Additional options for adding a curator to a paranet.
     * @returns {Object} Object containing the Paranet UAL and operation receipt.
     * @example
     * await dkg.paranet.addCurator(paranetUAL, curatorAddress);
     */
    async addCurator(paranetUAL, curatorAddress, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetAddCurator(paranetUAL, curatorAddress, blockchain);

        const { contract: kcStorageContract, kcTokenId, kaTokenId } = resolveUAL(paranetUAL);

        if (!kaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const receipt = await this.blockchainService.addCurator(
            {
                kcStorageContract,
                kcTokenId,
                kaTokenId,
                curatorAddress,
            },
            blockchain,
        );

        return {
            paranetUAL,
            operation: receipt,
        };
    }

    /**
     * Removes a Knowledge Collection curator from a Paranet. Can only be done by the paranet operator.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA that is created for Paranet.
     * @param {string} curatorAddress - Address of the curator to be removed.
     * @param {Object} [options={}] - Additional options for removing a curator from a paranet.
     * @returns {Object} Object containing the Paranet UAL and operation receipt.
     * @example
     * await dkg.paranet.removeCurator(paranetUAL, curatorAddress);
     */
    async removeCurator(paranetUAL, curatorAddress, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetRemoveCurator(paranetUAL, curatorAddress, blockchain);

        const { contract: kcStorageContract, kcTokenId, kaTokenId } = resolveUAL(paranetUAL);

        if (!kaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const receipt = await this.blockchainService.removeCurator(
            {
                kcStorageContract,
                kcTokenId,
                kaTokenId,
                curatorAddress,
            },
            blockchain,
        );

        return {
            paranetUAL,
            operation: receipt,
        };
    }

    /**
     * Stages a Knowledge Collection to a Paranet.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA that is created for Paranet.
     * @param {string} kcUAL - Universal Asset Locator of the KC to be staged.
     * @param {Object} [options={}] - Additional options for staging a KC.
     * @returns {Object} Object containing the Paranet UAL and operation receipt.
     * @example
     * await dkg.paranet.stageKnowledgeCollection(paranetUAL, kcUAL);
     */
    async stageKnowledgeCollection(kcUAL, paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetStageKnowledgeCollection(
            kcUAL,
            paranetUAL,
            blockchain,
        );

        const {
            contract: paranetKcStorageContract,
            kcTokenId: paranetKcTokenId,
            kaTokenId: paranetKaTokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const { contract: kcStorageContract, kcTokenId } = resolveUAL(kcUAL);

        const receipt = await this.blockchainService.stageKnowledgeCollection(
            {
                paranetKcStorageContract,
                paranetKcTokenId,
                paranetKaTokenId,
                kcStorageContract,
                kcTokenId,
            },
            blockchain,
        );

        return {
            kcUAL,
            paranetUAL,
            operation: receipt,
        };
    }

    /**
     * Reviews a Knowledge Collection submitted to paranet which is in the staging phase.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA that is created for Paranet.
     * @param {string} kcUAL - Universal Asset Locator of the KC to be reviewed.
     * @param {boolean} accepted - Whether the KC is accepted or rejected.
     * @param {Object} [options={}] - Additional options for reviewing a KC.
     * @returns {Object} Object containing the Paranet UAL and operation receipt.
     * @example
     * await dkg.paranet.reviewKnowledgeCollection(paranetUAL, kcUAL, accepted);
     */
    async reviewKnowledgeCollection(kcUAL, paranetUAL, accepted, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetReviewKnowledgeCollection(
            kcUAL,
            paranetUAL,
            accepted,
            blockchain,
        );

        const {
            contract: paranetKcStorageContract,
            kcTokenId: paranetKcTokenId,
            kaTokenId: paranetKaTokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const { contract: kcStorageContract, kcTokenId } = resolveUAL(kcUAL);

        const receipt = await this.blockchainService.reviewKnowledgeCollection(
            {
                paranetKcStorageContract,
                paranetKcTokenId,
                paranetKaTokenId,
                kcStorageContract,
                kcTokenId,
                accepted,
            },
            blockchain,
        );

        return {
            kcUAL,
            paranetUAL,
            operation: receipt,
        };
    }

    /**
     * Checks if a Knowledge Collection is staged to a Paranet.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA that is created for Paranet.
     * @param {string} kcUAL - Universal Asset Locator of the KC to be checked.
     * @param {Object} [options={}] - Additional options for checking if a KC is staged.
     * @returns {Object} Object containing the Paranet UAL and operation receipt.
     * @example
     * await dkg.paranet.isKnowledgeCollectionStaged(paranetUAL, kcUAL);
     */
    async isKnowledgeCollectionStaged(kcUAL, paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetIsKnowledgeCollectionStaged(
            kcUAL,
            paranetUAL,
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const knowledgeCollectionId = getKnowledgeCollectionId(kcUAL);

        const isStagedToParanet = await this.blockchainService.isKnowledgeCollectionStaged(
            {
                paranetId,
                knowledgeCollectionId,
            },
            blockchain,
        );

        return {
            kcUAL,
            paranetUAL,
            isStagedToParanet,
        };
    }

    /**
     * Checks if a Knowledge Collection is approved to a Paranet.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA that is created for Paranet.
     * @param {string} kcUAL - Universal Asset Locator of the KC to be checked.
     * @param {Object} [options={}] - Additional options for checking if a KC is approved.
     * @returns {Object} Object containing the Paranet UAL and operation receipt.
     * @example
     * await dkg.paranet.isKnowledgeCollectionApproved(paranetUAL, kcUAL);
     */
    async isKnowledgeCollectionApproved(kcUAL, paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetIsKnowledgeCollectionApproved(
            kcUAL,
            paranetUAL,
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const knowledgeCollectionId = getKnowledgeCollectionId(kcUAL);

        const isApprovedToParanet = await this.blockchainService.isKnowledgeCollectionApproved(
            {
                paranetId,
                knowledgeCollectionId,
            },
            blockchain,
        );

        return {
            kcUAL,
            paranetUAL,
            isApprovedToParanet,
        };
    }

    /**
     * Gets the approval status of a Knowledge Collection to a Paranet.
     * @async
     * @param {string} UAL - Universal Asset Locator of the KA that is created for Paranet.
     * @param {string} kcUAL - Universal Asset Locator of the KC to be checked.
     * @param {Object} [options={}] - Additional options for checking if a KC is approved.
     * @returns {Object} Object containing the Paranet UAL and operation receipt.
     * @example
     * await dkg.paranet.getKnowledgeCollectionApprovalStatus(paranetUAL, kcUAL);
     */
    async getKnowledgeCollectionApprovalStatus(kcUAL, paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetGetKnowledgeCollectionApprovalStatus(
            kcUAL,
            paranetUAL,
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const knowledgeCollectionId = getKnowledgeCollectionId(kcUAL);

        const kcParanetApprovalStatus =
            await this.blockchainService.getKnowledgeCollectionApprovalStatus(
                {
                    paranetId,
                    knowledgeCollectionId,
                },
                blockchain,
            );

        return {
            kcUAL,
            paranetUAL,
            kcParanetApprovalStatus: PARANET_KNOWLEDGE_COLLECTION_STATUS[kcParanetApprovalStatus],
        };
    }

    /**
     * Adds nodes to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Array<number>} identityIds - List of node Identity IDs.
     * @param {Object} [options={}] - Additional options for adding curated nodes to a paranet.
     * @example
     * await dkg.paranet.addPermissionedNodes(UAL, identityIds: [1, 2]);
     */
    async addPermissionedNodes(paranetUAL, identityIds, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetaddPermissionedNodes(
            paranetUAL,
            blockchain,
            identityIds,
        );

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.addParanetPermissionedNodes(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                identityIds,
            },
            blockchain,
        );
    }

    /**
     * Removes nodes from a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Array<number>} identityIds - List of node Identity IDs to be removed.
     * @param {Object} [options={}] - Additional options for adding curated nodes to a paranet.
     * @example
     * await dkg.paranet.removePermissionedNodes(UAL, identityIds: [1, 2]);
     */
    async removePermissionedNodes(paranetUAL, identityIds, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetremovePermissionedNodes(
            paranetUAL,
            blockchain,
            identityIds,
        );

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.removeParanetPermissionedNodes(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                identityIds,
            },
            blockchain,
        );
    }

    /**
     * Request to become a node in a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @example
     * await dkg.paranet.requestParanetPermissionedNodeAccess(UAL);
     */
    async requestParanetPermissionedNodeAccess(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validaterequestParanetPermissionedNodeAccess(paranetUAL, blockchain);

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.requestParanetPermissionedNodeAccess(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
            },
            blockchain,
        );
    }

    /**
     * Approve a node's access request to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {number} identityId - Identity ID of the node which requested access.
     * @param {Object} [options={}] - Additional options for adding curated nodes to a paranet.
     * @example
     * await dkg.paranet.approvePermissionedNode(UAL, identityId: 1);
     */
    async approvePermissionedNode(paranetUAL, identityId, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateapprovePermissionedNode(paranetUAL, blockchain, identityId);

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.approvePermissionedNode(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                identityId,
            },
            blockchain,
        );
    }

    /**
     * Reject a node's access request to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {number} identityId - Identity ID of the node which requested access.
     * @param {Object} [options={}] - Additional options for adding curated nodes to a paranet.
     * @example
     * await dkg.paranet.rejectPermissionedNode(UAL, identityId: 1);
     */
    async rejectPermissionedNode(paranetUAL, identityId, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validaterejectPermissionedNode(paranetUAL, blockchain, identityId);

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.rejectPermissionedNode(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                identityId,
            },
            blockchain,
        );
    }

    /**
     * Get nodes of a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @returns {Array[number]} Array of nodes identity IDs.
     * @example
     * await dkg.paranet.getPermissionedNodes(UAL);
     */
    async getPermissionedNodes(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validategetPermissionedNodes(paranetUAL, blockchain);

        const paranetId = getParanetId(paranetUAL);

        const permissionedNodes = await this.blockchainService.getPermissionedNodes(
            { paranetId },
            blockchain,
        );

        return permissionedNodes;
    }

    /**
     * Adds miners to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Array<string>} minerAddresses - List of miner addresses to be added.
     * @param {Object} [options={}] - Additional options for adding curated nodes to a paranet.
     * @example
     * await dkg.paranet.addParanetPermissionedMiners(UAL, minerAddresses: [0xminerAddress1, 0xminerAddress2]);
     */
    async addParanetPermissionedMiners(paranetUAL, minerAddresses, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetaddParanetPermissionedMiners(
            paranetUAL,
            blockchain,
            minerAddresses,
        );

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.addParanetPermissionedMiners(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                minerAddresses,
            },
            blockchain,
        );
    }

    /**
     * Removes miners from a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Array<string>} minerAddresses - List of miner addresses to be removed.
     * @param {Object} [options={}] - Additional options for adding curated miners to a paranet.
     * @example
     * await dkg.paranet.removeParanetPermissionedMiners(UAL, identityIds: [1, 2]);
     */
    async removeParanetPermissionedMiners(paranetUAL, minerAddresses, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateParanetremoveParanetPermissionedMiners(
            paranetUAL,
            blockchain,
            minerAddresses,
        );

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.removeParanetPermissionedMiners(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                minerAddresses,
            },
            blockchain,
        );
    }

    /**
     * Request to become a miner in a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @example
     * await dkg.paranet.requestParanetPermissionedMinerAccess(UAL);
     */
    async requestParanetPermissionedMinerAccess(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validaterequestParanetPermissionedMinerAccess(
            paranetUAL,
            blockchain,
        );

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.requestParanetPermissionedMinerAccess(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
            },
            blockchain,
        );
    }

    /**
     * Approve a miner's access request to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {string} minerAddress - Address of the miner which requested access.
     * @param {Object} [options={}] - Additional options for adding curated miners to a paranet.
     * @example
     * await dkg.paranet.approvePermissionedMiner(UAL, minerAddress: 1);
     */
    async approvePermissionedMiner(paranetUAL, minerAddress, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateapprovePermissionedMiner(
            paranetUAL,
            blockchain,
            minerAddress,
        );

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.approvePermissionedMiner(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                minerAddress,
            },
            blockchain,
        );
    }

    /**
     * Reject a miner's access request to a curated paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {string} minerAddress - Address of the miner which requested access.
     * @param {Object} [options={}] - Additional options for adding curated miners to a paranet.
     * @example
     * await dkg.paranet.rejectPermissionedMiner(UAL, minerAddress: 1);
     */
    async rejectPermissionedMiner(paranetUAL, minerAddress, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validaterejectPermissionedMiner(
            paranetUAL,
            blockchain,
            minerAddress,
        );

        const {
            contract: paranetKCStorageContract,
            kcTokenId: paranetKCTokenId,
            kaTokenId: paranetKATokenId,
        } = resolveUAL(paranetUAL);

        if (!paranetKATokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        await this.blockchainService.rejectPermissionedMiner(
            {
                paranetKCStorageContract,
                paranetKCTokenId,
                paranetKATokenId,
                minerAddress,
            },
            blockchain,
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

        this.validationService.validateGetParanetKnowledgeMiners(paranetUAL, blockchain);

        const paranetId = getParanetId(paranetUAL);

        const knowledgeMiners = await this.blockchainService.getKnowledgeMiners(
            { paranetId },
            blockchain,
        );

        return knowledgeMiners;
    }

    /**
     * Deploys an incentives contract for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for the incentives contract.
     * @param {string} options.tracToTokenEmissionMultiplier - How much incentive token is emissioned per 1 TRAC.
     * @param {string} options.operatorRewardPercentage - Percentage of the emissions as a paranet operator fee.
     * @param {string} options.incentivizationProposalVotersRewardPercentage - Percentage of the emissions that will be shared with NEURO holders supporting the proposal.
     * @returns {Object} Object containing the Paranet UAL and incentives pool contract address.
     * @example
     * await dkg.paranet.deployIncentivesContract('paranetUAL123', 'Neuroweb', {
     *     tracToTokenEmissionMultiplier: 1.5,
     *     operatorRewardPercentage: 20,
     *     incentivizationProposalVotersRewardPercentage: 10,
     * });
     */
    async deployIncentivesContract(paranetUAL, options = {}) {
        const {
            blockchain,
            tracToTokenEmissionMultiplier,
            operatorRewardPercentage,
            incentivizationProposalVotersRewardPercentage,
            incentivesPoolName,
            rewardTokenAddress,
        } = this.inputService.getParanetDeployIncentivesContractArguments(options);

        this.validationService.validateDeployIncentivesContract(
            paranetUAL,
            blockchain,
            tracToTokenEmissionMultiplier,
            operatorRewardPercentage,
            incentivizationProposalVotersRewardPercentage,
            incentivesPoolName,
            rewardTokenAddress,
        );

        const { contract: kcStorageContract, kcTokenId, kaTokenId } = resolveUAL(paranetUAL);

        if (!kaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const adjustedEmissionMultiplier = await this.blockchainService.adjustEmissionMultiplier(
            rewardTokenAddress,
            tracToTokenEmissionMultiplier,
            blockchain,
        );

        const receipt = await this.blockchainService.deployIncentivesPool(
            {
                kcStorageContract,
                kcTokenId,
                kaTokenId,
                tracToTokenEmissionMultiplier: adjustedEmissionMultiplier,
                operatorRewardPercentage,
                incentivizationProposalVotersRewardPercentage,
                incentivesPoolName,
                rewardTokenAddress,
            },
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const incentivesPoolAddress = await this.blockchainService.getIncentivesPoolAddress(
            paranetId,
            blockchain,
            {
                incentivesPoolName,
            },
        );

        return {
            paranetUAL,
            incentivesPoolContractAddress: incentivesPoolAddress,
            operation: receipt,
        };
    }

    /**
     * Redeploys an incentives contract for a Paranet.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for the incentives contract.
     * @returns {Object} Object containing the Paranet UAL and incentives pool contract address.
     * @example
     * await dkg.paranet.redeployIncentivesContract('paranetUAL123');
     */
    async redeployIncentivesContract(paranetUAL, poolStorageAddress, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateRedeployIncentivesContract(
            paranetUAL,
            poolStorageAddress,
            blockchain,
        );

        const { contract, kcTokenId, kaTokenId } = resolveUAL(paranetUAL);

        if (!kaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const receipt = await this.blockchainService.redeployIncentivesPool(
            {
                contract,
                kcTokenId,
                kaTokenId,
                poolStorageAddress,
            },
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const incentivesPoolAddress = await this.blockchainService.getIncentivesPoolAddress(
            paranetId,
            blockchain,
            {
                incentivesPoolStorageAddress: poolStorageAddress,
            },
        );

        return {
            paranetUAL,
            incentivesPoolContractAddress: incentivesPoolAddress,
            operation: receipt,
        };
    }

    /**
     * Get all paranet incentives pools.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for the incentives contract.
     * @returns {Object} Object containing the Paranet UAL and incentives pool contract address.
     * @example
     * await dkg.paranet.getAllIncentivesPools('paranetUAL123');
     */
    async getAllIncentivesPools(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);

        this.validationService.validateGetAllIncentivesPools(paranetUAL, blockchain);

        const paranetId = getParanetId(paranetUAL);

        const incentivesPools = await this.blockchainService.getAllIncentivesPools(
            { paranetId },
            blockchain,
        );

        return { paranetUAL, incentivesPools };
    }

    /**
     * Get paranet incentives pool storage address.
     * @async
     * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
     * @param {Object} [options={}] - Additional options for the incentives contract.
     * @returns {Object} Object containing the Paranet UAL and incentives pool storage address.
     * @example
     * await dkg.paranet.getIncentivesPoolStorageAddress('paranetUAL123');
     */
    async getIncentivesPoolStorageAddress(paranetUAL, options = {}) {
        const { blockchain, incentivesPoolName, incentivesPoolAddress } =
            this.inputService.getIncentivesPoolStorageAddressArguments(options);

        this.validationService.validateGetIncentivesPoolStorageAddress(
            paranetUAL,
            incentivesPoolName,
            incentivesPoolAddress,
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const incentivesPoolStorageAddress =
            await this.blockchainService.getIncentivesPoolStorageAddress(paranetId, blockchain, {
                incentivesPoolName,
                incentivesPoolAddress,
            });

        return { paranetUAL, incentivesPoolStorageAddress };
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
    async createService(serviceUAL, options = {}) {
        const {
            blockchain,
            paranetServiceName,
            paranetServiceDescription,
            paranetServiceAddresses,
        } = this.inputService.getParanetCreateServiceArguments(options);
        this.validationService.validateParanetCreateServiceArguments(
            serviceUAL,
            paranetServiceName,
            paranetServiceDescription,
            paranetServiceAddresses,
            blockchain,
        );

        const { contract: kcStorageContract, kcTokenId, kaTokenId } = resolveUAL(serviceUAL);

        if (!kaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const receipt = await this.blockchainService.registerParanetService(
            {
                kcStorageContract,
                kcTokenId,
                kaTokenId,
                paranetServiceName,
                paranetServiceDescription,
                paranetServiceAddresses,
            },
            blockchain,
        );

        return {
            serviceUAL,
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
        const { contract: kcStorageContract, kcTokenId, kaTokenId } = resolveUAL(paranetUAL);
        if (!kaTokenId) {
            throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
        }

        const processedServicesArray = [];
        for (const serviceUAL of paranetServiceUALs) {
            const {
                contract: serviceContract,
                kcTokenId: serviceKCTokenId,
                kaTokenId: serviceKATokenId,
            } = resolveUAL(serviceUAL);
            processedServicesArray.push([serviceContract, serviceKCTokenId, serviceKATokenId]);
        }

        const receipt = await this.blockchainService.addParanetServices(
            {
                kcStorageContract,
                kcTokenId,
                kaTokenId,
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
     * @param {number} amount - Amount of reward to claim.
     * @param {Object} [options={}] - Additional options for claiming reward.
     * @returns {Object} Object containing the transaction hash and status.
     * @example
     * await dkg.paranet.claimMinerReward('paranetUAL123', 100);
     */
    async claimMinerReward(paranetUAL, amount, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const paranetId = getParanetId(paranetUAL);

        const receipt = await this.blockchainService.claimKnowledgeMinerReward(
            paranetId,
            amount,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
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
     * await dkg.paranet.claimVoterReward('paranetUAL123', 100);
     */
    async claimVoterReward(paranetUAL, options = {}) {
        const blockchain = this.inputService.getBlockchain(options);
        this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

        const paranetId = getParanetId(paranetUAL);

        const receipt = await this.blockchainService.claimVoterReward(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });
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

        const paranetId = getParanetId(paranetUAL);

        const receipt = await this.blockchainService.claimOperatorReward(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

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

        const paranetId = getParanetId(paranetUAL);

        const claimableValue = await this.blockchainService.getClaimableKnowledgeMinerReward(
            paranetId,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
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

        const paranetId = getParanetId(paranetUAL);

        const claimableValue = await this.blockchainService.getClaimableAllKnowledgeMinersReward(
            paranetId,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
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

        const paranetId = getParanetId(paranetUAL);

        const claimableValue = await this.blockchainService.getClaimableVoterReward(
            paranetId,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
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

        const paranetId = getParanetId(paranetUAL);

        const claimableValue = await this.blockchainService.getClaimableAllVotersReward(
            paranetId,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
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

        const paranetId = getParanetId(paranetUAL);

        const claimableValue = await this.blockchainService.getClaimableOperatorReward(
            paranetId,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
        );

        return claimableValue;
    }

    // /**
    //  * Updates claimable rewards for a Paranet.
    //  * @async
    //  * @param {string} paranetUAL - Universal Asset Locator of the Paranet.
    //  * @param {Object} [options={}] - Additional options for updating rewards.
    //  * @returns {Object} Object containing transaction hash and status.
    //  * @example
    //  * await dkg.paranet.updateClaimableRewards(paranetUAL);
    //  */
    // async updateClaimableRewards(paranetUAL, options = {}) {
    //     const blockchain = this.inputService.getBlockchain(options);
    //     this.validationService.validateParanetRewardArguments(paranetUAL, blockchain);

    //     const { contract: kcStorageContract, kcTokenId, kaTokenId } = resolveUAL(paranetUAL);
    //     if (!kaTokenId) {
    //         throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
    //     }
    //     const paranetId = getParanetId(paranetUAL);

    //     const updatingKnowledgeAssetStates =
    //         await this.blockchainService.getUpdatingKnowledgeAssetStates(
    //             { miner: blockchain.publicKey, paranetId },
    //             blockchain,
    //         );
    //     if (updatingKnowledgeAssetStates.length > 0) {
    //         const receipt = await this.blockchainService.updateClaimableRewards(
    //             {
    //                 kcStorageContract,
    //                 kcTokenId,
    //                 kaTokenId,
    //                 start: 0,
    //                 end: updatingKnowledgeAssetStates.length,
    //             },
    //             blockchain,
    //         );

    //         return {
    //             operation: receipt,
    //             transactionHash: receipt.transactionHash,
    //             status: receipt.status,
    //         };
    //     }

    //     return {
    //         status: 'No updated knowledge assets.',
    //     };
    // }

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

        const paranetId = getParanetId(paranetUAL);

        const isParanetKnowledgeMiner = await this.blockchainService.isParanetKnowledgeMiner(
            roleAddress,
            paranetId,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
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
        // TODO: Add incentivesPoolName and incentivesPoolStorageAddress to the options
        let { blockchain, roleAddress } = this.inputService.getParanetRoleCheckArguments(options);
        if (roleAddress == null) {
            roleAddress = blockchain.publicKey;
        }
        this.validationService.validateParanetRoleCheckArguments(
            roleAddress,
            paranetUAL,
            blockchain,
        );

        const paranetId = getParanetId(paranetUAL);

        const isParanetOperator = await this.blockchainService.isParanetOperator(
            roleAddress,
            paranetId,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
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

        const paranetId = getParanetId(paranetUAL);

        const isProposalVoter = await this.blockchainService.isParanetProposalVoter(
            roleAddress,
            paranetId,
            blockchain,
            {
                incentivesPoolName: options.incentivesPoolName,
                incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
            },
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

    // async update(
    //     endpoint,
    //     port,
    //     authToken,
    //     assertionId,
    //     assertion,
    //     blockchain,
    //     contract,
    //     tokenId,
    //     hashFunctionId,
    // ) {
    //     try {
    //         const response = await axios({
    //             method: 'post',
    //             url: `${this.getBaseUrl(endpoint, port)}/update`,
    //             data: {
    //                 assertionId,
    //                 assertion,
    //                 blockchain,
    //                 contract,
    //                 tokenId,
    //                 hashFunctionId,
    //             },
    //             headers: this.prepareRequestConfig(authToken),
    //         });

    //         return response.data.operationId;
    //     } catch (error) {
    //         throw Error(`Unable to update: ${error.message}`);
    //     }
    // }

    async query(endpoint, port, authToken, query, type, paranetUAL, repository) {
        try {
            const response = await axios({
                method: 'post',
                url: `${this.getBaseUrl(endpoint, port)}/direct-query`,
                data: { query, type, repository, paranetUAL },
                headers: this.prepareRequestConfig(authToken),
            });
            return response.data;
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
            status: OPERATION_STATUSES$1.PENDING,
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
            response.data.status !== OPERATION_STATUSES$1.COMPLETED &&
            response.data.status !== OPERATION_STATUSES$1.FAILED &&
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
const ParanetIncentivesPoolAbi = require$1('dkg-evm-module/abi/ParanetIncentivesPool.json');
const ParanetIncentivesPoolStorageAbi = require$1('dkg-evm-module/abi/ParanetIncentivesPoolStorage.json');
const ParanetKnowledgeMinersRegistryAbi = require$1('dkg-evm-module/abi/ParanetKnowledgeMinersRegistry.json');
const ParanetStagingRegistryAbi = require$1('dkg-evm-module/abi/ParanetStagingRegistry.json');
const IdentityStorageAbi = require$1('dkg-evm-module/abi/IdentityStorage.json');
const KnowledgeCollectionAbi = require$1('dkg-evm-module/abi/KnowledgeCollection.json');
const KnowledgeCollectionStorageAbi = require$1('dkg-evm-module/abi/KnowledgeCollectionStorage.json');
const AskStorageAbi = require$1('dkg-evm-module/abi/AskStorage.json');
const ChronosAbi = require$1('dkg-evm-module/abi/Chronos.json');
const IERC20ExtendedAbi = require$1('dkg-evm-module/abi/IERC20Extended.json');

class BlockchainServiceBase {
    constructor(config = {}) {
        this.config = config;
        this.events = {};
        this.abis = {};
        this.abis.Hub = HubAbi;
        this.abis.Token = TokenAbi;
        this.abis.Paranet = ParanetAbi;
        this.abis.ParanetsRegistry = ParanetsRegistryAbi;
        this.abis.ParanetIncentivesPoolFactory = ParanetIncentivesPoolFactoryAbi;
        this.abis.ParanetIncentivesPool = ParanetIncentivesPoolAbi;
        this.abis.ParanetIncentivesPoolStorage = ParanetIncentivesPoolStorageAbi;
        this.abis.ParanetKnowledgeMinersRegistry = ParanetKnowledgeMinersRegistryAbi;
        this.abis.IdentityStorage = IdentityStorageAbi;
        this.abis.KnowledgeCollection = KnowledgeCollectionAbi;
        this.abis.KnowledgeCollectionStorage = KnowledgeCollectionStorageAbi;
        this.abis.AskStorage = AskStorageAbi;
        this.abis.Chronos = ChronosAbi;
        this.abis.ParanetStagingRegistry = ParanetStagingRegistryAbi;
        this.abis.IERC20Extended = IERC20ExtendedAbi;
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
            if (this.isOtpOrBase(blockchain.name)) {
                return await web3Instance.eth.getGasPrice();
            }

            return this.getDefaultGasPrice(blockchain.name);
        } catch (error) {
            console.warn(
                `Failed to fetch the gas price from the network: ${error}. Using default value.`,
            );
            return this.getDefaultGasPrice(blockchain.name);
        }
    }

    isOtpOrBase(name) {
        return name.startsWith('otp') || name.startsWith('base');
    }

    isGnosis(name) {
        return name.startsWith('gnosis');
    }

    getDefaultGasPrice(name) {
        let defaultGasPrice;
        if (name.startsWith('otp')) {
            defaultGasPrice = DEFAULT_GAS_PRICE.OTP;
        } else if (name.startsWith('base')) {
            defaultGasPrice = DEFAULT_GAS_PRICE.BASE;
        } else {
            defaultGasPrice = DEFAULT_GAS_PRICE.GNOSIS;
        }
        return Web3.utils.toWei(defaultGasPrice, 'Gwei');
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

                if (!status && contractName !== 'ParanetIncentivesPool') {
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
            } else {
                gasPrice = blockchain.gasPrice || (await this.getNetworkGasPrice(blockchain));
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

    async waitForEventFinality(initialReceipt, eventName, expectedEventId, blockchain, confirmations = 1) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);

        // Guaranteed to be defined for OTP chains
        const polling = blockchain.transactionFinalityPollingInterval;
        const reminingPollingInterval = blockchain.transactionReminingPollingInterval;

        let receipt = initialReceipt;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            // 1. Wait until the block containing the tx is at the required depth
            while (await web3Instance.eth.getBlockNumber() < receipt.blockNumber + confirmations) {
                await sleepForMilliseconds(polling);
            }

            // 2. Verify the tx is still in that block
            const block = await web3Instance.eth.getBlock(receipt.blockNumber, true);

            const txStillIncluded =
                block &&
                block.transactions.some(
                    (tx) => tx.hash.toLowerCase() === receipt.transactionHash.toLowerCase(),
                );

            if (txStillIncluded) {
                const currentReceipt = await web3Instance.eth.getTransactionReceipt(
                    receipt.transactionHash,
                );

                const eventData = await this.decodeEventLogs(currentReceipt, eventName, blockchain);

                const idMatches =
                    expectedEventId == null ||
                    (eventData && eventData.id != null && eventData.id.toString() === expectedEventId.toString());

                if (eventData && idMatches) {
                    return { receipt: currentReceipt, eventData };
                }
            }

            // 3. Re-org detected: wait for tx to appear again
            const timeoutMs = 60 * 1000; // 1 minute
            const startTime = Date.now();
            let newReceipt = null;
            // eslint-disable-next-line no-await-in-loop
            while (!newReceipt) {
                if (Date.now() - startTime >= timeoutMs) {
                    throw new Error(
                        `Timeout: Transaction receipt for ${receipt.transactionHash} not found after 1 minute of re-mining polling.`,
                    );
                }
                await sleepForMilliseconds(reminingPollingInterval);
                newReceipt = await web3Instance.eth.getTransactionReceipt(receipt.transactionHash);
            }
            receipt = newReceipt;
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

    async decreaseKnowledgeCollectionAllowance(allowanceGap, blockchain) {
        const knowledgeCollectionAddress = await this.getContractAddress(
            'KnowledgeCollection',
            blockchain,
        );

        await this.executeContractFunction(
            'Token',
            'decreaseAllowance',
            [knowledgeCollectionAddress, allowanceGap],
            blockchain,
        );
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
        stepHooks = emptyHooks$1,
    ) {
        const sender = await this.getPublicKey(blockchain);
        let allowanceIncreased = false;
        let allowanceGap = 0;

        try {
            if (requestData?.paymaster && requestData?.paymaster !== ZERO_ADDRESS) {
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
                    'mintKnowledgeCollection',
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
            if (allowanceIncreased) {
                await this.decreaseKnowledgeCollectionAllowance(allowanceGap, blockchain);
            }
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

    async isKnowledgeCollectionRegistered(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetsRegistry',
            'isKnowledgeCollectionRegistered',
            Object.values(requestData),
            blockchain,
        );
    }

    async addCurator(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'addCurator',
            Object.values(requestData),
            blockchain,
        );
    }

    async stageKnowledgeCollection(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'stageKnowledgeCollection',
            Object.values(requestData),
            blockchain,
        );
    }

    async reviewKnowledgeCollection(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'reviewKnowledgeCollection',
            Object.values(requestData),
            blockchain,
        );
    }

    async isKnowledgeCollectionStaged(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetStagingRegistry',
            'isKnowledgeCollectionStaged',
            Object.values(requestData),
            blockchain,
        );
    }

    async isKnowledgeCollectionApproved(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetStagingRegistry',
            'isKnowledgeCollectionApproved',
            Object.values(requestData),
            blockchain,
        );
    }

    async getKnowledgeCollectionApprovalStatus(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetStagingRegistry',
            'getKnowledgeCollectionStatus',
            Object.values(requestData),
            blockchain,
        );
    }

    async removeCurator(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'removeCurator',
            Object.values(requestData),
            blockchain,
        );
    }

    async addParanetPermissionedNodes(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'addParanetPermissionedNodes',
            Object.values(requestData),
            blockchain,
        );
    }

    async removeParanetPermissionedNodes(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'removeParanetPermissionedNodes',
            Object.values(requestData),
            blockchain,
        );
    }

    async requestParanetPermissionedNodeAccess(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'requestParanetPermissionedNodeAccess',
            Object.values(requestData),
            blockchain,
        );
    }

    async approvePermissionedNode(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'approvePermissionedNode',
            Object.values(requestData),
            blockchain,
        );
    }

    async rejectPermissionedNode(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'rejectPermissionedNode',
            Object.values(requestData),
            blockchain,
        );
    }

    async getPermissionedNodes(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetsRegistry',
            'getPermissionedNodes',
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

    async addParanetPermissionedMiners(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'addParanetPermissionedMiners',
            Object.values(requestData),
            blockchain,
        );
    }

    async removeParanetPermissionedMiners(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'removeParanetPermissionedMiners',
            Object.values(requestData),
            blockchain,
        );
    }

    async requestParanetPermissionedMinerAccess(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'requestParanetPermissionedMinerAccess',
            Object.values(requestData),
            blockchain,
        );
    }

    async approvePermissionedMiner(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'approvePermissionedMiner',
            Object.values(requestData),
            blockchain,
        );
    }

    async rejectPermissionedMiner(requestData, blockchain) {
        return this.executeContractFunction(
            'Paranet',
            'rejectPermissionedMiner',
            Object.values(requestData),
            blockchain,
        );
    }

    async deployIncentivesPool(requestData, blockchain) {
        return this.executeContractFunction(
            'ParanetIncentivesPoolFactory',
            'deployIncentivesPool',
            Object.values(requestData),
            blockchain,
        );
    }

    async redeployIncentivesPool(requestData, blockchain) {
        return this.executeContractFunction(
            'ParanetIncentivesPoolFactory',
            'redeployIncentivesPool',
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
            'submitKnowledgeCollection',
            Object.values(requestData),
            blockchain,
        );
    }

    async getUpdatingKnowledgeAssetStates(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetKnowledgeMinersRegistry',
            'getUpdatingKnowledgeCollectionStates',
            Object.values(requestData),
            blockchain,
        );
    }

    // async updateClaimableRewards(requestData, blockchain) {
    //     return this.executeContractFunction(
    //         'Paranet',
    //         'processUpdatedKnowledgeCollectionStatesMetadata',
    //         Object.values(requestData),
    //         blockchain,
    //     );
    // }

    async getParanetIncentivesPoolAddress(blockchain) {
        return this.callContractFunction(
            'ParanetIncentivesPoolStorage',
            'paranetIncentivesPoolAddress',
            [],
            blockchain,
        );
    }

    async getIncentivesPoolByPoolName(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetsRegistry',
            'getIncentivesPoolByPoolName',
            Object.values(requestData),
            blockchain,
        );
    }

    async getIncentivesPoolByStorageAddress(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetsRegistry',
            'getIncentivesPoolByStorageAddress',
            Object.values(requestData),
            blockchain,
        );
    }

    async getAllIncentivesPools(requestData, blockchain) {
        return this.callContractFunction(
            'ParanetsRegistry',
            'getAllIncentivesPools',
            Object.values(requestData),
            blockchain,
        );
    }

    async setIncentivesPoolStorage(contractAddress, blockchain) {
        await this.ensureBlockchainInfo(blockchain);

        if (
            this[blockchain.name].contractAddresses[blockchain.hubContract][
                'ParanetIncentivesPoolStorage'
            ] !== contractAddress
        ) {
            this[blockchain.name].contractAddresses[blockchain.hubContract][
                'ParanetIncentivesPoolStorage'
            ] = contractAddress;
            const web3Instance = await this.getWeb3Instance(blockchain);
            this[blockchain.name].contracts[blockchain.hubContract][
                'ParanetIncentivesPoolStorage'
            ] = await new web3Instance.eth.Contract(
                this.abis['ParanetIncentivesPoolStorage'],
                this[blockchain.name].contractAddresses[blockchain.hubContract][
                    'ParanetIncentivesPoolStorage'
                ],
                { from: blockchain.publicKey },
            );
        }
    }

    async getIncentivesPoolAddress(paranetId, blockchain, options = {}) {
        const { incentivesPoolName } = options;
        let { incentivesPoolStorageAddress } = options;

        if (!incentivesPoolStorageAddress && !incentivesPoolName) {
            throw new Error(
                'Either incentivesPoolName or incentivesPoolStorageAddress must be provided to get the incentives pool address.',
            );
        }

        // If storage address is not provided, get it from pool name
        if (!incentivesPoolStorageAddress) {
            const incentivesPool = await this.getIncentivesPoolByPoolName(
                { paranetId, incentivesPoolName },
                blockchain,
            );
            incentivesPoolStorageAddress = incentivesPool.storageAddr;
        }

        await this.setIncentivesPoolStorage(incentivesPoolStorageAddress, blockchain);
        return await this.getParanetIncentivesPoolAddress(blockchain);
    }

    async setIncentivesPool(contractAddress, blockchain) {
        await this.ensureBlockchainInfo(blockchain);

        if (
            this[blockchain.name].contractAddresses[blockchain.hubContract][
                'ParanetIncentivesPool'
            ] !== contractAddress
        ) {
            this[blockchain.name].contractAddresses[blockchain.hubContract][
                'ParanetIncentivesPool'
            ] = contractAddress;
            const web3Instance = await this.getWeb3Instance(blockchain);
            this[blockchain.name].contracts[blockchain.hubContract]['ParanetIncentivesPool'] =
                await new web3Instance.eth.Contract(
                    this.abis['ParanetIncentivesPool'],
                    this[blockchain.name].contractAddresses[blockchain.hubContract][
                        'ParanetIncentivesPool'
                    ],
                    { from: blockchain.publicKey },
                );
        }
    }

    async getIncentivesPoolStorageAddress(paranetId, blockchain, options = {}) {
        let { incentivesPoolAddress } = options;
        const { incentivesPoolName } = options;

        if (!incentivesPoolAddress) {
            const incentivesPool = await this.getIncentivesPoolByPoolName(
                { paranetId, incentivesPoolName },
                blockchain,
            );
            return incentivesPool.storageAddr;
        }

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
            'paranetIncentivesPoolStorage',
            [],
            blockchain,
        );
    }

    async claimKnowledgeMinerReward(paranetId, amount, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.executeContractFunction(
            'ParanetIncentivesPool',
            'claimKnowledgeMinerReward',
            [amount],
            blockchain,
        );
    }

    async claimVoterReward(paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.executeContractFunction(
            'ParanetIncentivesPool',
            'claimIncentivizationProposalVoterReward',
            [],
            blockchain,
        );
    }

    async claimOperatorReward(paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.executeContractFunction(
            'ParanetIncentivesPool',
            'claimParanetOperatorReward',
            [],
            blockchain,
        );
    }

    async getClaimableKnowledgeMinerReward(paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
            'getClaimableKnowledgeMinerRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableAllKnowledgeMinersReward(paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
            'getClaimableAllKnowledgeMinersRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableVoterReward(paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
            'getClaimableProposalVoterRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableAllVotersReward(paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
            'getClaimableAllProposalVotersRewardAmount',
            [],
            blockchain,
        );
    }

    async getClaimableOperatorReward(paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
            'getClaimableParanetOperatorRewardAmount',
            [],
            blockchain,
        );
    }

    async isParanetKnowledgeMiner(address, paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
            'isKnowledgeMiner',
            [address],
            blockchain,
        );
    }

    async isParanetOperator(address, paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
            'isParanetOperator',
            [address],
            blockchain,
        );
    }

    async isParanetProposalVoter(address, paranetId, blockchain, options = {}) {
        const incentivesPoolAddress = await this.getIncentivesPoolAddress(paranetId, blockchain, {
            incentivesPoolName: options.incentivesPoolName,
            incentivesPoolStorageAddress: options.incentivesPoolStorageAddress,
        });

        await this.setIncentivesPool(incentivesPoolAddress, blockchain);

        return this.callContractFunction(
            'ParanetIncentivesPool',
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
            } else {
                gasPrice = Web3.utils.toWei(DEFAULT_GAS_PRICE.GNOSIS, 'Gwei');
            }
            return gasPrice;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(`Failed to fetch the gas price from the network: ${error}. `);
            let defaultGasPrice;

            if (blockchain.name.startsWith('otp')) {
                defaultGasPrice = DEFAULT_GAS_PRICE.OTP;
            } else if (blockchain.name.startsWith('base')) {
                defaultGasPrice = DEFAULT_GAS_PRICE.BASE;
            } else {
                defaultGasPrice = DEFAULT_GAS_PRICE.GNOSIS;
            }

            return Web3.utils.toWei(defaultGasPrice, 'Gwei');
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

    async adjustEmissionMultiplier(rewardTokenAddress, tracToTokenEmissionMultiplier, blockchain) {
        if (rewardTokenAddress !== ZERO_ADDRESS) {
            // Create contract instance for ERC20 token
            await this.ensureBlockchainInfo(blockchain);
            const web3Instance = await this.getWeb3Instance(blockchain);
            const tokenContract = new web3Instance.eth.Contract(
                this.abis.IERC20Extended,
                rewardTokenAddress,
            );

            try {
                const decimals = await tokenContract.methods.decimals().call();
                return BigInt(tracToTokenEmissionMultiplier) * BigInt(10) ** BigInt(decimals);
            } catch (error) {
                console.log(
                    'ERC20 token is missing decimals function, adding 18 decimals as default',
                );
                return BigInt(tracToTokenEmissionMultiplier) * BigInt(10) ** BigInt(18);
            }
        } else {
            // Neuroweb chains use 12 decimals
            if (NEUROWEB_INCENTIVE_TYPE_CHAINS.includes(blockchain.name)) {
                return BigInt(tracToTokenEmissionMultiplier) * BigInt(10) ** BigInt(12);
            } else {
                // Other chains use 18 decimals (e.g., ETH)
                return BigInt(tracToTokenEmissionMultiplier) * BigInt(10) ** BigInt(18);
            }
        }
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
            'KnowledgeCollectionStorage',
            'safeTransferFrom',
            [await this.getAccount(), to, tokenId, 1, '0x'],
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

                    if (!status && contractName !== 'ParanetIncentivesPool') {
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
            'KnowledgeCollectionStorage',
            'safeTransferFrom',
            [blockchain.publicKey, to, tokenId, 1, '0x'],
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
        this.validateKAUAL(UAL);
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
        paranetKcSubmissionPolicy,
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
        this.validateParanetName(paranetName);
        this.validateParanetDescription(paranetDescription);
        this.validateParanetNodesAccessPolicy(paranetNodesAccessPolicy);
        this.validateParanetMinersAccessPolicy(paranetMinersAccessPolicy);
        this.validateParanetKcSubmissionPolicy(paranetKcSubmissionPolicy);
    }

    validateParanetIsKnowledgeCollectionRegistered(kcUAL, paranetUAL, blockchain) {
        this.validateUAL(kcUAL);
        this.validateUAL(paranetUAL);
        this.validateBlockchain(blockchain);
    }

    validateParanetAddCurator(paranetUAL, curatorAddress, blockchain) {
        this.validateUAL(paranetUAL);
        this.validateAddress(curatorAddress);
        this.validateBlockchain(blockchain);
    }

    validateParanetRemoveCurator(paranetUAL, curatorAddress, blockchain) {
        this.validateUAL(paranetUAL);
        this.validateAddress(curatorAddress);
        this.validateBlockchain(blockchain);
    }

    validateParanetReviewKnowledgeCollection(kcUAL, paranetUAL, accepted, blockchain) {
        this.validateUAL(kcUAL);
        this.validateUAL(paranetUAL);
        this.validateAccepted(accepted);
        this.validateBlockchain(blockchain);
    }

    validateParanetStageKnowledgeCollection(kcUAL, paranetUAL, blockchain) {
        this.validateUAL(kcUAL);
        this.validateUAL(paranetUAL);
        this.validateBlockchain(blockchain);
    }

    validateParanetIsKnowledgeCollectionStaged(kcUAL, paranetUAL, blockchain) {
        this.validateUAL(kcUAL);
        this.validateUAL(paranetUAL);
        this.validateBlockchain(blockchain);
    }

    validateParanetIsKnowledgeCollectionApproved(kcUAL, paranetUAL, blockchain) {
        this.validateUAL(kcUAL);
        this.validateUAL(paranetUAL);
        this.validateBlockchain(blockchain);
    }

    validateParanetGetKnowledgeCollectionApprovalStatus(kcUAL, paranetUAL, blockchain) {
        this.validateUAL(kcUAL);
        this.validateUAL(paranetUAL);
        this.validateBlockchain(blockchain);
    }

    validateParanetaddPermissionedNodes(UAL, blockchain, identityIds) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);

        for (const identityId of identityIds) {
            this.validateIdentityId(identityId);
        }
    }

    validateParanetremovePermissionedNodes(UAL, blockchain, identityIds) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);

        for (const identityId of identityIds) {
            this.validateIdentityId(identityId);
        }
    }

    validaterequestParanetPermissionedNodeAccess(UAL, blockchain) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateapprovePermissionedNode(UAL, blockchain, identityId) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
        this.validateIdentityId(identityId);
    }

    validaterejectPermissionedNode(UAL, blockchain, identityId) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
        this.validateIdentityId(identityId);
    }

    validategetPermissionedNodes(UAL, blockchain) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateGetParanetKnowledgeMiners(UAL, blockchain) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateParanetaddParanetPermissionedMiners(UAL, blockchain, minerAddresses) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);

        for (const minerAddress of minerAddresses) {
            this.validateAddress(minerAddress);
        }
    }

    validateParanetremoveParanetPermissionedMiners(UAL, blockchain, minerAddresses) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);

        for (const minerAddress of minerAddresses) {
            this.validateAddress(minerAddress);
        }
    }

    validaterequestParanetPermissionedMinerAccess(UAL, blockchain) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateapprovePermissionedMiner(UAL, blockchain, minerAddress) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
        this.validateAddress(minerAddress);
    }

    validaterejectPermissionedMiner(UAL, blockchain, minerAddress) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
        this.validateAddress(minerAddress);
    }

    validateDeployIncentivesContract(
        UAL,
        blockchain,
        tracToTokenEmissionMultiplier,
        operatorRewardPercentage,
        incentivizationProposalVotersRewardPercentage,
        incentivesPoolName,
        rewardTokenAddress,
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
        this.validateTracToTokenEmissionMultiplier(tracToTokenEmissionMultiplier);
        this.validateOperatorRewardPercentage(operatorRewardPercentage);
        this.validateIncentivizationProposalVotersRewardPercentage(
            incentivizationProposalVotersRewardPercentage,
        );
        this.validateIncentivesPoolName(incentivesPoolName);
        this.validateAddress(rewardTokenAddress);
    }

    validateRedeployIncentivesContract(UAL, poolStorageAddress, blockchain) {
        this.validateUAL(UAL);
        this.validateAddress(poolStorageAddress);
        this.validateBlockchain(blockchain);
    }

    validateGetAllIncentivesPools(UAL, blockchain) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateGetIncentivesPoolStorageAddress(
        UAL,
        incentivesPoolName,
        incentivesPoolAddress,
        blockchain,
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);

        if (incentivesPoolName) {
            this.validateIncentivesPoolName(incentivesPoolName);
        }

        if (incentivesPoolAddress) {
            this.validateAddress(incentivesPoolAddress);
        }

        if (!incentivesPoolName && !incentivesPoolAddress) {
            throw new Error(
                'Either incentives pool name or address is required for this operation!',
            );
        }
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

    validateKAUAL(ual) {
        this.validateRequiredParam('UAL', ual);
        this.validateParamType('UAL', ual, 'string');

        const segments = ual.split(':');
        const argsString = segments.length === 3 ? segments[2] : `${segments[2]}:${segments[3]}`;
        const args = argsString.split('/');
        if (args?.length !== 4) throw Error('Invalid UAL.');
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

            if (![OPERATIONS.GET, OPERATIONS.QUERY, OPERATIONS.FINALITY].includes(operation)) {
                this.validateRequiredParam('blockchain private key', blockchain.privateKey);
                this.validateRequiredParam('blockchain public key', blockchain.publicKey);
            }
        }
    }

    validateNewOwner(newOwner) {
        this.validateRequiredParam('newOwner', newOwner);
        this.validateParamType('newOwner', newOwner, 'string');
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

    validateParanetKcSubmissionPolicy(paranetKcSubmissionPolicy) {
        this.validateRequiredParam('paranetKcSubmissionPolicy', paranetKcSubmissionPolicy);
        this.validateParamType('paranetKcSubmissionPolicy', paranetKcSubmissionPolicy, 'number');
        if (!Object.values(PARANET_KC_SUBMISSION_POLICY).includes(paranetKcSubmissionPolicy))
            throw Error(
                `Invalid paranet KC submission policy: ${paranetKcSubmissionPolicy}. Should be 0 for OPEN or 1 for CURATED`,
            );
    }

    validateTracToTokenEmissionMultiplier(tracToTokenEmissionMultiplier) {
        this.validateRequiredParam('tracToTokenEmissionMultiplier', tracToTokenEmissionMultiplier);
        this.validateParamType(
            'tracToTokenEmissionMultiplier',
            tracToTokenEmissionMultiplier,
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

    validateIncentivesPoolName(incentivesPoolName) {
        this.validateRequiredParam('incentivesPoolName', incentivesPoolName);
        this.validateParamType('incentivesPoolName', incentivesPoolName, 'string');
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

    validateAccepted(accepted) {
        this.validateRequiredParam('accepted', accepted);
        this.validateParamType('accepted', accepted, 'boolean');
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
            paranetKcSubmissionPolicy: this.getParanetKcSubmissionPolicy(options),
        };
    }

    getParanetDeployIncentivesContractArguments(options) {
        return {
            blockchain: this.getBlockchain(options),
            tracToTokenEmissionMultiplier: this.getTracToTokenEmissionMultiplier(options),
            operatorRewardPercentage: this.getOperatorRewardPercentage(options),
            incentivizationProposalVotersRewardPercentage:
                this.getIncentivizationProposalVotersRewardPercentage(options),
            incentivesPoolName: this.getIncentivesPoolName(options),
            rewardTokenAddress: this.getRewardTokenAddress(options),
        };
    }

    getIncentivesPoolStorageAddressArguments(options) {
        return {
            incentivesPoolName: this.getIncentivesPoolName(options),
            incentivesPoolAddress: this.getIncentivesPoolAddress(options),
            blockchain: this.getBlockchain(options),
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

    getParanetKcSubmissionPolicy(options) {
        return options.paranetKcSubmissionPolicy ?? PARANET_KC_SUBMISSION_POLICY.OPEN;
    }

    getTracToTokenEmissionMultiplier(options) {
        return options.tracToTokenEmissionMultiplier ?? null;
    }

    getIncentivizationProposalVotersRewardPercentage(options) {
        return options.incentivizationProposalVotersRewardPercentage * 100 ?? null;
    }

    getOperatorRewardPercentage(options) {
        return options.operatorRewardPercentage * 100 ?? null;
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

    getIncentivesPoolName(options) {
        return options.incentivesPoolName ?? null;
    }

    getIncentivesPoolAddress(options) {
        return options.incentivesPoolAddress ?? null;
    }

    getRewardTokenAddress(options) {
        return options.rewardTokenAddress ?? ZERO_ADDRESS;
    }
}

// interfaces

class BaseServiceManager {
    constructor(config) {
        const blockchainName = config.blockchain?.name;
        if (!blockchainName) {
            throw new Error('Blockchain name is required. Please set it manually.');
        }

        for (const [env, chainsInEnv] of Object.entries(BLOCKCHAINS)) {
            if (Object.keys(chainsInEnv).includes(blockchainName)) {
                config.environment = env;
                break;
            }
        }

        if (!config.environment) {
            throw new Error(
                `Could not derive environment from blockchain name: ${blockchainName}. Ensure it's defined in BLOCKCHAINS constant.`,
            );
        }

        if (config.blockchain?.privateKey) {
            try {
                const wallet = new ethers.ethers.Wallet(config.blockchain.privateKey);
                config.blockchain.publicKey = wallet.address;
            } catch (error) {
                throw new Error(`Failed to derive public key from private key: ${error.message}`);
            }
        }

        this.initializeServices(config);
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
        this.graph.publishFinality = this.asset.publishFinality.bind(this.asset);
    }
}

module.exports = DkgClient;
