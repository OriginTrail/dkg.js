import DKG from '../index.js';
import { BlockchainIds, Environments } from '../constants.js';
import dotenv from 'dotenv';

dotenv.config();

const ENVIRONMENT = Environments.DEVELOPMENT;
const OT_NODE_HOSTNAME = 'http://localhost';
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0x4770142BB92FbAF3fcBD4da7Dc2E08ACA0B84100';

const DkgClient = new DKG({
    environment: ENVIRONMENT,
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    blockchain: {
        name: BlockchainIds.BASE_TESTNET,
        publicKey: PUBLIC_KEY,
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

    console.time('Publish (1 replication, 3 finalizations)');
    const create_result = await DkgClient.asset.create(content, {
        epochsNum: 2,
        minimumNumberOfFinalizationConfirmations: 3,
        minimumNumberOfNodeReplications: 1,
    });
    console.timeEnd('Publish (1 replication, 3 finalizations)');

    console.log(JSON.stringify(create_result));

    divider();

    console.time('get');
    const get_result = await DkgClient.asset.get(create_result.UAL, {
        contentType: 'all',
    });
    console.log('======================== ASSET GET');
    console.log(get_result);
    console.timeEnd('get');

    divider();

    const publishFinalityResult = await DkgClient.graph.publishFinality(create_result.UAL);
    console.log('======================== ASSET FINALITY');
    console.log(publishFinalityResult);

    divider();

    const queryOperationResult = await DkgClient.graph.query(
        `
        PREFIX SCHEMA: <http://schema.org/>
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
