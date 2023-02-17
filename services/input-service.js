const { DEFAULT_PARAMETERS, BLOCKCHAINS } = require('../constants');

class InputService {
    constructor(config = {}) {
        this.config = config;
    }

    getBlockchain(options) {
        const name = options.blockchain?.name ?? this.config.blockchain?.name ?? null;
        const rpc = options.blockchain?.rpc ?? this.config.blockchain?.rpc ?? BLOCKCHAINS[name]?.rpc;
        const hubContract =
            options.blockchain?.hubContract ??
            this.config.blockchain?.hubContract ??
            BLOCKCHAINS[name]?.hubContract;
        const publicKey =
            options.blockchain?.publicKey ?? this.config.blockchain?.publicKey ?? null;
        const privateKey =
            options.blockchain?.privateKey ?? this.config.blockchain?.privateKey ?? null;

        return {
            name,
            rpc,
            hubContract,
            publicKey,
            privateKey,
        };
    }

    getAssetCreateArguments(options) {
        return {
            blockchain: this.inputService.getBlockchain(options),
            endpoint: this.inputService.getEndpoint(options),
            port: this.inputService.getPort(options),
            maxNumberOfRetries: this.inputService.getMaxNumberOfRetries(options),
            frequency: this.inputService.getFrequency(options),
            epochsNum: this.inputService.getEpochsNum(options),
            hashFunctionId: this.inputService.getHashFunctionId(options),
            scoreFunctionId: this.inputService.getScoreFunctionId(options),
            immutable: this.inputService.getImmutable(options),
            tokenAmount: this.inputService.getTokenAmount(options),
            authToken: this.inputService.getAuthToken(options),
        };
    }

    getAssetGetArguments(options) {
        return {
            blockchain: this.inputService.getBlockchain(options),
            endpoint: this.inputService.getEndpoint(options),
            port: this.inputService.getPort(options),
            maxNumberOfRetries: this.inputService.getMaxNumberOfRetries(options),
            frequency: this.inputService.getFrequency(options),
            state: this.inputService.getState(options),
            contentVisibility: this.inputService.getContentVisibility(options),
            validate: this.inputService.getValidate(options),
            outputFormat: this.inputService.getOutputFormat(options),
            authToken: this.inputService.getAuthToken(options),
            hashFunctionId: this.inputService.getHashFunctionId(options),
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
        return options.state ?? this.config.state ?? null;
    }

    getContentVisibility(options) {
        return options.contentVisibility ?? this.config.contentVisibility ?? null;
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
