import jsonld from 'jsonld';
import DKG from '../index.js';

import {
    PARANET_NODES_ACCESS_POLICY,
    PARANET_MINERS_ACCESS_POLICY,
    BLOCKCHAIN_IDS,
    ENVIRONMENTS,
} from '../constants.js';

const ENVIRONMENT = ENVIRONMENTS.DEVELOPMENT;
const OT_NODE_HOSTNAME = 'http://localhost';
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const DkgClient = new DKG({
    environment: ENVIRONMENT,
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    blockchain: {
        name: BLOCKCHAIN_IDS.HARDHAT_1,
        publicKey: PUBLIC_KEY,
        privateKey: PRIVATE_KEY,
    },
    maxNumberOfRetries: 30,
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
    divider();

    const nodeInfo = await DkgClient.node.info();
    console.log('======================== NODE INFO RECEIVED');
    console.log(nodeInfo);

    divider();

    let content = {
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

    divider();

    const paranetCollectionResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== PARANET KNOWLEDGE Collection CREATED');
    console.log(paranetCollectionResult);

    divider();

    const paranetOptions = {
        paranetName: 'FirstParanet',
        paranetDescription: 'First ever paranet on DKG!',
        tracToNeuroEmissionMultiplier: 5,
        incentivizationProposalVotersRewardPercentage: 12.0,
        operatorRewardPercentage: 10.0,
        paranetNodesAccessPolicy: PARANET_NODES_ACCESS_POLICY.OPEN,
        paranetMinersAccessPolicy: PARANET_MINERS_ACCESS_POLICY.OPEN,
    };

    const paranetRegistered = await DkgClient.paranet.create(
        paranetCollectionResult.UAL,
        paranetOptions,
    );
    console.log('======================== PARANET REGISTERED');
    console.log(paranetRegistered);
    divider();

    // const paranetDeployed = await DkgClient.paranet.deployIncentivesContract(
    //     paranetCollectionResult.UAL,
    //     'Neuroweb',
    //     paranetOptions,
    // );
    // console.log('======================== PARANET INCENTIVES POOL DEPLOYED');
    // console.log(paranetDeployed);
    // divider();

    content = {
        public: {
            '@context': ['https://schema.org'],
            '@id': 'uuid:6',
            company: 'ServiceExample',
            user: {
                '@id': 'uuid:user:6',
            },
            city: {
                '@id': 'uuid:Ljubljana',
            },
        },
    };

    const createServiceKCResult = await DkgClient.asset.create(content, { epochsNum: 2 });

    const submitToParanetResult = await DkgClient.asset.submitToParanet(
        createServiceKCResult.UAL,
        paranetCollectionResult.UAL,
    );

    const paranetServiceResult = await DkgClient.paranet.createService(createServiceKCResult.UAL, {
        paranetServiceName: 'FKPS',
        paranetServiceDescription: 'Fast Knowledge Processing Service',
        paranetServiceAddresses: [],
    });

    console.log('======================== PARANET SERVICE CREATED');
    console.log(paranetServiceResult);
    divider();

    const addServiceToParanet = await DkgClient.paranet.addServices(paranetCollectionResult.UAL, [
        createServiceKCResult.UAL,
    ]);
    console.log('======================== SERVICE ADDED TO PARANET');
    console.log(addServiceToParanet);
    divider();

    content = {
        public: {
            '@context': ['https://schema.org'],
            '@id': 'uuid:2',
            company: 'KA-Company',
            user: {
                '@id': 'uuid:user:2',
            },
            city: {
                '@id': 'uuid:budapest',
            },
        },
    };
    const createCollectionResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== KNOWLEDGE Collection CREATED TO PARANET');
    console.log(createCollectionResult);
    divider();

    const submitToParanet2 = await DkgClient.asset.submitToParanet(
        createCollectionResult.UAL,
        paranetCollectionResult.UAL,
    );
    console.log('======================== SECOND KC ADDED TO PARANET');
    console.log(submitToParanet2);
    divider();

    content = {
        public: {
            '@context': ['https://schema.org'],
            '@id': 'uuid:3',
            company: 'KA1-Company',
            user: {
                '@id': 'uuid:user:3',
            },
            city: {
                '@id': 'uuid:Belgrade',
            },
        },
    };
    const createSecondCollectionResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== SECOND KNOWLEDGE Collection CREATED');
    console.log(createSecondCollectionResult);
    divider();

    const submitResult = await DkgClient.asset.submitToParanet(
        createSecondCollectionResult.UAL,
        paranetCollectionResult.UAL,
    );
    console.log('======================== SECOND KC ADDED TO PARANET');
    console.log(submitResult);
    divider();

    console.log(
        '======================== IS MINER : ',
        await DkgClient.paranet.isKnowledgeMiner(paranetCollectionResult.UAL, {
            roleAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        }),
    );
    console.log(
        '======================== IS OPERATOR : ',
        await DkgClient.paranet.isParanetOperator(paranetCollectionResult.UAL),
    );
    console.log(
        '======================== IS VOTER : ',
        await DkgClient.paranet.isProposalVoter(paranetCollectionResult.UAL, {
            roleAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        }),
    );
    divider();

    let claimable = await DkgClient.paranet.getClaimableMinerReward(paranetCollectionResult.UAL);
    console.log('======================== KC MINER REWARD TO CLAIM');
    console.log(claimable);
    divider();

    claimable = await DkgClient.paranet.getClaimableOperatorReward(paranetCollectionResult.UAL);
    console.log('======================== OPERATOR REWARD TO CLAIM');
    console.log(claimable);
    divider();

    let claimedResult = await DkgClient.paranet.claimMinerReward(paranetCollectionResult.UAL);
    console.log('======================== KC MINER REWARD CLAIMED');
    console.log(claimedResult);
    divider();

    claimedResult = await DkgClient.paranet.claimOperatorReward(paranetCollectionResult.UAL);
    console.log('======================== OPERATOR REWARD CLAIMED');
    console.log(claimedResult);
    divider();

    claimable = await DkgClient.paranet.getClaimableMinerReward(paranetCollectionResult.UAL);
    console.log('======================== KC MINER REWARD TO CLAIM');
    console.log(claimable);
    divider();

    claimable = await DkgClient.paranet.getClaimableOperatorReward(paranetCollectionResult.UAL);
    console.log('======================== OPERATOR REWARD TO CLAIM');
    console.log(claimable);
    divider();

    await DkgClient.asset.waitFinalization(createSecondCollectionResult.UAL);
    console.log('======================== FINALIZATION COMPLETED');
    divider();

    const queryWhereMadrid = `PREFIX schema: <http://schema.org/>
        SELECT DISTINCT ?graphName
        WHERE {
          GRAPH ?graphName {
            ?s schema:city <uuid:uzice> .
          }
        }`;

    let queryResult = await DkgClient.graph.query(queryWhereMadrid, 'SELECT', {
        paranetUAL: paranetCollectionResult.UAL,
    });
    console.log('======================== QUERY PARANET REPO RESULT');
    console.log(queryResult.data);
    divider();

    const federatedQuery = `
    PREFIX schema: <http://schema.org/>
        SELECT DISTINCT ?s ?city1 ?user1 ?s2 ?city2 ?user2 ?company1
        WHERE {
          ?s schema:city ?city1 .
          ?s schema:company ?company1 .
          ?s schema:user ?user1;
        
          SERVICE <${createSecondCollectionResult.UAL}> {
            ?s2 schema:city <uuid:Belgrade> .
            ?s2 schema:city ?city2 .
            ?s2 schema:user ?user2;
          }
        
          filter(contains(str(?city2), "Belgrade"))
        }
    `;

    queryResult = await DkgClient.graph.query(federatedQuery, 'SELECT', {
        graphLocation: paranetCollectionResult.UAL,
    });
    console.log('======================== FEDERATED QUERY RESULT');
    console.log(queryResult.data);
    divider();
})();
