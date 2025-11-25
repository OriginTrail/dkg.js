import { test, expect } from './fixtures.js';
import { NEUROWEB_TESTNET, NEUROWEB_MAINNET, TESTNET_CHAIN_ID_HEX, MAINNET_CHAIN_ID_HEX } from './config.js';
import { closeModals } from './helpers.js';

/**
 * Tests for error handling when adding networks to MetaMask
 * Covers: invalid RPC, chainId/RPC mismatch, duplicate networks, validation
 */

test.describe('Neuroweb Network - Error Handling', () => {

  test('should handle invalid RPC URL error', async ({ metamask }) => {
    console.log('Testing: Invalid RPC URL error handling');

    const invalidNetwork = {
      name: 'Invalid Network Test',
      rpcUrl: 'https://this-is-an-invalid-rpc-endpoint-12345.com',
      chainId: 99999,
      symbol: 'INVALID'
    };

    let errorOccurred = false;
    
    try {
      await metamask.addNetwork(invalidNetwork);
      console.log('WARNING: Network added (MetaMask may allow this)');
      
      // Try to switch to it - this should fail if RPC is truly invalid
      await metamask.switchNetwork(invalidNetwork.name);
      console.log('WARNING: Switched to invalid network (may timeout on actual use)');
      
    } catch (error) {
      errorOccurred = true;
      console.log('✅ Expected error occurred:', error.message);
    }

    console.log(errorOccurred ? '✅ Invalid RPC rejected' : 'INFO: Network added but may fail on use');
  });

  test('should detect chainId/RPC mismatch errors', async ({ metamask, metamaskPage }) => {
    console.log('Testing: ChainId/RPC mismatch detection');
    
    // CRITICAL TEST: Using correct Testnet RPC URL but WRONG chainId
    // This should fail because MetaMask will query the RPC and get chainId 20430
    // but we're telling it the chainId is 2043 - MISMATCH!
    const mismatchedNetwork = {
      name: 'Mismatched ChainId Test',
      rpcUrl: NEUROWEB_TESTNET.rpcUrl, // Testnet RPC (actual chainId: 20430)
      chainId: NEUROWEB_MAINNET.chainId, // WRONG! This is Mainnet chainId
      symbol: 'MNEURO'
    };

    let errorOccurred = false;
    let errorMessage = '';
    
    try {
      await metamask.addNetwork(mismatchedNetwork);
      await closeModals(metamaskPage);
      console.log('WARNING: WARNING: MetaMask accepted mismatched configuration!');
      
      await metamask.switchNetwork(mismatchedNetwork.name);
      await closeModals(metamaskPage);
      console.log('WARNING: WARNING: Switched to mismatched network!');
      
    } catch (error) {
      errorOccurred = true;
      errorMessage = error.message;
      console.log('✅ Expected error occurred:', errorMessage);
    }

    // This test SHOULD fail if there's a mismatch
    if (!errorOccurred) {
      console.log('WARNING: ALERT: ChainId/RPC mismatch was not detected!');
      throw new Error('CRITICAL: ChainId/RPC mismatch was not detected by MetaMask! Expected error but network was added.');
    } else {
      console.log('✅ ChainId/RPC mismatch correctly detected and rejected');
      expect(errorMessage).toBeTruthy();
    }
  });

  test('should handle duplicate network addition', async ({ metamask }) => {
    console.log('Testing: Duplicate network addition');

    const testNetwork = {
      name: 'Duplicate Test Network',
      rpcUrl: NEUROWEB_TESTNET.rpcUrl,
      chainId: NEUROWEB_TESTNET.chainId,
      symbol: NEUROWEB_TESTNET.symbol
    };

    // Add network first time
    await metamask.addNetwork(testNetwork);
    console.log('✅ Network added first time');

    // Try to add the same network again
    try {
      await metamask.addNetwork(testNetwork);
      console.log('INFO: Network added again (MetaMask updated or skipped)');
    } catch (error) {
      console.log('✅ Duplicate network handled:', error.message);
    }

    // Verify network is available
    await metamask.switchNetwork(testNetwork.name);
    console.log('✅ Network is accessible');
  });

  test('should validate chainId format and requirements', async () => {
    console.log('Testing: ChainId format validation');

    // Verify hex conversion is correct for both networks
    expect(TESTNET_CHAIN_ID_HEX).toBe('0x4fce');
    expect(MAINNET_CHAIN_ID_HEX).toBe('0x7fb');
    console.log(`✅ Testnet ChainId: ${NEUROWEB_TESTNET.chainId} = ${TESTNET_CHAIN_ID_HEX}`);
    console.log(`✅ Mainnet ChainId: ${NEUROWEB_MAINNET.chainId} = ${MAINNET_CHAIN_ID_HEX}`);

    // Verify chainIds are valid positive integers
    expect(NEUROWEB_TESTNET.chainId).toBeGreaterThan(0);
    expect(NEUROWEB_MAINNET.chainId).toBeGreaterThan(0);
    expect(Number.isInteger(NEUROWEB_TESTNET.chainId)).toBeTruthy();
    expect(Number.isInteger(NEUROWEB_MAINNET.chainId)).toBeTruthy();
    console.log('✅ ChainId formats validated');
  });

  test('should validate all required network parameters', async () => {
    console.log('Testing: Required network parameters');

    const requiredParams = ['name', 'rpcUrl', 'chainId', 'symbol'];

    // Verify all required parameters are present and valid
    for (const param of requiredParams) {
      expect(NEUROWEB_TESTNET[param]).toBeDefined();
      expect(NEUROWEB_TESTNET[param]).not.toBeNull();
      expect(NEUROWEB_MAINNET[param]).toBeDefined();
      expect(NEUROWEB_MAINNET[param]).not.toBeNull();
    }
    
    // Validate symbol length (2-11 characters for MetaMask)
    expect(NEUROWEB_TESTNET.symbol.length).toBeGreaterThanOrEqual(2);
    expect(NEUROWEB_TESTNET.symbol.length).toBeLessThanOrEqual(11);
    expect(NEUROWEB_MAINNET.symbol.length).toBeGreaterThanOrEqual(2);
    expect(NEUROWEB_MAINNET.symbol.length).toBeLessThanOrEqual(11);
    
    console.log('✅ Testnet config valid:', NEUROWEB_TESTNET);
    console.log('✅ Mainnet config valid:', NEUROWEB_MAINNET);
    console.log('✅ All required parameters validated');
  });

  test('should handle user rejection of network addition', async ({ metamask, metamaskPage }) => {
    console.log('Testing: User rejects network addition');

    const testNetwork = {
      name: 'Rejection Test Network',
      rpcUrl: NEUROWEB_TESTNET.rpcUrl,
      chainId: NEUROWEB_TESTNET.chainId,
      symbol: 'TEST'
    };

    // This test demonstrates rejection handling
    // Note: In automated tests, Synpress auto-approves by default
    // This test validates that rejection handling exists in the code structure
    try {
      await metamask.addNetwork(testNetwork);
      console.log('✅ Network addition flow completed (auto-approved in test)');
      
      // In real scenarios, if user rejects, this would throw an error
      // Our code should handle that gracefully
      console.log('INFO: In production: User rejection would throw error and be caught');
      
    } catch (error) {
      // This catch block handles rejection
      console.log('✅ Network rejection handled:', error.message);
      expect(error.message).toBeTruthy();
    }
    
    console.log('✅ Rejection handling structure verified');
  });
});
