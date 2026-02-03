const { publish, defineConfig } = require("test-results-reporter");
const dotenv = require("dotenv");
const path = require("path");

// Load .env from current directory
dotenv.config({ path: path.resolve(__dirname, ".env") });

const teamsHookBaseURL = process.env.EDGE_CASE_TEAMS_HOOK;
const buildUrl = process.env.BUILD_URL;

// Resolve the JSON file path relative to this script's location
const jsonFilePath = path.resolve(__dirname, "mochawesome-report/edge_cases_testnet.json");

console.log(`Looking for JSON file at: ${jsonFilePath}`);

const config = defineConfig({
  reports: [
    {
      targets: [
        {
          name: "teams",
          condition: "fail",
          inputs: {
            url: teamsHookBaseURL,
            only_failures: false,
            publish: "test-summary",
            title: "DKG.js Edge Case Tests - TESTNET",
            width: "Full",
          },
          extensions: [
            {
              name: "quick-chart-test-summary",
            },
            {
              name: "hyperlinks",
              inputs: {
                links: [
                  {
                    text: "Testnet Edge Case Report",
                    url: `${buildUrl}artifact/mochawesome-report/edge_cases_testnet.html`,
                  },
                ],
              },
            },
          ],
        },
      ],
      results: [
        {
          type: "mocha",
          files: [jsonFilePath],
        },
      ],
    },
  ],
});

publish({ config });
