import { test, expect } from './fixtures.js';
import { NEUROWEB_TESTNET, NEUROWEB_MAINNET, TESTNET_CHAIN_ID_HEX, MAINNET_CHAIN_ID_HEX } from './config.js';
import { closeModals, ensureNetwork } from './helpers.js';
import 'dotenv/config';

/**
 * Tests for NeuroWeb network integration with MetaMask
 * Covers: network addition, chainId validation, network switching
 */

test.describe('Neuroweb Network - MetaMask Integration', () => {
  test.beforeEach(async ({ metamaskPage }) => {
    await closeModals(metamaskPage);
  });

  test('should add correct Neuroweb configs WITHOUT any errors', async ({ metamask, metamaskPage }) => {
    console.log('Testing: Correct RPC + Correct ChainId = NO ERRORS');
    
    // This test will FAIL if there are ANY errors with the correct configuration
    let testnetError = null;
    let mainnetError = null;
    
    // Test 1: Add Neuroweb Testnet with CORRECT RPC + CORRECT ChainId
    console.log('Adding Testnet: RPC=' + NEUROWEB_TESTNET.rpcUrl + ', ChainId=' + NEUROWEB_TESTNET.chainId);
    try {
      await metamask.addNetwork(NEUROWEB_TESTNET);
      await closeModals(metamaskPage);
      console.log('✅ Testnet network added');
      
      await metamask.switchNetwork(NEUROWEB_TESTNET.name);
      await closeModals(metamaskPage);
      console.log('✅ Testnet switched successfully - NO ERRORS!');
      
    } catch (error) {
      testnetError = error.message;
      console.error('❌ TESTNET FAILED:', error.message);
    }
    
    // Test 2: Add Neuroweb Mainnet with CORRECT RPC + CORRECT ChainId
    console.log('Adding Mainnet: RPC=' + NEUROWEB_MAINNET.rpcUrl + ', ChainId=' + NEUROWEB_MAINNET.chainId);
    try {
      await metamask.addNetwork(NEUROWEB_MAINNET);
      await closeModals(metamaskPage);
      console.log('✅ Mainnet network added');
      
      await metamask.switchNetwork(NEUROWEB_MAINNET.name);
      await closeModals(metamaskPage);
      console.log('✅ Mainnet switched successfully - NO ERRORS!');
      
    } catch (error) {
      mainnetError = error.message;
      console.error('❌ MAINNET FAILED:', error.message);
    }
    
    // Fail the test if ANY errors occurred with correct configuration
    if (testnetError || mainnetError) {
      const errorReport = [];
      if (testnetError) errorReport.push(`Testnet: ${testnetError}`);
      if (mainnetError) errorReport.push(`Mainnet: ${mainnetError}`);
      
      throw new Error('FAILED: Correct RPC + Correct ChainId produced errors!\n' + errorReport.join('\n'));
    }
    
    console.log('✅ ALL CORRECT CONFIGS WORK WITHOUT ERRORS!');
  });

  test('should verify chainId correctness for both networks', async ({ metamask, metamaskPage }) => {
    console.log('Testing: ChainId validation for Testnet and Mainnet');

    // Add both networks
    await ensureNetwork(metamask, metamaskPage, NEUROWEB_TESTNET);
    console.log(`✅ Testnet ChainId configured: ${NEUROWEB_TESTNET.chainId} (${TESTNET_CHAIN_ID_HEX})`);

    await ensureNetwork(metamask, metamaskPage, NEUROWEB_MAINNET);
    console.log(`✅ Mainnet ChainId configured: ${NEUROWEB_MAINNET.chainId} (${MAINNET_CHAIN_ID_HEX})`);

    // Verify hex conversion is correct
    expect(TESTNET_CHAIN_ID_HEX).toBe('0x4fce');
    expect(MAINNET_CHAIN_ID_HEX).toBe('0x7fb');
    console.log('✅ Both networks configured with correct chainIds');
  });

  test('should switch between networks correctly', async ({ metamask, metamaskPage }) => {
    console.log('Testing: Network switching between Testnet, Mainnet, and Ethereum');

    // Ensure both Neuroweb networks are added
    await ensureNetwork(metamask, metamaskPage, NEUROWEB_TESTNET);
    console.log('✅ Switched to Neuroweb Testnet');

    await ensureNetwork(metamask, metamaskPage, NEUROWEB_MAINNET);
    console.log('✅ Ensured Neuroweb Mainnet is added');

    // Switch to Ethereum Mainnet (default network)
    await metamask.switchNetwork('Ethereum Mainnet');
    await closeModals(metamaskPage);
    console.log('✅ Switched to Ethereum Mainnet');

    // Switch to Neuroweb Mainnet
    await metamask.switchNetwork(NEUROWEB_MAINNET.name);
    await closeModals(metamaskPage);
    console.log('✅ Switched to Neuroweb Mainnet');

    // Switch back to Neuroweb Testnet
    await metamask.switchNetwork(NEUROWEB_TESTNET.name);
    await closeModals(metamaskPage);
    console.log('✅ Switched back to Neuroweb Testnet');
    
    console.log('✅ All network switches successful');
  });

  test('should verify RPC endpoint is responding', async ({ metamask, metamaskPage, context }) => {
    console.log('Testing: RPC health check - verify endpoint responds');

    // Ensure we're on Neuroweb Testnet
    await ensureNetwork(metamask, metamaskPage, NEUROWEB_TESTNET);
    console.log('✅ Switched to Neuroweb Testnet');

    // Navigate to a real page (staking dApp) to ensure MetaMask injection
    // MetaMask doesn't inject into about:blank
    const page = await context.newPage();
    await page.goto('https://staking.origintrail.io/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000); // Wait for MetaMask to fully inject

    // Try to get block number from the RPC to verify it's working
    const rpcCheck = await page.evaluate(async () => {
      if (!window.ethereum) {
        return { error: 'No MetaMask - window.ethereum not available' };
      }
      
      try {
        const blockNumber = await window.ethereum.request({ 
          method: 'eth_blockNumber' 
        });
        
        const chainId = await window.ethereum.request({ 
          method: 'eth_chainId' 
        });

        return { 
          success: true, 
          blockNumber: parseInt(blockNumber, 16),
          chainId 
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    await page.close();

    // Check if there was an error
    if (rpcCheck.error) {
      console.log('WARNING: RPC check error:', rpcCheck.error);
      throw new Error(`RPC health check failed: ${rpcCheck.error}`);
    }

    // Verify RPC responded with valid data
    expect(rpcCheck.success).toBe(true);
    expect(rpcCheck.blockNumber).toBeGreaterThan(0);
    expect(rpcCheck.chainId).toBe(TESTNET_CHAIN_ID_HEX);
    
    console.log('✅ RPC endpoint is healthy');
    console.log(`   Block Number: ${rpcCheck.blockNumber}`);
    console.log(`   Chain ID: ${rpcCheck.chainId}`);
  });
});
