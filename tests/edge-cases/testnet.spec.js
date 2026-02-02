/**
 * Edge Case Tests - Testnet
 *
 * Runs each edge-case fixture ONCE per chain (Base, Gnosis, Neuroweb).
 * Reports which passed, which failed, and what errors occurred.
 */

import { BLOCKCHAINS, BLOCKCHAIN_IDS } from '../../constants/constants.js';

// Override RPCs from environment if provided
if (process.env.BASE_TESTNET_RPC) {
    BLOCKCHAINS.testnet['base:84532'].rpc = process.env.BASE_TESTNET_RPC;
}
if (process.env.GNOSIS_TESTNET_RPC) {
    BLOCKCHAINS.testnet['gnosis:10200'].rpc = process.env.GNOSIS_TESTNET_RPC;
}
if (process.env.NEUROWEB_TESTNET_RPC) {
    BLOCKCHAINS.testnet['otp:20430'].rpc = process.env.NEUROWEB_TESTNET_RPC;
}

import { strict as assert } from 'assert';
import DKG from '../../index.js';
import { loadAllFixtures, EDGE_CASE_DESCRIPTIONS } from '../fixtures/index.js';
import 'dotenv/config';

const OT_NODE_PORT = '8900';
const OT_NODE_HOSTNAME = 'https://v6-pegasus-node-03.origin-trail.network';

// Single wallet for all edge-case tests (from environment)
const EDGE_CASE_PUBLIC_KEY = process.env.EDGE_CASE_PUBLIC_KEY;
const EDGE_CASE_PRIVATE_KEY = process.env.EDGE_CASE_PRIVATE_KEY;

// Chain configurations for testnet
const CHAINS = [
    {
        name: 'Base Testnet',
        id: BLOCKCHAIN_IDS.BASE_TESTNET,
    },
    {
        name: 'Gnosis Testnet',
        id: BLOCKCHAIN_IDS.GNOSIS_TESTNET,
    },
    {
        name: 'Neuroweb Testnet',
        id: BLOCKCHAIN_IDS.NEUROWEB_TESTNET,
    },
];

// Results storage for final summary
const results = {};

// Delay between tests to avoid nonce/gas issues
const DELAY_BETWEEN_TESTS_MS = 10000; // 10 seconds between tests
const DELAY_BETWEEN_CHAINS_MS = 15000; // 15 seconds when switching chains
const DELAY_BETWEEN_RETRIES_MS = 15000; // 15 seconds between publish retries
const MAX_PUBLISH_RETRIES = 3; // Total attempts (1 initial + 2 retries)

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Attempts to publish an asset with retries.
 * Waits between retries to avoid underpriced/nonce issues.
 */
async function publishWithRetry(DkgClient, content, options, maxRetries = MAX_PUBLISH_RETRIES) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`    📤 Publish attempt ${attempt}/${maxRetries}...`);
            
            const createResult = await Promise.race([
                DkgClient.asset.create(content, options),
                new Promise((_, reject) =>
                    setTimeout(
                        () => reject(new Error('Timeout: Publish exceeded 5 minutes')),
                        5 * 60 * 1000,
                    ),
                ),
            ]);
            
            return { success: true, result: createResult, attempts: attempt };
        } catch (error) {
            lastError = error;
            console.log(`    ⚠️  Attempt ${attempt} failed: ${error.message}`);
            
            // Don't wait after the last attempt
            if (attempt < maxRetries) {
                console.log(`    ⏳ Waiting ${DELAY_BETWEEN_RETRIES_MS / 1000}s before retry...`);
                await sleep(DELAY_BETWEEN_RETRIES_MS);
            }
        }
    }
    
    return { success: false, error: lastError, attempts: maxRetries };
}

describe('Edge Case Tests - Testnet (All Chains)', function () {
    this.timeout(60 * 60 * 1000); // 60 minutes total

    const fixtures = loadAllFixtures('valid');

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

            for (const fixture of fixtures) {
                it(`Edge case: ${fixture.name}`, async function () {
                    const description = EDGE_CASE_DESCRIPTIONS[fixture.name] || fixture.name;
                    console.log(`\n  Testing: ${fixture.name} - ${description}`);

                    const testResult = {
                        name: fixture.name,
                        description,
                        passed: false,
                        error: null,
                        ual: null,
                        publishTime: null,
                        getTime: null,
                        queryTime: null,
                    };

                    try {
                        // Step 1: Publish (with retries)
                        const publishStart = Date.now();
                        const publishResult = await publishWithRetry(
                            DkgClient,
                            fixture.content,
                            { epochsNum: 2 },
                        );
                        testResult.publishTime = Date.now() - publishStart;

                        if (!publishResult.success) {
                            throw publishResult.error || new Error('Publish failed after all retries');
                        }

                        const createResult = publishResult.result;
                        assert.ok(createResult, 'Create result should exist');
                        assert.ok(createResult.UAL, 'UAL should be returned');
                        testResult.ual = createResult.UAL;
                        console.log(`    ✅ Published: ${createResult.UAL} (${(testResult.publishTime / 1000).toFixed(2)}s, ${publishResult.attempts} attempt(s))`);

                        // Step 2: Get (retrieve the asset)
                        const getStart = Date.now();
                        const getResult = await Promise.race([
                            DkgClient.asset.get(createResult.UAL),
                            new Promise((_, reject) =>
                                setTimeout(
                                    () => reject(new Error('Timeout: Get exceeded 3 minutes')),
                                    3 * 60 * 1000,
                                ),
                            ),
                        ]);
                        testResult.getTime = Date.now() - getStart;

                        assert.ok(getResult, 'Get result should exist');
                        assert.ok(getResult.assertion, 'Assertion should be present');
                        console.log(`    ✅ Get succeeded (${(testResult.getTime / 1000).toFixed(2)}s)`);

                        // Step 3: Query
                        const queryStart = Date.now();
                        const queryResult = await Promise.race([
                            DkgClient.graph.query(
                                `SELECT ?s ?type WHERE { ?s a ?type } LIMIT 10`,
                                'SELECT',
                            ),
                            new Promise((_, reject) =>
                                setTimeout(
                                    () => reject(new Error('Timeout: Query exceeded 3 minutes')),
                                    3 * 60 * 1000,
                                ),
                            ),
                        ]);
                        testResult.queryTime = Date.now() - queryStart;

                        assert.ok(queryResult, 'Query result should exist');
                        console.log(`    ✅ Query succeeded (${(testResult.queryTime / 1000).toFixed(2)}s)`);

                        testResult.passed = true;
                    } catch (error) {
                        testResult.error = {
                            name: error.name,
                            message: error.message,
                            stack: error.stack?.split('\n').slice(0, 3).join('\n'),
                        };
                        console.log(`    ❌ Failed: ${error.message}`);
                        throw error; // Re-throw to mark test as failed
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
        console.log('                    EDGE CASE TEST SUMMARY - TESTNET');
        console.log('═'.repeat(80));

        for (const chain of CHAINS) {
            const chainResults = results[chain.id];
            if (!chainResults || Object.keys(chainResults).length === 0) {
                console.log(`\n🔗 ${chain.name} (${chain.id}): SKIPPED (no credentials)`);
                continue;
            }

            const passed = Object.values(chainResults).filter((r) => r.passed).length;
            const failed = Object.values(chainResults).filter((r) => !r.passed).length;
            const total = passed + failed;

            console.log(`\n🔗 ${chain.name} (${chain.id}): ${passed}/${total} passed`);
            console.log('─'.repeat(60));

            for (const [name, result] of Object.entries(chainResults)) {
                if (result.passed) {
                    const totalTime = (
                        (result.publishTime + result.getTime + result.queryTime) /
                        1000
                    ).toFixed(2);
                    console.log(`  ✅ ${name} - PASSED (${totalTime}s total)`);
                } else {
                    console.log(`  ❌ ${name} - FAILED`);
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
