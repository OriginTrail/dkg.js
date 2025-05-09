import DKG from '../index.js';
import { BLOCKCHAIN_IDS } from '../constants/constants.js';
import 'dotenv/config';

const OT_NODE_HOSTNAME = 'http://localhost';
const OT_NODE_PORT = '8900';
const BLOCKCHAIN_NAME = BLOCKCHAIN_IDS.HARDHAT_1;

// IMPORTANT: Don't forget to add your PRIVATE_KEY to the .env file.
const DkgClient = new DKG({
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    blockchain: {
        name: BLOCKCHAIN_NAME,
        privateKey: process.env.PRIVATE_KEY,
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
            state: 'New York',
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

    console.log(create_result);

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
    console.log('======================== ASSET QUERY');
    console.log(queryOperationResult);
})();
