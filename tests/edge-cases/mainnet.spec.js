/**
 * Edge Case Tests - Mainnet
 *
 * Runs valid and invalid fixtures per chain (Base, Gnosis, Neuroweb).
 * Produces actionable pass/fail diagnostics for validation and runtime failures.
 */

import { BLOCKCHAINS, BLOCKCHAIN_IDS } from '../../constants/constants.js';

// Override RPCs from environment if provided
if (process.env.BASE_MAINNET_RPC) {
    BLOCKCHAINS.mainnet['base:8453'].rpc = process.env.BASE_MAINNET_RPC;
}
if (process.env.GNOSIS_MAINNET_RPC) {
    BLOCKCHAINS.mainnet['gnosis:100'].rpc = process.env.GNOSIS_MAINNET_RPC;
}
if (process.env.NEUROWEB_MAINNET_RPC) {
    BLOCKCHAINS.mainnet['otp:2043'].rpc = process.env.NEUROWEB_MAINNET_RPC;
}

import { strict as assert } from 'assert';
import DKG from '../../index.js';
import {
    loadAllFixtures,
    EDGE_CASE_DESCRIPTIONS,
    INVALID_EDGE_CASE_DESCRIPTIONS,
    INVALID_EDGE_CASE_ERROR_PATTERNS,
} from '../fixtures/index.js';
import 'dotenv/config';

const OT_NODE_PORT = '8900';
const OT_NODE_HOSTNAME = 'https://positron.origin-trail.network';

// Single wallet for all edge-case tests (from environment)
const EDGE_CASE_PUBLIC_KEY = process.env.EDGE_CASE_PUBLIC_KEY;
const EDGE_CASE_PRIVATE_KEY = process.env.EDGE_CASE_PRIVATE_KEY;

// Chain configurations for mainnet
const CHAINS = [
    {
        name: 'Base Mainnet',
        id: BLOCKCHAIN_IDS.BASE_MAINNET,
    },
    {
        name: 'Gnosis Mainnet',
        id: BLOCKCHAIN_IDS.GNOSIS_MAINNET,
    },
    {
        name: 'Neuroweb Mainnet',
        id: BLOCKCHAIN_IDS.NEUROWEB_MAINNET,
    },
];

// Results storage for final summary
const results = {};

// Delay between tests to avoid nonce/gas issues
const DELAY_BETWEEN_TESTS_MS = 10000; // 10 seconds between tests
const DELAY_BETWEEN_CHAINS_MS = 15000; // 15 seconds when switching chains
const PUBLISH_TIMEOUT_MS = 5 * 60 * 1000;
const GET_TIMEOUT_MS = 3 * 60 * 1000;
const QUERY_TIMEOUT_MS = 3 * 60 * 1000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getOperationStatus(createResult, operationName) {
    return createResult?.operation?.[operationName]?.status || 'UNKNOWN';
}

function extractOperationReason(createResult, operationName) {
    const operation = createResult?.operation?.[operationName] || {};
    return (
        operation.errorMessage ||
        operation.reason ||
        operation.message ||
        operation.error ||
        operation.statusMessage ||
        ''
    );
}

function buildCreateResultErrorText(createResult) {
    const publishStatus = getOperationStatus(createResult, 'publish');
    const finalityStatus = getOperationStatus(createResult, 'finality');
    const publishReason = extractOperationReason(createResult, 'publish');
    const finalityReason = extractOperationReason(createResult, 'finality');

    return [
        `publishStatus=${publishStatus}`,
        `finalityStatus=${finalityStatus}`,
        publishReason,
        finalityReason,
    ]
        .filter(Boolean)
        .join(' | ');
}

function getErrorText(error, createResult = null) {
    const message = String(error?.message || '');
    if (createResult) {
        return `${message} | ${buildCreateResultErrorText(createResult)}`;
    }
    return message;
}

function matchesAnyPattern(text, patterns = []) {
    const lowerText = String(text || '').toLowerCase();
    return patterns.some((pattern) => lowerText.includes(String(pattern).toLowerCase()));
}

async function attemptPublishOnce(DkgClient, content, options) {
    return Promise.race([
        DkgClient.asset.create(content, options),
        new Promise((_, reject) =>
            setTimeout(
                () => reject(new Error('Timeout: Publish exceeded 5 minutes')),
                PUBLISH_TIMEOUT_MS,
            ),
        ),
    ]);
}

describe('Edge Case Tests - Mainnet (All Chains)', function () {
    this.timeout(60 * 60 * 1000); // 60 minutes total

    const validFixtures = loadAllFixtures('valid');
    const invalidFixtures = loadAllFixtures('invalid');

    for (const chain of CHAINS) {
        describe(`Chain: ${chain.name} (${chain.id})`, function () {
            let DkgClient;

            before(async function () {
                if (!EDGE_CASE_PUBLIC_KEY || !EDGE_CASE_PRIVATE_KEY) {
                    console.log(`⚠️  Skipping ${chain.name}: Missing credentials (EDGE_CASE_PUBLIC_KEY / EDGE_CASE_PRIVATE_KEY)`);
                    this.skip();
                }

                // Wait before starting a new chain to let previous chain's transactions settle
                if (Object.keys(results).length > 0) {
                    console.log(`\n  ⏳ Waiting ${DELAY_BETWEEN_CHAINS_MS / 1000}s before starting ${chain.name}...`);
                    await sleep(DELAY_BETWEEN_CHAINS_MS);
                }

                DkgClient = new DKG({
                    endpoint: OT_NODE_HOSTNAME,
                    port: OT_NODE_PORT,
                    blockchain: {
                        name: chain.id,
                        publicKey: EDGE_CASE_PUBLIC_KEY,
                        privateKey: EDGE_CASE_PRIVATE_KEY,
                    },
                    maxNumberOfRetries: 100,
                    frequency: 2,
                    contentType: 'all',
                    nodeApiVersion: '/v1',
                });

                // Initialize results for this chain
                results[chain.id] = {};
            });

            afterEach(async function () {
                // Wait between tests to avoid nonce collisions and underpriced errors
                console.log(`    ⏳ Waiting ${DELAY_BETWEEN_TESTS_MS / 1000}s before next test...`);
                await sleep(DELAY_BETWEEN_TESTS_MS);
            });

            for (const fixture of validFixtures) {
                it(`Valid edge case: ${fixture.name}`, async function () {
                    const description = EDGE_CASE_DESCRIPTIONS[fixture.name] || fixture.name;
                    console.log(`\n  [VALID] Testing: ${fixture.name} - ${description}`);

                    const testResult = {
                        category: 'valid',
                        name: fixture.name,
                        description,
                        passed: false,
                        expectedFailure: false,
                        error: null,
                        ual: null,
                        publishAttempts: null,
                        publishStatus: null,
                        finalityStatus: null,
                        publishTime: null,
                        getTime: null,
                        queryTime: null,
                        failedAt: null,
                    };
                    let createResult = null;
                    let getResult = null;
                    let queryResult = null;
                    let currentStep = 'publish';

                    try {
                        // Step 1: Publish (single attempt, no retries)
                        const publishStart = Date.now();
                        createResult = await attemptPublishOnce(
                            DkgClient,
                            fixture.content,
                            { epochsNum: 2, minimumNumberOfFinalizationConfirmations: 0 },
                        );
                        testResult.publishTime = Date.now() - publishStart;
                        testResult.publishAttempts = 1;
                        assert.ok(createResult, 'Create result should exist');
                        assert.ok(createResult.operation, 'Operation should exist');
                        const publishStatus = getOperationStatus(createResult, 'publish');
                        const finalityStatus = getOperationStatus(createResult, 'finality');
                        assert.equal(publishStatus, 'COMPLETED', `Publish status must be COMPLETED (got ${publishStatus})`);
                        assert.equal(finalityStatus, 'FINALIZED', `Finality status must be FINALIZED (got ${finalityStatus})`);
                        assert.ok(createResult.UAL, 'UAL should be returned');
                        testResult.publishStatus = getOperationStatus(createResult, 'publish');
                        testResult.finalityStatus = getOperationStatus(createResult, 'finality');
                        testResult.ual = createResult.UAL;
                        console.log(`    ✅ Published: ${createResult.UAL} (${(testResult.publishTime / 1000).toFixed(2)}s, 1 attempt)`);

                        // Step 2: Get (retrieve the asset)
                        currentStep = 'get';
                        const getStart = Date.now();
                        getResult = await Promise.race([
                            DkgClient.asset.get(createResult.UAL),
                            new Promise((_, reject) =>
                                setTimeout(
                                    () => reject(new Error('Timeout: Get exceeded 3 minutes')),
                                    GET_TIMEOUT_MS,
                                ),
                            ),
                        ]);
                        testResult.getTime = Date.now() - getStart;

                        assert.ok(getResult, 'Get result should exist');
                        if (!getResult.assertion) {
                            const getKeys = typeof getResult === 'object' && getResult !== null
                                ? Object.keys(getResult).join(',') || 'none'
                                : typeof getResult;
                            throw new Error(`Get response is missing assertion (response keys/type: ${getKeys})`);
                        }
                        console.log(`    ✅ Get succeeded (${(testResult.getTime / 1000).toFixed(2)}s)`);

                        // Step 3: Query
                        currentStep = 'query';
                        const queryStart = Date.now();
                        queryResult = await Promise.race([
                            DkgClient.graph.query(
                                `SELECT ?s ?type WHERE { ?s a ?type } LIMIT 10`,
                                'SELECT',
                            ),
                            new Promise((_, reject) =>
                                setTimeout(
                                    () => reject(new Error('Timeout: Query exceeded 3 minutes')),
                                    QUERY_TIMEOUT_MS,
                                ),
                            ),
                        ]);
                        testResult.queryTime = Date.now() - queryStart;

                        assert.ok(queryResult, 'Query result should exist');
                        if (!Array.isArray(queryResult.data) || queryResult.data.length === 0) {
                            const queryDataType = Array.isArray(queryResult.data) ? 'array' : typeof queryResult.data;
                            const queryRows = Array.isArray(queryResult.data) ? queryResult.data.length : 'n/a';
                            throw new Error(`Query returned no rows (data type: ${queryDataType}, rows: ${queryRows})`);
                        }
                        console.log(`    ✅ Query succeeded (${(testResult.queryTime / 1000).toFixed(2)}s)`);

                        testResult.passed = true;
                    } catch (error) {
                        const getKeys = typeof getResult === 'object' && getResult !== null
                            ? Object.keys(getResult).join(',') || 'none'
                            : 'n/a';
                        const assertionType = getResult?.assertion === undefined
                            ? 'undefined'
                            : getResult?.assertion === null
                                ? 'null'
                                : Array.isArray(getResult?.assertion)
                                    ? 'array'
                                    : typeof getResult?.assertion;
                        const queryRows = Array.isArray(queryResult?.data) ? queryResult.data.length : 'n/a';
                        const detailedMessage = [
                            `Step=${currentStep}`,
                            `Fixture=${fixture.name}`,
                            `Reason=${error.message}`,
                            createResult ? `PublishMeta=${buildCreateResultErrorText(createResult)}` : null,
                            createResult?.UAL ? `UAL=${createResult.UAL}` : null,
                            currentStep !== 'publish' ? `GetKeys=${getKeys}` : null,
                            currentStep !== 'publish' ? `AssertionType=${assertionType}` : null,
                            currentStep === 'query' ? `QueryRows=${queryRows}` : null,
                        ].filter(Boolean).join(' | ');

                        testResult.failedAt = currentStep;
                        testResult.error = {
                            name: error.name,
                            message: detailedMessage,
                            stack: error.stack?.split('\n').slice(0, 3).join('\n'),
                        };
                        console.log(`    ❌ Failed: ${detailedMessage}`);
                        throw new Error(detailedMessage); // Re-throw to mark test as failed with context
                    } finally {
                        results[chain.id][fixture.name] = testResult;
                    }
                });
            }

            for (const fixture of invalidFixtures) {
                it(`Invalid edge case: ${fixture.name}`, async function () {
                    const description = INVALID_EDGE_CASE_DESCRIPTIONS[fixture.name] || fixture.name;
                    const expectedErrorPatterns = INVALID_EDGE_CASE_ERROR_PATTERNS[fixture.name] || [];
                    console.log(`\n  [INVALID] Testing: ${fixture.name} - ${description}`);

                    const testResult = {
                        category: 'invalid',
                        name: fixture.name,
                        description,
                        passed: false,
                        expectedFailure: true,
                        error: null,
                        ual: null,
                        publishAttempts: 1,
                        publishStatus: null,
                        finalityStatus: null,
                        publishTime: null,
                        getTime: null,
                        queryTime: null,
                    };

                    try {
                        const publishStart = Date.now();
                        let createResult = null;
                        let thrownError = null;

                        try {
                            createResult = await attemptPublishOnce(
                                DkgClient,
                                fixture.content,
                                { epochsNum: 2, minimumNumberOfFinalizationConfirmations: 0 },
                            );
                        } catch (error) {
                            thrownError = error;
                        }

                        testResult.publishTime = Date.now() - publishStart;
                        testResult.publishStatus = getOperationStatus(createResult, 'publish');
                        testResult.finalityStatus = getOperationStatus(createResult, 'finality');
                        testResult.ual = createResult?.UAL || null;

                        if (thrownError) {
                            const errorText = getErrorText(thrownError);
                            assert.ok(
                                matchesAnyPattern(errorText, expectedErrorPatterns),
                                `Invalid fixture failed for unexpected reason: ${errorText}`,
                            );
                            console.log(`    ✅ Rejected as expected: ${thrownError.message}`);
                            testResult.passed = true;
                            return;
                        }

                        // If no throw, operation statuses must still indicate failure for invalid input.
                        const publishStatus = getOperationStatus(createResult, 'publish');
                        const finalityStatus = getOperationStatus(createResult, 'finality');
                        const isRejectedByStatus = publishStatus !== 'COMPLETED' || finalityStatus !== 'FINALIZED';
                        const statusErrorText = buildCreateResultErrorText(createResult);

                        assert.ok(
                            isRejectedByStatus,
                            `Invalid fixture unexpectedly succeeded with UAL=${createResult?.UAL || 'N/A'}`
                        );
                        assert.ok(
                            matchesAnyPattern(statusErrorText, expectedErrorPatterns),
                            `Invalid fixture failed for unexpected reason: ${statusErrorText}`,
                        );

                        console.log(`    ✅ Rejected by operation status as expected (${statusErrorText})`);
                        testResult.passed = true;
                    } catch (error) {
                        testResult.error = {
                            name: error.name,
                            message: error.message,
                            stack: error.stack?.split('\n').slice(0, 3).join('\n'),
                        };
                        console.log(`    ❌ Failed: ${error.message}`);
                        throw error;
                    } finally {
                        results[chain.id][fixture.name] = testResult;
                    }
                });
            }
        });
    }

    after(function () {
        console.log('\n');
        console.log('═'.repeat(80));
        console.log('                    EDGE CASE TEST SUMMARY - MAINNET');
        console.log('═'.repeat(80));

        for (const chain of CHAINS) {
            const chainResults = results[chain.id];
            if (!chainResults || Object.keys(chainResults).length === 0) {
                console.log(`\n🔗 ${chain.name} (${chain.id}): SKIPPED (no credentials)`);
                continue;
            }

            const allResults = Object.values(chainResults);
            const passed = allResults.filter((r) => r.passed).length;
            const failed = allResults.filter((r) => !r.passed).length;
            const total = passed + failed;
            const validPassed = allResults.filter((r) => r.category === 'valid' && r.passed).length;
            const validTotal = allResults.filter((r) => r.category === 'valid').length;
            const invalidPassed = allResults.filter((r) => r.category === 'invalid' && r.passed).length;
            const invalidTotal = allResults.filter((r) => r.category === 'invalid').length;

            console.log(`\n🔗 ${chain.name} (${chain.id}): ${passed}/${total} passed`);
            console.log(`   • Valid fixtures:   ${validPassed}/${validTotal}`);
            console.log(`   • Invalid fixtures: ${invalidPassed}/${invalidTotal}`);
            console.log('─'.repeat(60));

            for (const [name, result] of Object.entries(chainResults)) {
                if (result.passed) {
                    const totalMs =
                        (result.publishTime || 0) +
                        (result.getTime || 0) +
                        (result.queryTime || 0);
                    const totalTime = (totalMs / 1000).toFixed(2);
                    const categoryLabel = result.category?.toUpperCase() || 'UNKNOWN';
                    console.log(`  ✅ [${categoryLabel}] ${name} - PASSED (${totalTime}s total)`);
                } else {
                    const categoryLabel = result.category?.toUpperCase() || 'UNKNOWN';
                    console.log(`  ❌ [${categoryLabel}] ${name} - FAILED`);
                    console.log(`     Error: ${result.error?.message || 'Unknown error'}`);
                    if (result.ual) {
                        console.log(`     UAL: ${result.ual}`);
                    }
                }
            }
        }

        // Summary of failures across all chains
        const allFailures = [];
        for (const chain of CHAINS) {
            const chainResults = results[chain.id];
            if (!chainResults) continue;
            for (const [name, result] of Object.entries(chainResults)) {
                if (!result.passed) {
                    allFailures.push({
                        chain: chain.name,
                        fixture: name,
                        error: result.error?.message || 'Unknown error',
                    });
                }
            }
        }

        if (allFailures.length > 0) {
            console.log('\n');
            console.log('═'.repeat(80));
            console.log('                         ALL FAILURES');
            console.log('═'.repeat(80));
            for (const failure of allFailures) {
                console.log(`  • [${failure.chain}] ${failure.fixture}: ${failure.error}`);
            }
        }

        console.log('\n' + '═'.repeat(80) + '\n');
    });
});
