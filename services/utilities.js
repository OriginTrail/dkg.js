const jsonld = require('jsonld');
const {
    GRAPH_LOCATIONS,
    GRAPH_STATES,
    OT_NODE_TRIPLE_STORE_REPOSITORIES,
} = require('../constants.js');

function isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

module.exports = {
    nodeSupported() {
        return typeof window === 'undefined';
    },
    isEmptyObject,
    toNumber(hex) {
        return parseInt(hex.slice(2), 16);
    },
    deriveUAL(blockchain, contract, tokenId) {
        return `did:dkg:${blockchain.toLowerCase()}/${contract.toLowerCase()}/${tokenId}`;
    },
    resolveUAL(ual) {
        const segments = ual.split(':');
        const argsString = segments.length === 3 ? segments[2] : `${segments[2]}:${segments[3]}`;
        const args = argsString.split('/');

        if (args.length !== 3) {
            throw new Error(`UAL doesn't have correct format: ${ual}`);
        }

        return {
            blockchain: args[0],
            contract: args[1],
            tokenId: parseInt(args[2], 10),
        };
    },
    deriveRepository(graphLocation, graphState) {
        switch (graphLocation + graphState) {
            case GRAPH_LOCATIONS.PUBLIC_KG + GRAPH_STATES.CURRENT:
                return OT_NODE_TRIPLE_STORE_REPOSITORIES.PUBLIC_CURRENT;
            case GRAPH_LOCATIONS.PUBLIC_KG + GRAPH_STATES.HISTORICAL:
                return OT_NODE_TRIPLE_STORE_REPOSITORIES.PUBLIC_HISTORY;
            case GRAPH_LOCATIONS.LOCAL_KG + GRAPH_STATES.CURRENT:
                return OT_NODE_TRIPLE_STORE_REPOSITORIES.PRIVATE_CURRENT;
            case GRAPH_LOCATIONS.LOCAL_KG + GRAPH_STATES.HISTORICAL:
                return OT_NODE_TRIPLE_STORE_REPOSITORIES.PRIVATE_HISTORY;
            default:
                throw new Error(
                    `Unknown graph location and state: ${graphLocation}, ${graphState}`,
                );
        }
    },
    async sleepForMilliseconds(milliseconds) {
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((r) => setTimeout(r, milliseconds));
    },
    capitalizeFirstLetter(str) {
        return str[0].toUpperCase() + str.slice(1);
    },
    getOperationStatusObject(operationResult, operationId) {
        const operationData = operationResult.data?.errorType
            ? { status: operationResult.status, ...operationResult.data }
            : { status: operationResult.status };

        return {
            operationId,
            ...operationData,
        };
    },
    async toNQuads(content, inputFormat) {
        const options = {
            algorithm: 'URDNA2015',
            format: 'application/n-quads',
        };

        if (inputFormat) {
            options.inputFormat = inputFormat;
        }

        const canonized = await jsonld.canonize(content, options);

        return canonized.split('\n').filter((x) => x !== '');
    },
    async toJSONLD(nquads) {
        return jsonld.fromRDF(nquads, {
            algorithm: 'URDNA2015',
            format: 'application/n-quads',
        });
    },
};
