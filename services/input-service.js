import {
    DEFAULT_NEUROWEB_FINALITY_PARAMETERS,
    DEFAULT_PARAMETERS,
    DEFAULT_PROXIMITY_SCORE_FUNCTIONS_PAIR_IDS,
    BLOCKCHAINS,
    PARANET_NODES_ACCESS_POLICY,
    PARANET_MINERS_ACCESS_POLICY,
    PARANET_KC_SUBMISSION_POLICY,
    ZERO_ADDRESS,
} from '../constants/constants.js';

export default class InputService {
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
