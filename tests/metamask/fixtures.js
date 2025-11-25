import { metaMaskFixtures } from '@synthetixio/synpress/playwright';
import basicSetup from '../../test/wallet-setup/metamask.setup.js';

/**
 * Export test with MetaMask fixtures
 * Uses the wallet setup from test/wallet-setup/metamask.setup.js
 */
export const test = metaMaskFixtures(basicSetup);
export { expect } from '@playwright/test';

