import { defineWalletSetup } from '@synthetixio/synpress-cache';
import { MetaMask } from '@synthetixio/synpress/playwright';

// Password for the MetaMask wallet
const WALLET_PASSWORD = 'TestPassword123!';

// Seed phrase for testing
const SEED_PHRASE = process.env.METAMASK_SEED_PHRASE || 'test test test test test test test test test test test junk';

/**
 * This setup runs ONCE to initialize MetaMask and cache the browser state
 * Run this with: npm run test:metamask:setup
 */
export default defineWalletSetup(WALLET_PASSWORD, async (context, walletPage) => {
  // Create MetaMask instance
  const metamask = new MetaMask(context, walletPage, WALLET_PASSWORD);
  
  // Import wallet using seed phrase
  await metamask.importWallet(SEED_PHRASE);
  
  console.log('✅ MetaMask wallet imported successfully');
  console.log('✅ Cache will be created for faster test execution');
});

