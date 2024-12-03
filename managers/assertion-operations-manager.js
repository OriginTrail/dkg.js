const { assertionMetadata, calculateRoot, formatGraph } = require('assertion-tools');

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
     async formatGraph(content) {
        return formatGraph(content);
    }

    /**
     * Calculates and returns the Merkle root of the public assertion from the provided content.
     * 
     * @param {Object} content - The content object containing optional public and private properties.
     * @returns {Promise<String>} a promise that resolves with a string representing the 
     * Merkle root of the formatted public assertion.
     */
    async getPublicAssertionId(content) {
        const assertions = await formatGraph(content);
        return await calculateRoot(assertions.public);
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

    /**
     * Calculates and returns the number of triples of the public assertion from the provided content.
     * 
     * @param {Object} content - The content object containing optional public and private properties.
     * @returns {Promise<Number>} a promise that resolves with a number representing the 
     * number of triples of the formatted public assertion.
     */
    async getTriplesNumber(content) {
        const assertions = await formatGraph(content);
        return assertionMetadata.getAssertionTriplesNumber(assertions.public);
    }

    /**
     * Calculates and returns the number of chunks of the public assertion from the provided content.
     * 
     * @param {Object} content - The content object containing optional public and private properties.
     * @returns {Promise<Number>} a promise that resolves with a number representing the 
     * number of chunks of the formatted public assertion.
     */
    async getChunksNumber(content) {
        const assertions = await formatGraph(content);
        return assertionMetadata.getAssertionChunksNumber(assertions.public);
    }
}
module.exports = AssertionOperationsManager;
