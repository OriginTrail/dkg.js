import { isAddress } from 'ethers';
import {
    CONTENT_TYPES,
    GRAPH_LOCATIONS,
    GRAPH_STATES,
    MAX_FILE_SIZE,
    OPERATIONS,
    GET_OUTPUT_FORMATS,
    QUERY_TYPES,
    PARANET_NODES_ACCESS_POLICY,
    PARANET_MINERS_ACCESS_POLICY,
    PARANET_KC_SUBMISSION_POLICY,
} from '../constants/constants.js';
import { nodeSupported } from './utilities.js';

export default class ValidationService {
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

        if (!isAddress(address)) throw Error(`Wrong address format. Given address: ${address}`);
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
