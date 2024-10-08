const { IdentityABI } = require('dkg-evm-module');
const {
    DEFAULT_NEUROWEB_FINALITY_PARAMETERS,
    DEFAULT_PARAMETERS,
    DEFAULT_PROXIMITY_SCORE_FUNCTIONS_PAIR_IDS,
    BLOCKCHAINS,
    LOW_BID_SUGGESTION,
} = require('../constants');

class InputService {
    constructor(config = {}) {
        this.config = config;
    }

    getBidSuggestionArguments(options) {
        return {
            blockchain: this.getBlockchain(options),
            endpoint: this.getEndpoint(options),
            port: this.getPort(options),
            epochsNum: this.getEpochsNum(options),
            hashFunctionId: this.getHashFunctionId(options),
            authToken: this.getAuthToken(options),
            bidSuggestionRange: this.getBidSuggestionRange(options),
        };
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
            paranetUAL: this.getParanetUAL(options),
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
            contentType: this.getContentType(options),
            validate: this.getValidate(options),
            outputFormat: this.getOutputFormat(options),
            authToken: this.getAuthToken(options),
            hashFunctionId: this.getHashFunctionId(options),
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
        };
    }

    getParanetCreateArguments(options) {
        return {
            blockchain: this.getBlockchain(options),
            paranetName: this.getParanetName(options),
            paranetDescription: this.getParanetDescription(options),
            paranetNodesAccessPolicy: this.getParanetNodesAccessPolicy(options),
            paranetMinersAccessPolicy: this.getParanetMinersAccessPolicy(options),
        }
    }

    getParanetAddCuratedNodes(options) {
        return {
            blockchain: this.getBlockchain(options),
            identityIds: this.getIdentityIds(options),
        }
    }

    getParanetRemoveCuratedNodes(options) {
        return {
            blockchain: this.getBlockchain(options),
            identityIds: this.getIdentityIds(options),
        }
    }

    getRequestParanetCuratedNodeAccess(options) {
        return {
            blockchain: this.getBlockchain(options),
        }
    }

    getApproveCuratedNode(options) {
        return {
            blockchain: this.getBlockchain(options),
            identityId: this.getIdentityId(options),
        }
    }

    getRejectCuratedNode(options) {
        return {
            blockchain: this.getBlockchain(options),
            identityId: this.getIdentityId(options),
        }
    }

    getParanetAddCuratedMiners(options) {
        return {
            blockchain: this.getBlockchain(options),
            minerAddresses: this.getMinerAddresses(options),
        }
    }

    getParanetRemoveCuratedMiners(options) {
        return {
            blockchain: this.getBlockchain(options),
            minerAddresses: this.getMinerAddresses(options),
        }
    }

    getRequestParanetCuratedMinerAccess(options) {
        return {
            blockchain: this.getBlockchain(options),
        }
    }

    getApproveCuratedMiner(options) {
        return {
            blockchain: this.getBlockchain(options),
            minerAddress: this.getMinerAddress(options),
        }
    }

    getParanetDeployIncentivesContractArguments(options) {
        return {
            blockchain: this.getBlockchain(options),
            incentiveType: this.getIncentiveType(options),
            tracToNeuroEmissionMultiplier: this.getTracToNeuroEmissionMultiplier(options),
            operatorRewardPercentage: this.getOperatorRewardPercentage(options),
            incentivizationProposalVotersRewardPercentage: this.getIncentivizationProposalVotersRewardPercentage(options),
        }
    }

    getParanetCreateServiceArguments(options) {
        return {
            blockchain: this.getBlockchain(options),
            paranetServiceName: this.getParanetServiceName(options),
            paranetServiceDescription: this.getParanetServiceDescription(options),
            paranetServiceAddresses: this.getParanetServiceAddresses(options),
        }
    }

    getParanetRoleCheckArguments(options){
        return {
            blockchain: this.getBlockchain(options),
            roleAddress: this.getRoleAddress(options),
        }
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
            blockchainConfig.waitNeurowebTxFinalization = options.blockchain?.waitNeurowebTxFinalization ??
                this.config.blockchain?.waitNeurowebTxFinalization ??
                DEFAULT_NEUROWEB_FINALITY_PARAMETERS.WAIT_NEUROWEB_TX_FINALIZATION;
            blockchainConfig.transactionFinalityPollingInterval = options.blockchain?.transactionFinalityPollingInterval ??
                this.config.blockchain?.transactionFinalityPollingInterval ??
                DEFAULT_NEUROWEB_FINALITY_PARAMETERS.TX_FINALITY_POLLING_INTERVAL;
            blockchainConfig.transactionFinalityMaxWaitTime = options.blockchain?.transactionFinalityMaxWaitTime ??
                this.config.blockchain?.transactionFinalityMaxWaitTime ??
                DEFAULT_NEUROWEB_FINALITY_PARAMETERS.TX_FINALITY_MAX_WAIT_TIME;
            blockchainConfig.transactionReminingPollingInterval = options.blockchain?.transactionReminingPollingInterval ??
                this.config.blockchain?.transactionReminingPollingInterval ??
                DEFAULT_NEUROWEB_FINALITY_PARAMETERS.TX_REMINING_POLLING_INTERVAL;
            blockchainConfig.transactionReminingMaxWaitTime = options.blockchain?.transactionReminingMaxWaitTime ??
                this.config.blockchain?.transactionReminingMaxWaitTime ??
                DEFAULT_NEUROWEB_FINALITY_PARAMETERS.TX_REMINING_MAX_WAIT_TIME;
        }

        return blockchainConfig
    }

    getGraphLocation(options) {
        return (
            options.graphLocation ?? options.paranetUAL ?? this.config.graphLocation ?? DEFAULT_PARAMETERS.GRAPH_LOCATION
        );
    }

    getGraphState(options) {
        return options.graphState ?? this.config.graphState ?? DEFAULT_PARAMETERS.GRAPH_STATE;
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

    getBidSuggestionRange(options) {
        return options.bidSuggestionRange ?? LOW_BID_SUGGESTION;
    }

    getParanetUAL(options) {
        return options.paranetUAL ?? this.config.paranetUAL ?? null;
    }

    getParanetName(options) {
        return options.paranetName ?? null;
    }

    getParanetDescription(options) {
        return options.paranetDescription ?? null;
    }

    getParanetNodesAccessPolicy(options) {
        return options.paranetNodesAccessPolicy ?? null;
    }

    getParanetMinersAccessPolicy(options) {
        return options.paranetMinersAccessPolicy ?? null;
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

    getIdentityIds(options) {
        return options.identityIds ?? null;
    }

    getIdentityId(options) {
        return options.identityId ?? null;
    }

    getMinerAddresses(options) {
        return options.minerAddresses ?? null;
    }

    getMinerAddress(options) {
        return options.minerAddress ?? null;
    }

}

module.exports = InputService;
