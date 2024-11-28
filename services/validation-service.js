const { isAddress } = require('ethers');
const {
    ASSET_STATES,
    CONTENT_TYPES,
    GRAPH_LOCATIONS,
    GRAPH_STATES,
    MAX_FILE_SIZE,
    OPERATIONS,
    GET_OUTPUT_FORMATS,
    QUERY_TYPES,
    BID_SUGGESTION_RANGE_ENUM,
    PARANET_NODES_ACCESS_POLICY,
    PARANET_MINERS_ACCESS_POLICY,
} = require('../constants.js');
const { nodeSupported } = require('./utilities.js');

class ValidationService {
    validateNodeInfo(endpoint, port, authToken) {
        this.validateEndpoint(endpoint);
        this.validatePort(port);
        this.validateAuthToken(authToken);
    }

    validateGraphQuery(
        queryString,
        queryType,
        graphLocation,
        graphState,
        endpoint,
        port,
        maxNumberOfRetries,
        frequency,
        authToken,
    ) {
        this.validateQueryString(queryString);
        this.validateQueryType(queryType);
        this.validateGraphLocation(graphLocation);
        this.validateGraphState(graphState);
        this.validateEndpoint(endpoint);
        this.validatePort(port);
        this.validateMaxNumberOfRetries(maxNumberOfRetries);
        this.validateFrequency(frequency);
        this.validateAuthToken(authToken);
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
        paranetUAL,
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
        this.validateParanetUAL(paranetUAL);
    }

    validateAssetGet(
        UAL,
        blockchain,
        endpoint,
        port,
        maxNumberOfRetries,
        frequency,
        state,
        contentType,
        hashFunctionId,
        validate,
        outputFormat,
        authToken,
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain, OPERATIONS.GET);
        this.validateEndpoint(endpoint);
        this.validatePort(port);
        this.validateMaxNumberOfRetries(maxNumberOfRetries);
        this.validateFrequency(frequency);
        this.validateState(state);
        this.validateContentType(contentType);
        this.validateHashFunctionId(hashFunctionId);
        this.validateValidate(validate);
        this.validateOutputFormat(outputFormat);
        this.validateAuthToken(authToken);
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
        paranetMinersAccessPolicy
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
        this.validateParanetName(paranetName);
        this.validateParanetDescription(paranetDescription);
        this.validateParanetNodesAccessPolicy(paranetNodesAccessPolicy);
        this.validateParanetMinersAccessPolicy(paranetMinersAccessPolicy);
    }

    validateParanetAddCuratedNodes(
        UAL,
        blockchain,
        identityIds
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);

        for (const identityId of identityIds) {
            this.validateIdentityId(identityId);
        }
    }

    validateParanetRemoveCuratedNodes(
        UAL,
        blockchain,
        identityIds
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);

        for (const identityId of identityIds) {
            this.validateIdentityId(identityId);
        }
    }

    validateRequestParanetCuratedNodeAccess(
        UAL,
        blockchain,
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateApproveCuratedNode(
        UAL,
        blockchain,
        identityId
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
        this.validateIdentityId(identityId);
    }

    validateRejectCuratedNode(
        UAL,
        blockchain,
        identityId
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
        this.validateIdentityId(identityId);
    }

    validateGetCuratedNodes(
        UAL,
        blockchain,
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateGetParanetKnowledgeMiners(
        UAL,
        blockchain,
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateParanetAddCuratedMiners(
        UAL,
        blockchain,
        minerAddresses
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);

        for (const minerAddress of minerAddresses) {
            this.validateAddress(minerAddress);
        }
    }

    validateParanetRemoveCuratedMiners(
        UAL,
        blockchain,
        minerAddresses
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);

        for (const minerAddress of minerAddresses) {
            this.validateAddress(minerAddress);
        }
    }

    validateRequestParanetCuratedMinerAccess(
        UAL,
        blockchain,
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
    }

    validateApproveCuratedMiner(
        UAL,
        blockchain,
        minerAddress
    ) {
        this.validateUAL(UAL);
        this.validateBlockchain(blockchain);
        this.validateAddress(minerAddress);
    }

    validateRejectCuratedMiner(
        UAL,
        blockchain,
        minerAddress
    ) {
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
            throw Error(
                `Invalid graph location: available locations are: ${validGraphLocations}`,
            );
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
        if (!(args?.length === 3)) throw Error('Invalid UAL.');
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

    validateContent(content) {
        this.validateRequiredParam('content', content);

        const keys = Object.keys(content);

        if (
            !(keys.length === 1 && (keys.includes('public') || keys.includes('private'))) &&
            !(keys.length === 2 && (keys.includes('public') || keys.includes('private')))
        )
            throw Error('content keys can only be "public", "private" or both.');

        if (!content.public && !content.private) {
            throw Error('Public or private content must be defined');
        }
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
        this.validateRequiredParam('state', state);
        this.validateParamType('state', state, ['number', 'string']);
        const validStatesEnum = Object.values(ASSET_STATES);
        if (
            typeof state === 'string' &&
            !validStatesEnum.includes(state.toUpperCase()) &&
            typeof state !== 'number' &&
            !/^0x[a-fA-F0-9]{64}$/.test(state)
        )
            throw Error(`Invalid state, available states: ${validStatesEnum},numerical or hash.`);
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

    validateValidate(validate) {
        this.validateRequiredParam('validate', validate);
        this.validateParamType('validate', validate, 'boolean');
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

    validateGetBidSuggestion(bidSuggestionRange) {
        this.validateBidSuggestionRange(bidSuggestionRange);
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
        if (!Object.values(PARANET_NODES_ACCESS_POLICY).includes(paranetNodesAccessPolicy)) throw Error(`Invalid nodes access policy: ${paranetNodesAccessPolicy}. Should be 0 for OPEN or 1 for CURATED`);
    }

    validateParanetMinersAccessPolicy(paranetMinersAccessPolicy) {
        this.validateRequiredParam('paranetMinersAccessPolicy', paranetMinersAccessPolicy);
        this.validateParamType('paranetMinersAccessPolicy', paranetMinersAccessPolicy, 'number');
        if (!Object.values(PARANET_MINERS_ACCESS_POLICY).includes(paranetMinersAccessPolicy)) throw Error(`Invalid miners access policy: ${paranetMinersAccessPolicy}. Should be 0 for OPEN or 1 for CURATED`);
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

        if (!isAddress(address)) throw Error(`Wrong address format. Given address: ${address}`);
    }

    validateIdentityId(identityId) {
        this.validateRequiredParam('identityId', identityId);
        this.validateParamType('identityId', identityId, 'number');
    }
}
module.exports = ValidationService;
