import { publish, defineConfig } from 'test-results-reporter';
import dotenv from 'dotenv';
dotenv.config();

const teamsHookBaseURL = process.env.TEAMS_HOOK_BASE_URL || process.env.TEAMS_HOOK_METAMASK;
const jenkinsUrl = process.env.JENKINS_URL

const targets = [];

// Only add Teams target if webhook URL is configured
if (teamsHookBaseURL) {
  targets.push({
    name: 'teams',
    condition: 'fail',
    inputs: {
      url: teamsHookBaseURL,
      only_failures: true,
      publish: 'test-summary-slim',
      title: 'NeuroWeb MetaMask Integration Tests Report',
      width: 'Full',
    },
    extensions: [
      {
        name: 'quick-chart-test-summary',
      },
      {
        name: 'hyperlinks',
        inputs: {
          links: [
            {
              text: 'MetaMask Tests HTML Report',
              url: `${jenkinsUrl}/view/Tests/job/MetaMask-Tests/MetaMask_20Tests_20Report/*zip*/MetaMask_20Tests_20Report.zip`,
            },
          ],
        },
      },
    ],
  });
}

const config = defineConfig({
  reports: [
    {
      targets: targets,
      results: [
        {
          type: 'junit',
          files: ['./playwright-junit-results.xml'],
        },
      ],
    },
  ],
});

publish({ config });

