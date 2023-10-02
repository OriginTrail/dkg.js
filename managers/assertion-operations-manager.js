const { assertionMetadata, calculateRoot, formatAssertion } = require('assertion-tools');
const { PRIVATE_ASSERTION_PREDICATE } = require('../constants.js');

class AssertionOperationsManager {
    constructor(services) {
        this.nodeApiService = services.nodeApiService;
        this.inputService = services.inputService;
    }

    /**
     * Formats the content provided, producing both a public and, if available, a private assertion.
     * 
     * @param {Object} content - The content object containing optional public and private properties.
     * @returns {Promise<Object>} a promise that resolves with an object containing the 
     * formatted public assertion and, if available, the private assertion.
     */
    async formatContent(content) {
        let privateAssertion;
        if (content.private && !this._isEmptyObject(content.private)) {
            privateAssertion = await formatAssertion(content.private);
        }
        const publicGraph = {
            '@graph': [
                content.public && !this._isEmptyObject(content.public)
                    ? content.public
                    : null,
                content.private && !this._isEmptyObject(content.private)
                    ? {
                        [PRIVATE_ASSERTION_PREDICATE]: privateAssertion 
                        ? calculateRoot(privateAssertion) : null,
                    }
                    : null,
            ],
        };
        const publicAssertion = await formatAssertion(publicGraph);

        const result = {
            public: publicAssertion,
        };
        
        if (privateAssertion) {
            result.private = privateAssertion;
        }
        
        return result;
    }

    /**
     * Calculates and returns the Merkle root of the public assertion from the provided content.
     * 
     * @param {Object} content - The content object containing optional public and private properties.
     * @returns {Promise<String>} a promise that resolves with a string representing the 
     * Merkle root of the formatted public assertion.
     */
    async getMerkleRoot(content) {
        const assertions = await this.formatContent(content);
        return calculateRoot(assertions.public);
    }

    /**
     * Calculates and returns the size in bytes of the public assertion from the provided content.
     * 
     * @param {Object} content - The content object containing optional public and private properties.
     * @returns {Promise<Number>} a promise that resolves with a number representing the 
     * size in bytes of the formatted public assertion.
     */
    async getSizeInBytes(content) {
        const assertions = await this.formatContent(content);
        return assertionMetadata.getAssertionSizeInBytes(assertions.public);
    }

    /**
     * Utility method to check whether an object is empty.
     * 
     * @private
     * @param {Object} obj - The object to be checked.
     * @returns {boolean} true if the object is empty, otherwise returns false.
     */
    _isEmptyObject(obj) {
        return Object.keys(obj).length === 0 && obj.constructor === Object;
    }
}
module.exports = AssertionOperationsManager;
