import DKG from '../index.js';
import { BLOCKCHAIN_IDS, ENVIRONMENTS } from '../constants.js';
import { ethers } from 'ethers';
import 'dotenv/config';

const ENVIRONMENT = ENVIRONMENTS.DEVELOPMENT;
const OT_NODE_HOSTNAME = 'http://localhost';
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

// IMPORTANT: Don't forget to add your PRIVATE_KEY to the .env file.
const DkgClient = new DKG({
    environment: ENVIRONMENT,
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    blockchain: {
        name: BLOCKCHAIN_IDS.HARDHAT_1,
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

    const { deployer, paymasterAddress } = await DkgClient.blockchain.createPaymaster();
    console.log('======================== DEPLOY PAYMASTER');

    await DkgClient.blockchain.addAllowedAddressPaymaster(PUBLIC_KEY, paymasterAddress);
    console.log('======================== WHITELISTED ADDRESS');

    const isAllowed = await DkgClient.blockchain.isAddressAllowedPaymaster(PUBLIC_KEY, paymasterAddress);
    console.log(isAllowed);

    await DkgClient.asset.increaseAllowance(ethers.parseEther('100'), {spenderAddress: paymasterAddress});

    await DkgClient.blockchain.fundPaymaster(paymasterAddress, ethers.parseEther('10'));
    console.log('======================== FUND PAYMASTER');

    const paymasterBalance = await DkgClient.blockchain.getPaymasterBalance(paymasterAddress);
    console.log(paymasterBalance);

    divider();

    console.time('Publish (1 replication, 3 finalizations)');
    const create_result = await DkgClient.asset.create(content, {
        epochsNum: 2,
        minimumNumberOfFinalizationConfirmations: 3,
        minimumNumberOfNodeReplications: 1,
        paymaster: paymasterAddress,
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
