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
            title: 'Testnet Gnosis Knowledge Asset Publish/Query Test Report',
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
                    text: 'Testnet Gnosis HTML Report',
                    url: 'https://titan.dplcenter.xyz/view/Tests/job/Testnet-Publish-Query-Get-Knowledge-Asset/Gnosis_20Testnet_20Report/*zip*/Gnosis_20Testnet_20Report.zip',
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
          files: ['./mochawesome-report/testnet_gnosis.json'],
        },
      ],
    },
  ],
});

publish({ config });
