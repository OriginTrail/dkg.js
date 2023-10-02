const { assertionMetadata, calculateRoot } = require('assertion-tools');
const { formatGraph } = require('../services/utilities.js');

class AssertionOperationsManager {
    constructor(services) {
        this.nodeApiService = services.nodeApiService;
        this.inputService = services.inputService;
    }

    /**
     * Calculates and returns the Merkle root of the public assertion from the provided content.
     * 
     * @param {Object} content - The content object containing optional public and private properties.
     * @returns {Promise<String>} a promise that resolves with a string representing the 
     * Merkle root of the formatted public assertion.
     */
    async getMerkleRoot(content) {
        const assertions = await formatGraph(content);
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
        const assertions = await formatGraph(content);
        return assertionMetadata.getAssertionSizeInBytes(assertions.public);
    }
}
module.exports = AssertionOperationsManager;
