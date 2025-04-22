import { publish, defineConfig } from 'test-results-reporter';
import dotenv from 'dotenv';
dotenv.config();

const teamsHookBaseURL = process.env.TEAMS_HOOK;
//const kurjiCvekHook = process.env.KURJI_CVEK_HOOK;

const config = defineConfig({
  reports: [
    {
      targets: [
        {
          name: 'teams',
          condition: 'fail',
          inputs: {
            url: teamsHookBaseURL,
            only_failures: true,
            publish: 'test-summary-slim',
            title: 'NODE 3: Testnet DKG Knowledge Asset Publish/Query Test Report',
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
                    text: 'Testnet Node 3 HTML Report',
                    url: 'https://titan.dplcenter.xyz/view/Tests/job/Publish%20and%20Query%20Knowledge%20Asset/*zip*/node03.zip',
                  },
                ],
              },
            },
          ],
        },
      ],
      results: [
        {
          type: 'mocha',
          files: ['./mochawesome-report/node03_dkg.json'],
        },
      ],
    },
  ],
});

publish({ config });
