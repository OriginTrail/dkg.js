import { kaTools, kcTools } from 'assertion-tools';
import { ethers } from 'ethers';
import {
    deriveUAL,
    getOperationStatusObject,
    resolveUAL,
    sleepForMilliseconds,
} from '../services/utilities.js';
import {
    OPERATIONS,
    OPERATION_STATUSES,
    ZERO_ADDRESS,
    CHUNK_BYTE_SIZE,
    OPERATION_DELAYS,
    PRIVATE_RESOURCE_PREDICATE,
    PRIVATE_HASH_SUBJECT_PREFIX,
    PRIVATE_ASSERTION_PREDICATE,
} from '../constants.js';
import emptyHooks from '../util/empty-hooks.js';

export default class AssetOperationsManager {
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

        const serviceAgreementV1Address = await this.blockchainService.getContractAddress(
            'ServiceAgreementV1',
            blockchain,
        );

        const receipt = await this.blockchainService.executeContractFunction(
            'Token',
            'increaseAllowance',
            [serviceAgreementV1Address, tokenAmount],
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
    }

    /**
     * Creates a new knowledge collection.
     * @async
     * @param {Object} content - The content of the knowledge collection to be created, contains public, private or both keys.
     * @param {Object} [options={}] - Additional options for knowledge collection creation.
     * @param {Object} [stepHooks=emptyHooks] - Hooks to execute during knowledge collection creation.
     * @returns {Object} Object containing UAL, publicAssertionMerkleRoot and operation status.
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
            paranetUAL,
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
            paranetUAL,
            payer,
            minimumNumberOfFinalizationConfirmations,
            minimumNumberOfNodeReplications,
        );

        let assertion = {};
        if (typeof content === 'string') {
            assertion.public = this.processContent(content);
        } else if (
            typeof content.public === 'string' ||
            (!content.public && content.private && typeof content.private === 'string')
        ) {
            if (content.public) {
                assertion.public = this.processContent(content.public);
            } else {
                assertion.public = [];
            }
            if (content.private && typeof content.private === 'string') {
                assertion.private = this.processContent(content.private);
            }
        } else {
            assertion = await kcTools.formatAssertion(content);
        }

        if (assertion.private?.length) {
            assertion.private = kcTools.generateMissingIdsForBlankNodes(assertion.private);

            const privateTriplesGrouped = kcTools.groupNquadsBySubject(assertion.private, true);
            assertion.private = privateTriplesGrouped.flat();
            const privateRoot = kcTools.calculateMerkleRoot(assertion.private);

            assertion.public.push(
                `<${kaTools.generateNamedNode()}> <${PRIVATE_ASSERTION_PREDICATE}> "${privateRoot}" .`,
            );

            if (assertion.public.length) {
                assertion.public = kcTools.generateMissingIdsForBlankNodes(assertion.public);
            }
            let publicTriplesGrouped = kcTools.groupNquadsBySubject(assertion.public, true);

            const mergedTriples = [];
            let publicIndex = 0;
            let privateIndex = 0;
            const publicLength = publicTriplesGrouped.length;
            const privateLength = privateTriplesGrouped.length;

            // Merge public and private hashes triples in a single pass
            while (publicIndex < publicLength && privateIndex < privateLength) {
                const publicGroup = publicTriplesGrouped[publicIndex];
                const [publicSubject] = publicGroup[0].split(' ');
                const [privateSubject] = privateTriplesGrouped[privateIndex][0].split(' ');

                const compare = publicSubject.localeCompare(privateSubject);
                if (compare < 0) {
                    // Public subject comes before private subject
                    mergedTriples.push(publicGroup);
                    publicIndex++;
                } else if (compare > 0) {
                    // Private subject comes before public subject
                    mergedTriples.push([this.generatePrivateRepresentation(privateSubject)]);
                    privateIndex++;
                } else {
                    // Subjects match, merge triples
                    this.insertTripleSorted(
                        publicGroup,
                        this.generatePrivateRepresentation(privateSubject),
                    );
                    mergedTriples.push(publicGroup);
                    publicIndex++;
                    privateIndex++;
                }
            }

            while (publicIndex < publicLength) {
                mergedTriples.push(...publicTriplesGrouped[publicIndex]);
                publicIndex++;
            }

            // Append any remaining private triples
            while (privateIndex < privateLength) {
                const [privateSubject] = privateTriplesGrouped[privateIndex][0].split(' ');
                mergedTriples.push([this.generatePrivateRepresentation(privateSubject)]);
                privateIndex++;
            }
            // Update the public assertion with the merged triples
            assertion.public = mergedTriples.flat();
        } else {
            // If there's no private assertion, ensure public is grouped correctly
            assertion.public = kcTools.groupNquadsBySubject(assertion.public, true).flat();
        }

        const numberOfChunks = kcTools.calculateNumberOfChunks(assertion.public, CHUNK_BYTE_SIZE);
        const assertionSize = numberOfChunks * CHUNK_BYTE_SIZE;

        this.validationService.validateAssertionSizeInBytes(assertionSize);
        const assertionMerkleRoot = kcTools.calculateMerkleRoot(assertion.public);

        const contentAssetStorageAddress = await this.blockchainService.getContractAddress(
            'KnowledgeCollectionStorage',
            blockchain,
        );

        const publishOperationId = await this.nodeApiService.publish(
            endpoint,
            port,
            authToken,
            assertionMerkleRoot,
            assertion,
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
            !publishOperationResult.minAcksReached
        ) {
            return {
                assertionMerkleRoot,
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

        signatures.forEach((signature) => {
            identityIds.push(signature.identityId);
            r.push(signature.r);
            vs.push(signature.vs);
        });

        const estimatedPublishingCost =
            tokenAmount ??
            (await this.blockchainService.getStakeWeightedAverageAsk()) * epochsNum * assertionSize;

        let knowledgeCollectionId;
        let mintKnowledgeAssetReceipt;

        if (paranetUAL == null) {
            ({ knowledgeCollectionId, receipt: mintKnowledgeAssetReceipt } =
                await this.blockchainService.createKnowledgeCollection(
                    {
                        publishOperationId,
                        merkleRoot: assertionMerkleRoot,
                        knowledgeAssetsAmount: kcTools.countDistinctSubjects(assertion.public),
                        byteSize: assertionSize,
                        triplesAmount: kaTools.getAssertionTriplesNumber(assertion.public),
                        chunksAmount: numberOfChunks,
                        epochs: epochsNum,
                        tokenAmount: estimatedPublishingCost,
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
        } else {
            const { contract: paranetKaContract, tokenId: paranetTokenId } = resolveUAL(paranetUAL);
            ({ knowledgeCollectionId, receipt: mintKnowledgeAssetReceipt } =
                await this.blockchainService.createKnowledgeCollection(
                    {
                        merkleRoot: assertionMerkleRoot,
                        knowledgeAssetsAmount: kcTools.countDistinctSubjects(assertion.public),
                        byteSize: assertionSize,
                        triplesAmount: kaTools.getAssertionTriplesNumber(assertion.public),
                        chunksAmount: numberOfChunks,
                        epochs: epochsNum,
                        tokenAmount: estimatedPublishingCost,
                        paymaster: payer,
                        publisherNodeIdentityId,
                        publisherNodeR,
                        publisherNodeVS,
                        identityIds,
                        r,
                        vs,
                    },
                    paranetKaContract,
                    paranetTokenId,
                    blockchain,
                    stepHooks,
                ));
        }

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
            assertionMerkleRoot,
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

    generatePrivateRepresentation(privateSubject) {
        return `${`<${PRIVATE_HASH_SUBJECT_PREFIX}${ethers.solidityPackedSha256(
            ['string'],
            [privateSubject.slice(1, -1)],
        )}>`} <${PRIVATE_RESOURCE_PREDICATE}> <${kaTools.generateNamedNode()}> .`;
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

        const state = await this.blockchainService.getAssertionMerkleRootByIndex(
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

        const states = await this.blockchainService.getAssertionMerkleRoots(tokenId, blockchain);

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

        const states = await this.blockchainService.getAssertionMerkleRoots(tokenId, blockchain);

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
                assertionSize; // need to get assertion size somewhere
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

            const latestFinalizedState = await this.blockchainService.getLatestAssertionMerkleRoot(
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
        const firstassertionMerkleRoot = await this.blockchainService.getAssertionMerkleRootByIndex(
            tokenId,
            0,
            blockchain,
        );

        const keyword = ethers.solidityPacked(
            ['address', 'bytes32'],
            [contract, firstassertionMerkleRoot],
        );

        const agreementId = ethers.sha256(
            ethers.solidityPacked(['address', 'uint256', 'bytes'], [contract, tokenId, keyword]),
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
     * @returns {Object} Object containing UAL, publicAssertionMerkleRoot and operation status.
     */
    async update(UAL, content, options = {}) {
        this.validationService.validateJsonldOrNquads(content);

        const {
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
        } = this.inputService.getAssetUpdateArguments(options);

        this.validationService.validateAssetUpdate(
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
        );

        const { tokenId } = resolveUAL(UAL);

        let assertion;

        if (typeof content === 'string') {
            assertion = content
                .split('\n')
                .map((line) => line.trimStart().trimEnd())
                .filter((line) => line.trim() !== '');
        } else {
            assertion = await kcTools.formatAssertion(content);
        }

        const numberOfChunks = kcTools.calculateNumberOfChunks(assertion, CHUNK_BYTE_SIZE);

        const assertionSize = numberOfChunks * CHUNK_BYTE_SIZE;

        this.validationService.validateAssertionSizeInBytes(assertionSize);
        const assertionMerkleRoot = kcTools.calculateMerkleRoot(assertion);

        const contentAssetStorageAddress = await this.blockchainService.getContractAddress(
            'ContentAssetStorage',
            blockchain,
        );

        const updateOperationId = await this.nodeApiService.update(
            endpoint,
            port,
            authToken,
            assertionMerkleRoot,
            assertion,
            blockchain.name,
            contentAssetStorageAddress,
            tokenId,
            hashFunctionId,
        );
        const updateOperationResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.UPDATE,
            maxNumberOfRetries,
            frequency,
            updateOperationId,
        );

        if (updateOperationResult.status !== OPERATION_STATUSES.COMPLETED) {
            return {
                assertionMerkleRoot,
                operation: {
                    publish: getOperationStatusObject(updateOperationResult, updateOperationId),
                },
            };
        }

        let tokenAmountInWei;

        if (tokenAmount != null) {
            tokenAmountInWei = tokenAmount;
        } else {
            tokenAmountInWei = await this._getUpdateBidSuggestion(UAL, blockchain, assertionSize);
        }

        const updateKnowledgeAssetReceipt = await this.blockchainService.updateAsset(
            tokenId,
            assertionMerkleRoot,
            assertionSize,
            kaTools.getAssertionTriplesNumber(assertion),
            kcTools.calculateNumberOfChunks(assertion),
            tokenAmountInWei,
            blockchain,
        );

        return {
            UAL,
            assertionMerkleRoot,
            operation: {
                updateKnowledgeAsset: updateKnowledgeAssetReceipt,
                update: getOperationStatusObject(updateOperationResult, updateOperationId),
            },
        };
    }
}
