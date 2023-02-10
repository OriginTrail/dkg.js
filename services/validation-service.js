const { MAX_FILE_SIZE, BLOCKCHAINS, OPERATIONS, GET_OUTPUT_FORMATS } = require('../constants.js');
const { nodeSupported } = require('./utilities.js');

class ValidationService {
    validatePublishRequest(content, options) {
        const keys = Object.keys(content);

        if (
            !(keys.length === 1 && (keys.includes('public') || keys.includes('private'))) &&
            !(keys.length === 2 && (keys.includes('public') || keys.includes('private')))
        )
            throw Error('content keys can only be "public", "private" or both.');

        if(!content.public && !content.private) {
            throw Error('Public or private content must be defined');
        }

        if (content.public) {
            this.validateSize(content.public);
        }
        if (content.private) {
            this.validateSize(content.private);
        }
        this.validateBlockchain(options.blockchain);
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

    validateContentType(obj) {
        if (!(!!obj && typeof obj === 'object')) throw Error('Content must be an object'); 
    }

    validateSize(content) {
        if (!content) throw Error('No content provided');
        if (Buffer.byteLength(JSON.stringify(content), 'utf-8') > MAX_FILE_SIZE)
            throw Error(`File size limit is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
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
        if (nodeSupported() && !blockchain.rpc && !BLOCKCHAINS[blockchain.name].rpc)
            throw Error('Blockchain rpc missing');
        if (!blockchain.hubContract && !BLOCKCHAINS[blockchain.name].hubContract)
            throw Error('Blockchain hub contract missing');
        if (operation !== OPERATIONS.GET) {
            if (!blockchain.publicKey && nodeSupported())
                throw Error('Blockchain public key missing');
            if (!blockchain.privateKey && nodeSupported())
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
