import DKG from './index.js';
import { BLOCKCHAIN_IDS, ENVIRONMENTS } from './constants.js';
import 'dotenv/config';

const ENVIRONMENT = ENVIRONMENTS.MAINNET;
const OT_NODE_HOSTNAME = 'https://positron.origin-trail.network';
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0x0111ff148a06Eb44Ee0FA65e6c3627433B8dE4Df';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// IMPORTANT: Don't forget to add your PRIVATE_KEY to the .env file.
const DkgClient = new DKG({
    environment: ENVIRONMENT,
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    blockchain: {
        name: BLOCKCHAIN_IDS.NEUROWEB_MAINNET,
        publicKey: PUBLIC_KEY,
        privateKey: PRIVATE_KEY,
    },
    maxNumberOfRetries: 300,
    frequency: 2,
    contentType: 'all',
    nodeApiVersion: '/v1',
});

function divider() {
    console.log('==================================================');
    console.log('==================================================');
    console.log('==================================================');
}

(async () => {
    const content = {
        public: {
            '@context': 'https://www.schema.org',
            '@id': 'urn:us-cities:info:new-york',
            '@type': 'City',
            name: 'New York',
            state: 'New York City',
            population: '8,336,817',
            area: '468.9 sq mi',
        },
        private: {
            '@context': 'https://www.schema.org',
            '@id': 'urn:us-cities:data:new-york',
            '@type': 'CityPrivateData',
            crimeRate: 'Low',
            averageIncome: '$63,998',
            infrastructureScore: '8.5',
            relatedCities: [
                { '@id': 'urn:us-cities:info:los-angeles', name: 'Los Angeles' },
                { '@id': 'urn:us-cities:info:chicago', name: 'Chicago' },
            ],
        },
    };

    const nodeInfo = await DkgClient.node.info();
    console.log('======================== NODE INFO RECEIVED');
    console.log(nodeInfo);

    divider();

    const create_result = await DkgClient.asset.create(content, {
        epochsNum: 2,
        minimumNumberOfFinalizationConfirmations: 3,
        minimumNumberOfNodeReplications: 1,
    });

    if (!create_result) {
        throw new Error('Knowledge Asset was not published successfully');
      }

    console.log(JSON.stringify(create_result));

    divider();

    const get_result = await DkgClient.asset.get(create_result.UAL, {
        contentType: 'all',
    });
    console.log('======================== ASSET GET');
    console.log(get_result);

    divider();

    const publishFinalityResult = await DkgClient.graph.publishFinality(create_result.UAL);
    console.log('======================== ASSET FINALITY');
    console.log(publishFinalityResult);

    divider();
    const queryOperationResult = await DkgClient.graph.query(
        `
        PREFIX schema: <http://schema.org/>
        SELECT ?s ?stateName
        WHERE {
            ?s schema:state ?stateName .
            }
            `,
        'SELECT',
    );

    if (!queryOperationResult?.data || queryOperationResult.data.length === 0) {
        throw new Error('Query returned no results.');
      }

    console.log('======================== ASSET QUERY');
    console.log(queryOperationResult);
})();
