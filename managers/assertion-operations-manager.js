const {
    assertionMetadata,
    calculateRoot,
    formatGraph,
    formatAssertion,
} = require('assertion-tools');

class AssertionOperationsManager {
    constructor(services) {
        this.nodeApiService = services.nodeApiService;
        this.inputService = services.inputService;
        this.validationService = services.validationService;
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
    async createAssertions(content) {
        return createAssertions(content);
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

    /**
     * Adds labels to the public assertion based on provided conditions.
     *
     * @param {Object} content - The content object in JSONLD or NQUADS format.
     * @param {Array} conditions - An array of condition-label pairs. Each condition is a function that
     * tests if the triple should be labeled.
     * @returns {Promise<Object>} - Return the N-Quads formatted string
     */
    async addLabels(content, conditions) {
        this.validationService.validateJsonldOrNquads(content);
        this.validationService.validateConditions(conditions);

        const assertions = await formatAssertion(content);

        const resultAssertions = [];

        assertions.forEach((tripleStr) => {
            const match = tripleStr.match(/<([^>]+)> <([^>]+)> ([^\.]+) \./);
            if (!match) {
                throw new Error(`Invalid N-Quad format: ${tripleStr}`);
            }

            const subject = match[1];
            const predicate = match[2];
            let object = match[3].trim();

            if (object.startsWith('"') && object.endsWith('"')) {
                object = `"${object.slice(1, -1)}"`;
            } else {
                object = `${object}`;
            }

            resultAssertions.push(`<${subject}> <${predicate}> ${object} .`);

            conditions.forEach((condition) => {
                if (condition.condition === true) {
                    const labelTriple = `<<<${subject}> <${predicate}> ${object}>> <http://example.org/label> <${condition.label}> .`;
                    resultAssertions.push(labelTriple);
                } else {
                    if (condition.condition({ subject, predicate, object })) {
                        const labelTriple = `<<<${subject}> <${predicate}> ${object}>> <http://example.org/label> <${condition.label}> .`;
                        resultAssertions.push(labelTriple);
                    }
                }
            });
        });
        return resultAssertions;
    }
}
module.exports = AssertionOperationsManager;
