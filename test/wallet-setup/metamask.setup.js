import { defineWalletSetup } from '@synthetixio/synpress-cache';

const WALLET_PASSWORD = 'TestPassword123!';
const SEED_PHRASE = 'test test test test test test test test test test test junk';

export default defineWalletSetup(WALLET_PASSWORD, async (context, walletPage) => {
  const isCI = !!process.env.CI;
  
  // Small stabilization delay
  await walletPage.waitForTimeout(isCI ? 2000 : 1000);
  
  // Manual wallet import for better CI compatibility
  try {
    // Step 1: Click "Import existing wallet"
    await walletPage.getByTestId('onboarding-import-wallet').click({ timeout: 15000 });
    await walletPage.waitForTimeout(1000);
    
    // Step 2: Click "I agree" or "No thanks" on metrics
    try {
      await walletPage.getByTestId('metametrics-no-thanks').click({ timeout: 5000 });
    } catch {
      await walletPage.getByTestId('metametrics-i-agree').click({ timeout: 5000 });
    }
    await walletPage.waitForTimeout(1000);
    
    // Step 3: Fill seed phrase
    const words = SEED_PHRASE.split(' ');
    for (let i = 0; i < words.length; i++) {
      await walletPage.getByTestId(`import-srp__srp-word-${i}`).fill(words[i]);
    }
    await walletPage.waitForTimeout(1000);
    
    // Step 4: Confirm seed phrase
    await walletPage.getByTestId('import-srp-confirm').click({ timeout: 15000 });
    await walletPage.waitForTimeout(2000);
    
    // Step 5: Set password
    await walletPage.getByTestId('create-password-new').fill(WALLET_PASSWORD);
    await walletPage.getByTestId('create-password-confirm').fill(WALLET_PASSWORD);
    await walletPage.getByTestId('create-password-terms').check();
    await walletPage.getByTestId('create-password-import').click({ timeout: 15000 });
    await walletPage.waitForTimeout(3000);
    
    // Step 6: Complete onboarding
    await walletPage.getByTestId('onboarding-complete-done').click({ timeout: 15000 });
    await walletPage.waitForTimeout(1000);
    
    // Step 7: Close any popups
    try {
      await walletPage.getByTestId('popover-close').click({ timeout: 2000 });
    } catch {}
    
    try {
      await walletPage.getByTestId('pin-extension-next').click({ timeout: 2000 });
      await walletPage.getByTestId('pin-extension-done').click({ timeout: 2000 });
    } catch {}
    
  } catch (error) {
    console.error('[SETUP FAILED]:', error.message);
    throw error;
  }
});
