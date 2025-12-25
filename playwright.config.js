import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for MetaMask + Neuroweb testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/metamask',
  
  // Maximum time one test can run
  timeout: 120 * 1000,
  
  // Test execution settings
  fullyParallel: false, // MetaMask tests should run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run tests one at a time for MetaMask
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'playwright-results.json' }],
    ['junit', { outputFile: 'playwright-junit-results.xml' }]
  ],
  
  // Shared settings for all projects
  use: {
    // No baseURL - tests will navigate manually when needed
    // Set baseURL here when testing with a real dApp: baseURL: 'http://localhost:3000'
    headless: !!process.env.CI, // Run headless in CI, headed locally
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Extended timeout for actions
    actionTimeout: 30 * 1000,
    
    // Cloudflare bypass header for E2E testing
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      // Cloudflare E2E bypass header - loaded from .env
      ...(process.env.E2E_CF_HEADER && { 'X-E2E-Auth': process.env.E2E_CF_HEADER }),
    },
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium-metamask',
      use: { 
        ...devices['Desktop Chrome'],
        // Synpress will automatically configure MetaMask extension
      },
    },
  ],

  // Run local dev server before starting tests (optional)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

