import jsonld from 'jsonld';
import DKG from '../index.js';
import 'dotenv/config';

import {
    PARANET_NODES_ACCESS_POLICY,
    PARANET_MINERS_ACCESS_POLICY,
    BLOCKCHAIN_IDS,
    PARANET_KC_SUBMISSION_POLICY,
} from '../constants/constants.js';

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
            '@context': 'http://www.schema.org',
            '@id': 'urn:paranet:01',
            '@type': 'Paranet',
            name: 'Paranet test',
        },
    };

    divider();

    const paranetCollectionResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== PARANET KNOWLEDGE COLLECTION CREATED');
    console.log(paranetCollectionResult);

    divider();

    // Paranet UAL is a Knowledge Asset UAL (combination of Knowledge Collection UAL and Knowledge Asset token id)
    const paranetUAL = `${paranetCollectionResult.UAL}/1`;
    const paranetOptions = {
        paranetName: 'FirstParanet',
        paranetDescription: 'First ever paranet on DKG!',
        paranetNodesAccessPolicy: PARANET_NODES_ACCESS_POLICY.OPEN,
        paranetMinersAccessPolicy: PARANET_MINERS_ACCESS_POLICY.OPEN,
        paranetKcSubmissionPolicy: PARANET_KC_SUBMISSION_POLICY.OPEN,
    };

    const paranetRegistered = await DkgClient.paranet.create(paranetUAL, paranetOptions);
    console.log('======================== PARANET REGISTERED');
    console.log(paranetRegistered);
    divider();

    const incentivesPoolOptions = {
        tracToTokenEmissionMultiplier: 5,
        operatorRewardPercentage: 10.0,
        incentivizationProposalVotersRewardPercentage: 12.0,
        incentivesPoolName: 'FirstParanetIncentivesPool',
        rewardTokenAddress: '0x0000000000000000000000000000000000000000', // the gas token for the chosen network
    };

    const paranetDeployed = await DkgClient.paranet.deployIncentivesContract(
        paranetUAL,
        incentivesPoolOptions,
    );
    console.log('======================== PARANET INCENTIVES POOL DEPLOYED');
    console.log(paranetDeployed);
    divider();

    const allIncentivesPools = await DkgClient.paranet.getAllIncentivesPools(paranetUAL);
    console.log('======================== ALL PARANET INCENTIVES POOLS');
    console.log(allIncentivesPools);
    divider();

    const incentivesPoolStorageAddressResult =
        await DkgClient.paranet.getIncentivesPoolStorageAddress(paranetUAL, {
            incentivesPoolName: incentivesPoolOptions.incentivesPoolName, // Either incentives pool name or address is required
            incentivesPoolAddress: paranetDeployed.incentivesPoolAddress,
        });
    console.log('======================== PARANET INCENTIVES POOL STORAGE ADDRESS');
    console.log(incentivesPoolStorageAddressResult);
    divider();

    // Fund the incentives pool storage contract - Works on DEVELOPMENT ONLY
    const web3 = await DkgClient.blockchain.getWeb3Instance();
    const incentivesAmount = web3.utils.toWei('100', 'ether');
    const txHash = await web3.eth.sendTransaction({
        from: await DkgClient.blockchain.getWalletAddress(),
        to: incentivesPoolStorageAddressResult.incentivesPoolStorageAddress,
        value: incentivesAmount,
    });
    console.log(
        `======================== INCENTIVES POOL STORAGE CONTRACT FUNDED WITH ${web3.utils.fromWei(
            incentivesAmount,
        )} ETH`,
    );
    console.log(txHash);
    divider();

    content = {
        public: {
            '@context': 'https://www.schema.org',
            '@id': 'urn:us-cities:info:miami',
            '@type': 'City',
            name: 'Miami',
            state: 'Florida',
            population: '2,000,000',
            area: '135.2 sq mi',
        },
        private: {
            '@context': 'https://www.schema.org',
            '@id': 'urn:us-cities:data:miami',
            '@type': 'CityPrivateData',
            crimeRate: 'Low',
            averageIncome: '$100,998',
            infrastructureScore: '7.5',
            relatedCities: [
                { '@id': 'urn:us-cities:info:austin', name: 'Austin' },
                { '@id': 'urn:us-cities:info:seattle', name: 'Seattle' },
            ],
        },
    };

    const createServiceKCResult = await DkgClient.asset.create(content, { epochsNum: 2 });

    // Paranet service UAL is a Knowledge Asset UAL (combination of Knowledge Collection UAL and Knowledge Asset token id)
    const paranetServiceUal = `${createServiceKCResult.UAL}/1`;

    const submitServiceToParanetResult = await DkgClient.asset.submitToParanet(
        paranetServiceUal,
        paranetUAL,
    );

    const paranetServiceResult = await DkgClient.paranet.createService(paranetServiceUal, {
        paranetServiceName: 'FKPS',
        paranetServiceDescription: 'Fast Knowledge Processing Service',
        paranetServiceAddresses: [],
    });

    console.log('======================== PARANET SERVICE CREATED');
    console.log(paranetServiceResult);
    divider();

    const addServiceToParanet = await DkgClient.paranet.addServices(paranetUAL, [
        paranetServiceUal,
    ]);
    console.log('======================== SERVICE ADDED TO PARANET');
    console.log(addServiceToParanet);
    divider();

    content = {
        public: {
            '@context': 'https://www.schema.org',
            '@id': 'urn:us-cities:info:denver',
            '@type': 'City',
            name: 'Denver',
            state: 'Colorado',
            population: '700,000',
            area: '153.3 sq mi',
        },
        private: {
            '@context': 'https://www.schema.org',
            '@id': 'urn:us-cities:data:denver',
            '@type': 'CityPrivateData',
            crimeRate: 'Low',
            averageIncome: '$50,998',
            infrastructureScore: '6.5',
            relatedCities: [
                { '@id': 'urn:us-cities:info:boston', name: 'Boston' },
                { '@id': 'urn:us-cities:info:chicago', name: 'Chicago' },
            ],
        },
    };

    const createCollectionResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== KNOWLEDGE COLLECTION CREATED TO PARANET');
    console.log(createCollectionResult);
    divider();

    const submitToParanetResult = await DkgClient.asset.submitToParanet(
        createCollectionResult.UAL,
        paranetUAL,
    );
    console.log('======================== KNOWLEDGE COLLECTION ADDED TO PARANET');
    console.log(submitToParanetResult);
    divider();

    content = {
        public: {
            '@context': 'https://www.schema.org',
            '@id': 'urn:us-cities:info:dallas',
            '@type': 'City',
            name: 'Dallas',
            state: 'Texas',
            population: '1,343,573',
            area: '386.5 sq mi',
        },
        private: {
            '@context': 'https://www.schema.org',
            '@id': 'urn:us-cities:data:dallas',
            '@type': 'CityPrivateData',
            crimeRate: 'Low',
            averageIncome: '$80,998',
            infrastructureScore: '7.5',
            relatedCities: [
                { '@id': 'urn:us-cities:info:austin', name: 'Austin' },
                { '@id': 'urn:us-cities:info:houston', name: 'Houston' },
            ],
        },
    };
    const createSecondCollectionResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== SECOND KNOWLEDGE COLLECTION CREATED');
    console.log(createSecondCollectionResult);
    divider();

    const submitToParanetResult2 = await DkgClient.asset.submitToParanet(
        createSecondCollectionResult.UAL,
        paranetUAL,
    );
    console.log('======================== SECOND KNOWLEDGE COLLECTION ADDED TO PARANET');
    console.log(submitToParanetResult2);
    divider();

    console.log(
        '======================== IS MINER : ',
        await DkgClient.paranet.isKnowledgeMiner(paranetUAL, {
            incentivesPoolName: incentivesPoolOptions.incentivesPoolName,
        }),
    );
    console.log(
        '======================== IS OPERATOR : ',
        await DkgClient.paranet.isParanetOperator(paranetUAL, {
            incentivesPoolName: incentivesPoolOptions.incentivesPoolName,
        }),
    );
    console.log(
        '======================== IS VOTER : ',
        await DkgClient.paranet.isProposalVoter(paranetUAL, {
            roleAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            incentivesPoolName: incentivesPoolOptions.incentivesPoolName,
        }),
    );
    divider();

    const claimableMinerReward = await DkgClient.paranet.getClaimableMinerReward(paranetUAL, {
        incentivesPoolName: incentivesPoolOptions.incentivesPoolName,
    });
    console.log('======================== KC MINER REWARD TO CLAIM');
    console.log(claimableMinerReward);
    divider();

    const claimableOperatorReward = await DkgClient.paranet.getClaimableOperatorReward(paranetUAL, {
        incentivesPoolName: incentivesPoolOptions.incentivesPoolName,
    });
    console.log('======================== OPERATOR REWARD TO CLAIM');
    console.log(claimableOperatorReward);
    divider();

    const claimedMinerReward = await DkgClient.paranet.claimMinerReward(
        paranetUAL,
        claimableMinerReward,
        {
            incentivesPoolName: incentivesPoolOptions.incentivesPoolName,
        },
    );
    console.log('======================== KC MINER REWARD CLAIMED');
    console.log(claimedMinerReward);
    divider();

    const claimedOperatorReward = await DkgClient.paranet.claimOperatorReward(paranetUAL, {
        incentivesPoolName: incentivesPoolOptions.incentivesPoolName,
    });
    console.log('======================== OPERATOR REWARD CLAIMED');
    console.log(claimedOperatorReward);
    divider();

    // IMPORTANT: For queries to work, you need to add assetSync to your node's .origintrail_noderc file.
    // How to: https://docs.origintrail.io/dkg-v6-previous-version/node-setup-instructions/sync-a-dkg-paranet
    const queryWhereDenver = `
    PREFIX schema: <http://schema.org/>
    SELECT DISTINCT ?graphName
    WHERE {
      GRAPH ?graphName {
        ?s schema:name "Denver" .
      }
    }
    `;

    let queryResult = await DkgClient.graph.query(queryWhereDenver, 'SELECT', {
        paranetUAL: paranetUAL,
    });
    console.log('======================== QUERY PARANET REPO RESULT');
    console.log(queryResult.data);
    divider();

    const federatedQuery = `
    PREFIX schema: <http://schema.org/>
        SELECT DISTINCT ?s ?state1 ?name1 ?s2 ?state2 ?name2 ?population1
        WHERE {
          ?s schema:state ?state1 .
          ?s schema:name ?name1 .
          ?s schema:population ?population1 .

          SERVICE <${paranetUAL}> {
            ?s2 schema:state "Colorado" .
            ?s2 schema:name "Denver" .
            ?s2 schema:state ?state2 .
            ?s2 schema:name ?name2 .
          }

          filter(contains(str(?name2), "Denver"))
        }
    `;

    queryResult = await DkgClient.graph.query(federatedQuery, 'SELECT', {
        graphLocation: paranetUAL,
    });
    console.log('======================== FEDERATED QUERY RESULT');
    console.log(queryResult.data);
    divider();
})();
