import { safeStub } from './stub-utils.js';
import { loadFixture } from '../fixture-loader.js';
import { TEST_CHAIN_NAME } from '../test-constants.js';

function defaultPublishResult() {
    return loadFixture('responses/publish-response.json');
}

function defaultQueryResult() {
    return loadFixture('responses/query-response.json');
}

export function createNodeApiStubs(nodeApiService, overrides = {}) {
    const defaults = {
        info: {
            data: {
                version: '8.0.0',
                blockchain: [TEST_CHAIN_NAME],
                autoUpdate: false,
            },
        },
        publish: 'mock-publish-op-id',
        get: 'mock-get-op-id',
        getOperationResult: defaultPublishResult(),
        query: defaultQueryResult(),
        finality: 'mock-finality-op-id',
        finalityStatus: 3,
        localStore: 'mock-local-store-op-id',
    };

    const merged = { ...defaults, ...overrides };
    const stubs = {};

    for (const [method, value] of Object.entries(merged)) {
        stubs[method] = safeStub(nodeApiService, method, value);
    }

    return stubs;
}

export function createGetOperationResultForAssetGet(assertion, metadata) {
    return {
        status: 'COMPLETED',
        data: {
            assertion: {
                public: assertion || [
                    '<http://example.org/subject1> <http://schema.org/name> "Test Asset" .',
                ],
                private: [],
            },
            metadata: metadata || [
                '<http://example.org/meta> <http://schema.org/dateCreated> "2025-01-01" .',
            ],
        },
    };
}

export function createFailedOperationResult(errorMessage) {
    return {
        status: 'FAILED',
        data: {
            errorType: 'DKG_CLIENT_ERROR',
            errorMessage: errorMessage || 'Operation failed.',
        },
    };
}

export function createPublishOperationResult(overrides = {}) {
    const base = defaultPublishResult();
    return { ...base, data: { ...base.data, ...overrides } };
}
