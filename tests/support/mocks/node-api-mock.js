import sinon from 'sinon';
import { safeStub } from './stub-utils.js';

export function createNodeApiStubs(nodeApiService) {
    return {
        info: sinon.stub(nodeApiService, 'info').resolves({
            data: {
                version: '8.0.0',
                blockchain: ['hardhat1:31337'],
                autoUpdate: false,
            },
        }),
        publish: sinon.stub(nodeApiService, 'publish').resolves('mock-publish-op-id'),
        get: sinon.stub(nodeApiService, 'get').resolves('mock-get-op-id'),
        getOperationResult: sinon.stub(nodeApiService, 'getOperationResult').resolves({
            status: 'COMPLETED',
            data: {
                signatures: [
                    {
                        identityId: 1,
                        r: '0x' + 'ab'.repeat(32),
                        vs: '0x' + 'cd'.repeat(32),
                    },
                ],
                publisherNodeSignature: {
                    identityId: 1,
                    r: '0x' + 'ab'.repeat(32),
                    vs: '0x' + 'cd'.repeat(32),
                },
                minAcksReached: true,
            },
        }),
        query: sinon.stub(nodeApiService, 'query').resolves({
            status: 'COMPLETED',
            data: [],
        }),
        finality: sinon.stub(nodeApiService, 'finality').resolves('mock-finality-op-id'),
        finalityStatus: sinon.stub(nodeApiService, 'finalityStatus').resolves(3),
        localStore: safeStub(nodeApiService, 'localStore', 'mock-local-store-op-id'),
    };
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
    return {
        status: 'COMPLETED',
        data: {
            signatures: [
                {
                    identityId: 1,
                    r: '0x' + 'ab'.repeat(32),
                    vs: '0x' + 'cd'.repeat(32),
                },
            ],
            publisherNodeSignature: {
                identityId: 1,
                r: '0x' + 'ab'.repeat(32),
                vs: '0x' + 'cd'.repeat(32),
            },
            minAcksReached: true,
            ...overrides,
        },
    };
}
