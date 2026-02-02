const { publish, defineConfig } = require("test-results-reporter");
const dotenv = require("dotenv");
const path = require("path");

// Load .env from agent directory
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const teamsHookBaseURL = process.env.PHARMAGENESIS_Teams_Hook;
const jenkinsUrl = process.env.JENKINS_URL;

// Resolve the XML file path relative to this script's location
const xmlFilePath = path.resolve(__dirname, "../../../Pharmagenesis_UI_Tests_Production.xml");

console.log(`Looking for XML file at: ${xmlFilePath}`);

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
            title: "Pharmagenesis UI Tests Report - PRODUCTION",
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
                    text: "Production HTML Report",
                    url: `${jenkinsUrl}/job/Pharmagenesis/lastSuccessfulBuild/Pharmagenesis_20Production_20Test_20Report/*zip*/Pharmagenesis_20Production_20Test_20Report.zip`,
                  },
                ],
              },
            },
          ],
        },
      ],
      results: [
        {
          type: "junit",
          files: [xmlFilePath],
        },
      ],
    },
  ],
});

publish({ config });

