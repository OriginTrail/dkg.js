/**
 * Shared helper functions for MetaMask tests
 */

/**
 * Close any open MetaMask modals by pressing Escape multiple times
 * @param {Page} page - The Playwright page object (usually metamaskPage)
 */
export async function closeModals(page) {
  try {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  } catch {
    // Ignore errors
  }
}

/**
 * Ensure a network is added and switched to
 * @param {Object} metamask - Synpress metamask object
 * @param {Page} metamaskPage - MetaMask page
 * @param {Object} networkConfig - Network configuration
 */
export async function ensureNetwork(metamask, metamaskPage, networkConfig) {
  try {
    await metamask.switchNetwork(networkConfig.name);
    await closeModals(metamaskPage);
  } catch {
    await closeModals(metamaskPage);
    await metamask.addNetwork(networkConfig);
    await closeModals(metamaskPage);
    await metamask.switchNetwork(networkConfig.name);
    await closeModals(metamaskPage);
  }
}

