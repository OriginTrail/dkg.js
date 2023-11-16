const { DEFAULT_PARAMETERS, BLOCKCHAINS } = require('../constants');

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

    getBlockchain(options) {
        const blockchainName = options.blockchain?.name;

        if (blockchainName) {
            switch (blockchainName) {
                case 'hardhat':
                    config.blockchain.name = 'hardhat:31337';
                    break;
                case 'otp::devnet':
                    config.blockchain.name = 'otp:2160';
                    break;
                case 'otp::testnet':
                    config.blockchain.name = 'otp:20430';
                    break;
                case 'otp::mainnet':
                    config.blockchain.name = 'otp:2043';
                    break;
                default:
                    break;
            }
        }

        const name = options.blockchain?.name ?? this.config.blockchain?.name ?? null;
        const rpc =
            options.blockchain?.rpc ?? this.config.blockchain?.rpc ?? BLOCKCHAINS[name]?.rpc;
        const hubContract =
            options.blockchain?.hubContract ??
            this.config.blockchain?.hubContract ??
            BLOCKCHAINS[name]?.hubContract;
        const publicKey =
            options.blockchain?.publicKey ?? this.config.blockchain?.publicKey ?? null;
        const privateKey =
            options.blockchain?.privateKey ?? this.config.blockchain?.privateKey ?? null;
        const handleNotMinedError =
            options.blockchain?.handleNotMinedError ??
            this.config.blockchain?.handleNotMinedError ??
            DEFAULT_PARAMETERS.HANDLE_NOT_MINED_ERROR;
        const gasPrice =
            options.blockchain?.gasPrice ?? this.config.blockchain?.gasPrice ?? undefined;
        const transactionPollingTimeout =
            options.blockchain?.transactionPollingTimeout ??
            this.config.blockchain?.transactionPollingTimeout ??
            null;

        return {
            name,
            rpc,
            hubContract,
            publicKey,
            privateKey,
            gasPrice,
            transactionPollingTimeout,
            handleNotMinedError,
        };
    }

    getGraphLocation(options) {
        return (
            options.graphLocation ?? this.config.graphLocation ?? DEFAULT_PARAMETERS.GRAPH_LOCATION
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
        return (
            options.scoreFunctionId ??
            this.config.scoreFunctionId ??
            DEFAULT_PARAMETERS.SCORE_FUNCTION_ID
        );
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
}

module.exports = InputService;
