import jsonld from 'jsonld';
import { GRAPH_LOCATIONS, GRAPH_STATES, OT_NODE_TRIPLE_STORE_REPOSITORIES } from '../constants/constants.js';
import { ethers } from 'ethers';

export function isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function nodeSupported() {
    return typeof window === 'undefined';
}

export function toNumber(hex) {
    return parseInt(hex.slice(2), 16);
}

export function deriveUAL(blockchain, contract, kcTokenId, kaTokenId) {
    const ual = `did:dkg:${blockchain.toLowerCase()}/${contract.toLowerCase()}/${kcTokenId}`;
    return kaTokenId ? `${ual}/${kaTokenId}` : ual;
}

export function resolveUAL(ual) {
    if (!ual.startsWith('did:dkg:')) {
        throw new Error(`Invalid UAL: ${ual}. UAL should start with did:dkg:`);
    }

    const args = ual.replace('did:dkg:', '').split('/');

    if (args.length === 4) {
        return {
            blockchain: args[0],
            contract: args[1],
            kcTokenId: parseInt(args[2], 10),
            kaTokenId: parseInt(args[3], 10),
        };
    }

    if (args.length === 3) {
        return {
            blockchain: args[0],
            contract: args[1],
            kcTokenId: parseInt(args[2], 10),
        };
    }

    throw new Error(`Invalid UAL: ${ual}. UAL should have 3 or 4 segments.`);
}

export function deriveRepository(graphLocation, graphState) {
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
            return graphLocation;
    }
}

export async function sleepForMilliseconds(milliseconds) {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((r) => setTimeout(r, milliseconds));
}

export function capitalizeFirstLetter(str) {
    return str[0].toUpperCase() + str.slice(1);
}

export function getOperationStatusObject(operationResult, operationId) {
    const operationData = operationResult.data?.errorType
        ? { status: operationResult.status, ...operationResult.data }
        : { status: operationResult.status };

    return {
        operationId,
        ...operationData,
    };
}

export async function toNQuads(content, inputFormat) {
    const options = {
        algorithm: 'URDNA2015',
        format: 'application/n-quads',
    };

    if (inputFormat) {
        options.inputFormat = inputFormat;
    }

    const canonized = await jsonld.canonize(content, options);

    return canonized.split('\n').filter((x) => x !== '');
}

export async function toJSONLD(nquads) {
    return jsonld.fromRDF(nquads, {
        algorithm: 'URDNA2015',
        format: 'application/n-quads',
    });
}

export function getParanetId(paranetUAL) {
    const { contract, kcTokenId, kaTokenId } = resolveUAL(paranetUAL);
    if (!kaTokenId) {
        throw new Error('Invalid paranet UAL! Knowledge asset token id is required!');
    }
    return ethers.keccak256(
        ethers.solidityPacked(['address', 'uint256', 'uint256'], [contract, kcTokenId, kaTokenId]),
    );
}

export function getKnowledgeCollectionId(kcUAL) {
    const { contract, kcTokenId } = resolveUAL(kcUAL);
    return ethers.keccak256(ethers.solidityPacked(['address', 'uint256'], [contract, kcTokenId]));
}
