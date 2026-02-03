const { publish, defineConfig } = require("test-results-reporter");
const dotenv = require("dotenv");
const path = require("path");

// Load .env from current directory
dotenv.config({ path: path.resolve(__dirname, ".env") });

const teamsHookBaseURL = process.env.EDGE_CASE_TEAMS_HOOK;
const jenkinsUrl = process.env.JENKINS_URL;

// Resolve the JSON file path relative to this script's location
const jsonFilePath = path.resolve(__dirname, "mochawesome-report/edge_cases_mainnet.json");

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
            title: "DKG.js Edge Case Tests - MAINNET",
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
                    text: "Mainnet Edge Case Report",
                    url: `${jenkinsUrl}/job/Edge_Case_Mainnet_dkg.js/Edge_20Case_20Mainnet_20Report/*zip*/Edge_20Case_20Mainnet_20Report.zip`,
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
          files: [`${jsonFilePath}`],
        },
      ],
    },
  ],
});

publish({ config });
