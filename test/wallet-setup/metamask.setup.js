import { defineWalletSetup } from '@synthetixio/synpress-cache';

const WALLET_PASSWORD = 'TestPassword123!';
const SEED_PHRASE = 'test test test test test test test test test test test junk';

console.log('[SETUP FILE] ==========================================');
console.log('[SETUP FILE] metamask.setup.js loaded');
console.log('[SETUP FILE] ==========================================');

export default defineWalletSetup(WALLET_PASSWORD, async (context, walletPage) => {
  console.log('[SETUP CALLBACK] ==========================================');
  console.log('[SETUP CALLBACK] defineWalletSetup callback starting...');
  console.log('[SETUP CALLBACK] CI:', !!process.env.CI);
  console.log('[SETUP CALLBACK] ==========================================');
  
  const isCI = !!process.env.CI;
  
  // Small stabilization delay
  await walletPage.waitForTimeout(isCI ? 2000 : 1000);
  console.log('[SETUP] Step 1: Clicking Import existing wallet...');
  
  // Manual wallet import for better CI compatibility
  try {
    // Step 1: Click "Import existing wallet"
    await walletPage.getByTestId('onboarding-import-wallet').click({ timeout: 15000 });
    await walletPage.waitForTimeout(1000);
    console.log('[SETUP] ✓ Clicked import wallet');
    
    // Step 2: Click "I agree" or "No thanks" on metrics
    try {
      await walletPage.getByTestId('metametrics-no-thanks').click({ timeout: 5000 });
      console.log('[SETUP] ✓ Clicked no thanks on metrics');
    } catch {
      await walletPage.getByTestId('metametrics-i-agree').click({ timeout: 5000 });
      console.log('[SETUP] ✓ Clicked I agree on metrics');
    }
    await walletPage.waitForTimeout(1000);
    
    // Step 3: Fill seed phrase
    console.log('[SETUP] Step 3: Filling seed phrase...');
    const words = SEED_PHRASE.split(' ');
    for (let i = 0; i < words.length; i++) {
      await walletPage.getByTestId(`import-srp__srp-word-${i}`).fill(words[i]);
    }
    await walletPage.waitForTimeout(1000);
    console.log('[SETUP] ✓ Filled all 12 words');
    
    // Step 4: Confirm seed phrase
    console.log('[SETUP] Step 4: Confirming seed phrase...');
    await walletPage.getByTestId('import-srp-confirm').click({ timeout: 15000 });
    await walletPage.waitForTimeout(2000);
    console.log('[SETUP] ✓ Confirmed seed phrase');
    
    // Step 5: Set password
    console.log('[SETUP] Step 5: Setting password...');
    await walletPage.getByTestId('create-password-new').fill(WALLET_PASSWORD);
    await walletPage.getByTestId('create-password-confirm').fill(WALLET_PASSWORD);
    await walletPage.getByTestId('create-password-terms').check();
    await walletPage.getByTestId('create-password-import').click({ timeout: 15000 });
    await walletPage.waitForTimeout(3000);
    console.log('[SETUP] ✓ Password set and import clicked');
    
    // Step 6: Complete onboarding
    console.log('[SETUP] Step 6: Completing onboarding...');
    await walletPage.getByTestId('onboarding-complete-done').click({ timeout: 15000 });
    await walletPage.waitForTimeout(1000);
    console.log('[SETUP] ✓ Clicked onboarding complete');
    
    // Step 7: Close any popups
    try {
      await walletPage.getByTestId('popover-close').click({ timeout: 2000 });
      console.log('[SETUP] ✓ Closed popover');
    } catch {}
    
    try {
      await walletPage.getByTestId('pin-extension-next').click({ timeout: 2000 });
      await walletPage.getByTestId('pin-extension-done').click({ timeout: 2000 });
      console.log('[SETUP] ✓ Completed pin extension flow');
    } catch {}
    
    console.log('[SETUP] ==========================================');
    console.log('[SETUP] ✅ WALLET IMPORT COMPLETED SUCCESSFULLY!');
    console.log('[SETUP] ==========================================');
    
  } catch (error) {
    console.error('[SETUP] ==========================================');
    console.error('[SETUP] ❌ SETUP FAILED:', error.message);
    console.error('[SETUP] Error stack:', error.stack);
    console.error('[SETUP] Current URL:', walletPage.url());
    console.error('[SETUP] ==========================================');
    throw error;
  }
});
