const { MAX_FILE_SIZE, BLOCKCHAINS, OPERATIONS, GET_OUTPUT_FORMATS } = require('../constants.js');
const utilities = require('./utilities.js');

class ValidationService {
    validatePublishRequest(content, options) {
        this.validateJSON(content);
        this.validateSize(content);
        this.validateBlockchain(options.blockchain);
        this.validateLocalStore(options.localStore);
    }

    validateGetRequest(UAL, options) {
        if (!UAL) throw Error('UAL is missing.');
        this.validateValidate(options?.validate);
        this.validateOutputFormat(options?.outputFormat);
    }

    validateAssetTransferRequest(UAL, newOwner, options) {
        if (!UAL || !newOwner) throw Error('Wrong parameters for the transfer.');
        this.validateBlockchain(options.blockchain);
    }

    validateJSON(content) {
        try {
            JSON.parse(JSON.stringify(content));
        } catch (e) {
            throw Error('Invalid JSON format');
        }
        return true;
    }

    validateSize(content) {
        if (!content) throw Error('No content provided');
        if (Buffer.byteLength(JSON.stringify(content), 'utf-8') > MAX_FILE_SIZE)
            throw Error(`File size limit is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
    }

    validateLocalStore(localStore) {
        if (localStore && typeof localStore !== 'boolean')
            throw Error('LocalStore option must be boolean');
    }

    validateValidate(validate) {
        if (validate && typeof validate !== 'boolean') throw Error('Valid option must be boolean');
    }

    validateOutputFormat(outputFormat) {
        if (
            outputFormat &&
            GET_OUTPUT_FORMATS.JSON_LD !== outputFormat &&
            GET_OUTPUT_FORMATS.N_QUADS !== outputFormat
        )
            throw Error('Unknown output format');
    }

    validateBlockchain(blockchain, operation) {
        if (!blockchain) throw Error('Blockchain configuration missing');
        if (!blockchain.name) throw Error('Blockchain name missing');
        if (utilities.nodeSupported() && !blockchain.rpc && !BLOCKCHAINS[blockchain.name].rpc)
            throw Error('Blockchain rpc missing');
        if (!blockchain.hubContract && !BLOCKCHAINS[blockchain.name].hubContract)
            throw Error('Blockchain hub contract missing');
        if (operation !== OPERATIONS.get) {
            if (!blockchain.publicKey && utilities.nodeSupported())
                throw Error('Blockchain public key missing');
            if (!blockchain.privateKey && utilities.nodeSupported())
                throw Error('Blockchain private key missing');
        }
    }

    validateKeywords(keywords) {
        if (!keywords) throw Error('No keywords provided');
        if (!Array.isArray(keywords)) throw Error('Keywords must be an array');
        if (keywords.length <= 0) throw Error('Keywords array must be non empty');
        if (keywords.length > 10) throw Error('Too many keywords provided, limit is 10.');
        if (!keywords.every((i) => typeof i === 'string' && i !== ''))
            throw Error('all keywords must be non empty strings');
    }

    validateGetOwnerRequest(UAL) {
        if (!UAL) throw Error('UAL is missing.');
    }
}
module.exports = ValidationService;
