/**
 * Network Health Check Utility
 * Checks if blockchain is producing blocks at acceptable speed before running tests
 */

import https from 'https';

/**
 * Make RPC call to check blockchain status
 */
async function checkRPC(hostname, path, method, params = []) {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            jsonrpc: '2.0',
            method,
            params,
            id: 1,
        });

        const options = {
            hostname,
            port: 443,
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
            },
            rejectUnauthorized: false,
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ success: true, data: json });
                } catch (e) {
                    resolve({ success: false, error: 'Invalid JSON' });
                }
            });
        });

        req.on('error', (e) => {
            resolve({ success: false, error: e.message });
        });

        req.setTimeout(5000, () => {
            req.destroy();
            resolve({ success: false, error: 'Timeout' });
        });

        req.write(data);
        req.end();
    });
}

/**
 * Check if Neuroweb is healthy by monitoring block production
 * @param {number} checkDuration - How long to monitor in milliseconds (default 12 seconds)
 * @param {number} minBlocksExpected - Minimum blocks expected in that duration (default 1)
 * @returns {Promise<Object>} Health check result
 */
export async function checkNeurowebHealth(checkDuration = 12000, minBlocksExpected = 1) {
    const hostname = 'lofar-testnet.origintrail.network';
    const path = '/';

    console.log('\n🔍 Checking Neuroweb Testnet Health...');
    console.log(`⏱️  Monitoring block production for ${checkDuration / 1000} seconds...`);

    // Get initial block
    const initialBlockRes = await checkRPC(hostname, path, 'eth_blockNumber');

    if (!initialBlockRes.success || !initialBlockRes.data?.result) {
        return {
            healthy: false,
            reason: 'Failed to connect to RPC',
            skipTests: true,
        };
    }

    const initialBlock = parseInt(initialBlockRes.data.result, 16);
    const initialTime = Date.now();

    console.log(`📊 Starting block: ${initialBlock}`);

    // Wait for specified duration
    await new Promise((resolve) => setTimeout(resolve, checkDuration));

    // Get final block
    const finalBlockRes = await checkRPC(hostname, path, 'eth_blockNumber');

    if (!finalBlockRes.success || !finalBlockRes.data?.result) {
        return {
            healthy: false,
            reason: 'Failed to get final block number',
            skipTests: true,
        };
    }

    const finalBlock = parseInt(finalBlockRes.data.result, 16);
    const finalTime = Date.now();
    const actualDuration = (finalTime - initialTime) / 1000;
    const blocksProduced = finalBlock - initialBlock;
    const avgBlockTime = blocksProduced > 0 ? actualDuration / blocksProduced : Infinity;

    console.log(`📊 Final block: ${finalBlock}`);
    console.log(`📈 Blocks produced: ${blocksProduced} in ${actualDuration.toFixed(1)}s`);
    console.log(`⏱️  Average block time: ${avgBlockTime.toFixed(1)}s`);

    // Check if network is healthy
    if (blocksProduced < minBlocksExpected) {
        console.log(
            `❌ Network is STALLED! Only ${blocksProduced} blocks in ${actualDuration.toFixed(1)}s (expected at least ${minBlocksExpected})`,
        );
        return {
            healthy: false,
            reason: `Network stalled - only ${blocksProduced} blocks in ${actualDuration.toFixed(1)}s`,
            blocksProduced,
            avgBlockTime,
            skipTests: true,
        };
    }

    // More lenient: Accept up to 15s average (2.5x target), as long as blocks are being produced consistently
    if (avgBlockTime > 15) {
        console.log(`⚠️  Network is TOO SLOW! Average block time: ${avgBlockTime.toFixed(1)}s (expected ~6s)`);
        return {
            healthy: false,
            reason: `Network too slow - ${avgBlockTime.toFixed(1)}s per block`,
            blocksProduced,
            avgBlockTime,
            skipTests: true,
        };
    }

    // Additional check: Get timestamps of first and last block to check for stalls
    // If the last block took significantly longer than average, we might be entering a stall
    if (blocksProduced >= 2) {
        const firstBlockRes = await checkRPC(
            hostname,
            path,
            'eth_getBlockByNumber',
            [`0x${initialBlock.toString(16)}`, false],
        );
        const lastBlockRes = await checkRPC(
            hostname,
            path,
            'eth_getBlockByNumber',
            [`0x${finalBlock.toString(16)}`, false],
        );

        if (firstBlockRes.success && lastBlockRes.success && firstBlockRes.data?.result && lastBlockRes.data?.result) {
            const firstBlockTime = parseInt(firstBlockRes.data.result.timestamp, 16);
            const lastBlockTime = parseInt(lastBlockRes.data.result.timestamp, 16);
            
            // Get second-to-last block to calculate most recent block interval
            const secondLastBlockRes = await checkRPC(
                hostname,
                path,
                'eth_getBlockByNumber',
                [`0x${(finalBlock - 1).toString(16)}`, false],
            );
            
            if (secondLastBlockRes.success && secondLastBlockRes.data?.result) {
                const secondLastBlockTime = parseInt(secondLastBlockRes.data.result.timestamp, 16);
                const lastBlockInterval = lastBlockTime - secondLastBlockTime;
                
                console.log(`🔍 Most recent block interval: ${lastBlockInterval}s`);
                
                // If the most recent block took > 18 seconds, network might be entering a stall
                if (lastBlockInterval > 18) {
                    console.log(`⚠️  Last block was slow (${lastBlockInterval}s) - possible stall beginning!`);
                    return {
                        healthy: false,
                        reason: `Last block took ${lastBlockInterval}s - possible stall`,
                        blocksProduced,
                        avgBlockTime,
                        lastBlockInterval,
                        skipTests: true,
                    };
                }
            }
        }
    }

    console.log(`✅ Network is HEALTHY! Block production is normal.`);
    return {
        healthy: true,
        reason: 'Network is producing blocks at acceptable speed',
        blocksProduced,
        avgBlockTime,
        skipTests: false,
    };
}

/**
 * Quick health check (shorter duration for final verification)
 * @returns {Promise<Object>} Health check result
 */
export async function quickHealthCheck() {
    return await checkNeurowebHealth(12000, 1); // 12 seconds, expect at least 1 block
}

/**
 * Wait for network to be healthy before proceeding
 * Keeps checking until network is healthy or max wait time is reached
 * @param {number} maxWaitMinutes - Maximum minutes to wait (default 10)
 * @returns {Promise<boolean>} True if network became healthy, false if timed out
 */
export async function waitForHealthyNetwork(maxWaitMinutes = 10) {
    const maxWaitTime = maxWaitMinutes * 60 * 1000;
    const startTime = Date.now();
    let attemptCount = 0;

    console.log('\n⏳ Waiting for network to be healthy before publishing...');

    while (Date.now() - startTime < maxWaitTime) {
        attemptCount++;
        const health = await checkNeurowebHealth(18000, 2); // 18 seconds, expect at least 2 blocks (avg 9s, target 6s)

        if (health.healthy) {
            if (attemptCount > 1) {
                console.log(
                    `✅ Network became healthy after ${attemptCount} attempts (${((Date.now() - startTime) / 1000).toFixed(0)}s)`,
                );
            }
            return true;
        }

        const elapsedMinutes = ((Date.now() - startTime) / 60000).toFixed(1);
        console.log(
            `⚠️  Attempt ${attemptCount}: Network unhealthy (${health.reason}) - waiting... (${elapsedMinutes}/${maxWaitMinutes} min)`,
        );

        // Wait 10 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    console.log(
        `❌ Network did not become healthy within ${maxWaitMinutes} minutes. Proceeding anyway...`,
    );
    return false;
}

