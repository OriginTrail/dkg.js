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
    PRIVATE_ASSERTION_PREDICATE,
    PRIVATE_RESOURCE_PREDICATE,
    PRIVATE_HASH_SUBJECT_PREFIX,
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
            dataset = await kcTools.formatDataset(content);
        }

        let publicTriplesGrouped = [];
        let tokensCount = 0;
        // Assign IDs to blank nodes

        dataset.public = kcTools.generateMissingIdsForBlankNodes(dataset.public);

        if (dataset.private?.length) {
            dataset.private = kcTools.generateMissingIdsForBlankNodes(dataset.private);

            // Group private triples by subject and flatten
            const privateTriplesGrouped = kcTools.groupNquadsBySubject(dataset.private, true);
            dataset.private = privateTriplesGrouped.flat();

            // Compute private root and add to public
            const privateRoot = kcTools.calculateMerkleRoot(dataset.private);
            dataset.public.push(
                `<${kaTools.generateNamedNode()}> <${PRIVATE_ASSERTION_PREDICATE}> "${privateRoot}" .`,
            );

            // Group public triples by subject
            publicTriplesGrouped = kcTools.groupNquadsBySubject(dataset.public, true);
            tokensCount += publicTriplesGrouped.length;

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
                const privateSubjectHash = ethers.solidityPackedSha256(
                    ['string'],
                    [privateSubject.slice(1, -1)],
                );

                if (publicSubjectMap.has(privateSubject)) {
                    // If there's a public pair, insert a representation in that group
                    const publicIndex = publicSubjectMap.get(privateSubject);
                    this.insertTripleSorted(
                        publicTriplesGrouped[publicIndex],
                        this.generatePrivateRepresentation(privateSubjectHash),
                    );
                } else {
                    // If no public pair, maintain separate list, inserting sorted by hash
                    this.insertTripleSorted(
                        privateTripleSubjectHashesGroupedWithoutPublicPair,
                        `${`<${PRIVATE_HASH_SUBJECT_PREFIX}${privateSubjectHash}>`} <${PRIVATE_RESOURCE_PREDICATE}> <${kaTools.generateNamedNode()}> .`,
                    );
                }
            }

            // Append any non-paired private subjects at the end
            tokensCount += privateTripleSubjectHashesGroupedWithoutPublicPair.length;
            for (const triple of privateTripleSubjectHashesGroupedWithoutPublicPair) {
                publicTriplesGrouped.push([triple]);
            }

            dataset.public = publicTriplesGrouped.flat();
        } else {
            // No private triples, just group and flatten public
            publicTriplesGrouped = kcTools.groupNquadsBySubject(dataset.public, true);
            tokensCount += publicTriplesGrouped.length;
            dataset.public = publicTriplesGrouped.flat();
        }

        const numberOfChunks = kcTools.calculateNumberOfChunks(dataset.public, CHUNK_BYTE_SIZE);
        const datasetSize = numberOfChunks * CHUNK_BYTE_SIZE;

        this.validationService.validateAssertionSizeInBytes(datasetSize);

        const datasetRoot = kcTools.calculateMerkleRoot(dataset.public);

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
            !publishOperationResult.minAcksReached
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

        signatures.forEach((signature) => {
            identityIds.push(signature.identityId);
            r.push(signature.r);
            vs.push(signature.vs);
        });

        const estimatedPublishingCost =
            tokenAmount ??
            (await this.blockchainService.getStakeWeightedAverageAsk()) * epochsNum * datasetSize;

        let knowledgeCollectionId;
        let mintKnowledgeAssetReceipt;

        if (paranetUAL == null) {
            ({ knowledgeCollectionId, receipt: mintKnowledgeAssetReceipt } =
                await this.blockchainService.createKnowledgeCollection(
                    {
                        publishOperationId,
                        merkleRoot: datasetRoot,
                        knowledgeAssetsAmount: kcTools.countDistinctSubjects(dataset.public),
                        byteSize: datasetSize,
                        triplesAmount: kaTools.getAssertionTriplesNumber(dataset.public),
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
                        merkleRoot: datasetRoot,
                        knowledgeAssetsAmount: kcTools.countDistinctSubjects(dataset.public),
                        byteSize: datasetSize,
                        triplesAmount: kaTools.getAssertionTriplesNumber(dataset.public),
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
    hashSubject(subject) {
        ethers.solidityPackedSha256(['string'], [subject.slice(1, -1)]);
    }
    generatePrivateRepresentation(privateSubject) {
        return `${`<${PRIVATE_HASH_SUBJECT_PREFIX}${hashSubject(
            privateSubject,
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

        const keyword = ethers.solidityPacked(['address', 'bytes32'], [contract, firstDatasetRoot]);

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
     * @returns {Object} Object containing UAL, publicAssertionId and operation status.
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

        let dataset;

        if (typeof content === 'string') {
            dataset = content
                .split('\n')
                .map((line) => line.trimStart().trimEnd())
                .filter((line) => line.trim() !== '');
        } else {
            dataset = await kcTools.formatDataset(content);
        }

        const getOperationId = await this.nodeApiService.get(
            endpoint,
            port,
            authToken,
            UAL,
            '',
            false,
            true,
            null,
            1,
            null,
        );

        // TODO: Add error hadnling if this failes updated failes
        const subjectUALPairsResult = await this.nodeApiService.getOperationResult(
            endpoint,
            port,
            authToken,
            OPERATIONS.GET,
            maxNumberOfRetries,
            frequency,
            getOperationId,
        );

        if (subjectUALPairsResult.status !== OPERATION_STATUSES.COMPLETED) {
            return {
                operation: {
                    getSubjectUALPairs: getOperationStatusObject(
                        subjectUALPairsResult,
                        getOperationId,
                    ),
                },
            };
        }

        // Initialize maps for quick lookups
        const oldSubjectUALMap = new Map();
        const oldSubjectHashUALMap = new Map();

        const { subjectUALPairs, privateMerkleRootTriple } = subjectUALPairsResult;

        // Populate subjectUALMap and subjectHashUALMap from the pairs
        for (const pair of subjectUALPairs) {
            if (pair.subject) {
                oldSubjectUALMap.set(pair.subject, pair.UAL);
            }
            if (pair.privateSubjectHash) {
                oldSubjectHashUALMap.set(pair.privateSubjectHash, pair.UAL);
            }
        }

        let privateTriplesGrouped = [];
        let publicTriplesGrouped = [];

        // Handle private root update/insertion
        if (dataset.private?.length) {
            dataset.private = kcTools.generateMissingIdsForBlankNodes(dataset.private);
            privateTriplesGrouped = kcTools.groupNquadsBySubject(dataset.private, true);
            dataset.private = privateTriplesGrouped.flat();
            const privateRoot = kcTools.calculateMerkleRoot(dataset.private);

            if (privateMerkleRootTriple) {
                // Private root triple existed before, so we update it
                let newPrivateMerkleRootTriple = privateMerkleRootTriple.split(' ');
                newPrivateMerkleRootTriple[2] = `"${privateRoot}"`;
                dataset.public.push(newPrivateMerkleRootTriple.join(' '));
            } else {
                // Private root triple didn't exist, insert it
                dataset.public.push(
                    `<${kaTools.generateNamedNode()}> <${PRIVATE_ASSERTION_PREDICATE}> "${privateRoot}" .`,
                );
            }
        }

        let tokensCount = 0;
        let tokensToBeMinted = 0;
        let tokensToBeBurned = [];

        dataset.private = kcTools.generateMissingIdsForBlankNodes(dataset.private);
        publicTriplesGrouped = kcTools.groupNquadsBySubject(dataset.public, true);
        // We always have public as there is private root triple here already
        if (dataset.private?.length) {
            // Both public and private data exist
            const publicSubjectMap = new Map();

            for (let i = 0; i < publicTriplesGrouped.length; i++) {
                const [publicSubject] = publicTriplesGrouped[i][0].split(' ');
                publicSubjectMap.set(publicSubject, i);
            }

            const privateTriplesGroupedWithoutPublicPair = [];

            // Integrate private subjects into public or create new entries if no public pair
            for (const privateTriples of privateTriplesGrouped) {
                const [privateSubject] = privateTriples[0].split(' ');
                const privateSubjectHash = ethers.solidityPackedSha256(
                    ['string'],
                    [privateSubject.slice(1, -1)],
                );

                if (publicSubjectMap.has(privateSubject)) {
                    // Insert private representation into existing public subject group
                    const publicIndex = publicSubjectMap.get(privateSubject);
                    this.insertTripleSorted(
                        publicTriplesGrouped[publicIndex],
                        `${`<${PRIVATE_HASH_SUBJECT_PREFIX}${privateSubjectHash}>`} <${PRIVATE_RESOURCE_PREDICATE}> <${kaTools.generateNamedNode()}> .`,
                    );
                } else {
                    // No matching public pair - insert as a new hashed subject
                    const index = this.insertTripleSorted(
                        privateTriplesGroupedWithoutPublicPair,
                        `${`<${PRIVATE_HASH_SUBJECT_PREFIX}${privateSubjectHash}>`} <${PRIVATE_RESOURCE_PREDICATE}> <${kaTools.generateNamedNode()}> .`,
                    );
                }
            }

            tokensCount += privateTriplesGroupedWithoutPublicPair.length;
            for (const triple of privateTriplesGroupedWithoutPublicPair) {
                publicTriplesGrouped.push([triple]);
            }

            // Determine tokens to mint or burn
            for (const triples of publicTriplesGrouped) {
                // Each group is an array of triples, check only the first triple for subject
                const [publicSubject] = triples[0].split(' ');

                // Public subject is hash
                if (publicSubject.startsWith(`<${PRIVATE_HASH_SUBJECT_PREFIX}`)) {
                    // Subject is a hashed private subject
                    const publicSubjectParsed = publicSubject.slice(
                        PRIVATE_HASH_SUBJECT_PREFIX.length + 1,
                        -1,
                    );
                    if (!oldSubjectHashUALMap.has(publicSubjectParsed)) {
                        // If didn't exist before it should be minted
                        tokensToBeMinted += 1;
                    } else {
                        // If existed remove from the map so only those that don't exist in new assertion stay
                        oldSubjectHashUALMap.delete(publicSubjectParsed);
                    }
                } else {
                    // Subject is a public resource
                    const publicSubjectParsed = publicSubject.slice(1, -1);
                    if (!oldSubjectUALMap.has(publicSubjectParsed)) {
                        // Didn't exist in previous public, check if it existed in private
                        const publicSubjectHashed = ethers.solidityPackedSha256(
                            ['string'],
                            [publicSubjectParsed],
                        );
                        if (!oldSubjectHashUALMap.has(publicSubjectHashed)) {
                            // It didn't exist in previous private it should be minted
                            tokensToBeMinted += 1;
                        } else {
                            // If existed remove from the map so only those that don't exist in new assertion stay
                            oldSubjectHashUALMap.delete(publicSubjectHashed);
                        }
                    } else {
                        // If existed remove from the map so only those that don't exist in new assertion stay
                        oldSubjectUALMap.delete(publicSubjectParsed);
                    }
                }
            }

            tokensToBeBurned = Array.from(
                new Set([...oldSubjectHashUALMap.values(), ...oldSubjectUALMap.values()]),
            ).map((ual) => ual.split('/').pop());

            dataset.public = publicTriplesGrouped.flat();
        } else {
            // No private triples, just handle public
            tokensCount += publicTriplesGrouped.length;
            dataset.public = publicTriplesGrouped.flat();

            // Determine tokens to mint or burn for public-only scenario no hashes will be present
            for (const triples of publicTriplesGrouped) {
                const [publicSubject] = triples[0].split(' ');
                const publicSubjectParsed = publicSubject.slice(1, -1);
                if (!oldSubjectUALMap.has(publicSubjectParsed)) {
                    // Didn't exist in previous public, check if it existed in private
                    const publicSubjectHashed = ethers.solidityPackedSha256(
                        ['string'],
                        [publicSubjectParsed],
                    );
                    if (!oldSubjectHashUALMap.has(publicSubjectHashed)) {
                        // It didn't exist in previous private it should be minted
                        tokensToBeMinted += 1;
                    } else {
                        // If existed before remove from the map so only those that don't exist in new assertion stay
                        oldSubjectHashUALMap.delete(publicSubjectHashed);
                    }
                } else {
                    oldSubjectUALMap.delete(publicSubjectParsed);
                }
            }

            tokensToBeBurned = Array.from(
                new Set([...oldSubjectHashUALMap.values(), ...oldSubjectUALMap.values()]),
            ).map((ual) => ual.split('/').pop());
        }

        const numberOfChunks = kcTools.calculateNumberOfChunks(dataset, CHUNK_BYTE_SIZE);

        const datasetSize = numberOfChunks * CHUNK_BYTE_SIZE;

        this.validationService.validateAssertionSizeInBytes(datasetSize);
        const datasetRoot = kcTools.calculateMerkleRoot(dataset);

        const contentAssetStorageAddress = await this.blockchainService.getContractAddress(
            'ContentAssetStorage',
            blockchain,
        );

        const updateOperationId = await this.nodeApiService.update(
            endpoint,
            port,
            authToken,
            datasetRoot,
            dataset,
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
                datasetRoot,
                operation: {
                    update: getOperationStatusObject(updateOperationResult, updateOperationId),
                },
            };
        }

        let tokenAmountInWei;

        if (tokenAmount != null) {
            tokenAmountInWei = tokenAmount;
        } else {
            tokenAmountInWei = await this._getUpdateBidSuggestion(UAL, blockchain, datasetSize);
        }

        const updateKnowledgeAssetReceipt = await this.blockchainService.updateAsset(
            tokenId,
            datasetRoot,
            datasetSize,
            kaTools.getAssertionTriplesNumber(dataset),
            kcTools.calculateNumberOfChunks(dataset),
            tokenAmountInWei,
            blockchain,
        );

        return {
            UAL,
            datasetRoot,
            operation: {
                updateKnowledgeAsset: updateKnowledgeAssetReceipt,
                update: getOperationStatusObject(updateOperationResult, updateOperationId),
            },
        };
    }
}
