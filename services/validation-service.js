const { MAX_FILE_SIZE, OPERATIONS, GET_OUTPUT_FORMATS } = require('../constants.js');
const { nodeSupported } = require('./utilities.js');

class ValidationService {
    validateRequiredParam(paramName, param) {
        if (param == null) throw Error(`${paramName} is missing.`);
    }

    validateParamType(paramName, param, type) {
        let parameter = param;
        if (type === 'number') {
            parameter = parseInt(param, 10);
        }
        // eslint-disable-next-line valid-typeof
        if (typeof parameter !== type) throw Error(`${paramName} must be of type ${type}.`);
    }

    validateUAL(ual) {
        this.validateRequiredParam('UAL', ual);
        this.validateParamType('UAL', ual, 'string');

        const segments = ual.split(':');
        const argsString = segments.length === 3 ? segments[2] : segments[2] + segments[3];
        const args = argsString.split('/');

        if (!(args?.length === 3)) throw Error('Invalid UAL.');
    }

    validateContentType(obj) {
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

        if (Buffer.byteLength(JSON.stringify(content), 'utf-8') > MAX_FILE_SIZE)
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

    validateAuthToken(authToken) {
        if (authToken == null) return;

        this.validateParamType('authToken', authToken, 'string');
    }

    validateValidate(validate) {
        this.validateRequiredParam('validate', validate);
        this.validateParamType('validate', validate, 'boolean');
    }

    validateOutputFormat(outputFormat) {
        this.validateRequiredParam('outputFormat', outputFormat);
        if (!Object.values(GET_OUTPUT_FORMATS).includes(outputFormat))
            throw Error('Unknown output format');
    }

    validateBlockchain(blockchain, operation) {
        this.validateRequiredParam('blockchain', blockchain);
        this.validateRequiredParam('blockchain name', blockchain.name);
        this.validateRequiredParam('blockchain hub contract', blockchain.hubContract);
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
}
module.exports = ValidationService;
