const jsonld = require('jsonld');
const DKG = require('../index.js');

const ENVIRONMENT = 'development';
const OT_NODE_HOSTNAME = 'http://localhost';
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const DkgClient = new DKG({
    environment: ENVIRONMENT,
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    blockchain: {
        name: 'hardhat2',
        publicKey: PUBLIC_KEY,
        privateKey: PRIVATE_KEY,
    },
    maxNumberOfRetries: 30,
    frequency: 2,
    contentType: 'all',
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
            '@context': ['https://schema.org'],
            '@id': 'uuid:1',
            company: 'ParanetOperatorsDAO',
            user: {
                '@id': 'uuid:user:1',
            },
            city: {
                '@id': 'uuid:Belgrade',
            },
        }
    };

    divider();

    const paranetAssetResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== PARANET KNOWLEDGE ASSET CREATED');
    console.log(paranetAssetResult);

    divider();

    const paranetOptions = {
        paranetName: 'FirstParanet',
        paranetDescription: 'First ever paranet on DKG!',
        tracToNeuroEmissionMultiplier: 5,
        incentivizationProposalVotersRewardPercentage: 12.00,
        operatorRewardPercentage: 10.00,
    };
    const paranetRegistered = await DkgClient.paranet.create(paranetAssetResult.UAL, paranetOptions);
    console.log('======================== PARANET REGISTERED');
    console.log(paranetRegistered);
    divider();

    const paranetDeployed = await DkgClient.paranet.deployIncentivesContract(paranetAssetResult.UAL, 'Neuroweb', paranetOptions);
    console.log('======================== PARANET INCENTIVES POOL DEPLOYED');
    console.log(paranetDeployed);
    divider();

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
        }
    };
    const createServiceKAResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== SERVICE KA CREATED');
    console.log(createServiceKAResult);
    divider();

    const paranetServiceUAL = await DkgClient.paranet.createService(createServiceKAResult.UAL, {
        paranetServiceName: 'FKPS',
        paranetServiceDescription: 'Fast Knowledge Processing Service',
        paranetServiceAddresses: [],
    });
    console.log('======================== SERVICE KA CREATED');
    console.log(paranetServiceUAL);
    divider();

    await DkgClient.paranet.addServices(paranetAssetResult.UAL, [ createServiceKAResult.UAL]);
    console.log('======================== SERVICE ADDED TO PARANET');
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
        }
    };
    const createAssetResult = await DkgClient.asset.create(content, { epochsNum: 2, paranetUAL: paranetAssetResult.UAL });
    console.log('======================== KNOWLEDGE ASSET CREATED TO PARANET');
    console.log(createAssetResult);
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
        }
    };
    const createSecondAssetResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== SECOND KNOWLEDGE ASSET CREATED');
    console.log(createSecondAssetResult);
    divider();

    const submitResult = await DkgClient.asset.submitToParanet(createSecondAssetResult.UAL, paranetAssetResult.UAL);
    console.log('======================== SECOND KA ADDED TO PARANET');
    console.log(submitResult);
    divider();

    console.log('======================== IS MINER : ', await DkgClient.paranet.isKnowledgeMiner(paranetAssetResult.UAL, { roleAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' }));
    console.log('======================== IS OPERATOR : ', await DkgClient.paranet.isParanetOperator(paranetAssetResult.UAL));
    console.log('======================== IS VOTER : ', await DkgClient.paranet.isProposalVoter(paranetAssetResult.UAL, { roleAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' }));
    divider();

    let claimable = await DkgClient.paranet.getClaimableMinerReward(paranetAssetResult.UAL);
    console.log('======================== KA MINER REWARD TO CLAIM')
    console.log(claimable);
    divider();

    claimable = await DkgClient.paranet.getClaimableOperatorReward(paranetAssetResult.UAL);
    console.log('======================== OPERATOR REWARD TO CLAIM');
    console.log(claimable);
    divider();

    let claimedResult = await DkgClient.paranet.claimMinerReward(paranetAssetResult.UAL);
    console.log('======================== KA MINER REWARD CLAIMED');
    console.log(claimedResult);
    divider();

    claimedResult = await DkgClient.paranet.claimOperatorReward(paranetAssetResult.UAL);
    console.log('======================== OPERATOR REWARD CLAIMED');
    console.log(claimedResult);
    divider();

    claimable = await DkgClient.paranet.getClaimableMinerReward(paranetAssetResult.UAL);
    console.log('======================== KA MINER REWARD TO CLAIM');
    console.log(claimable);
    divider();

    claimable = await DkgClient.paranet.getClaimableOperatorReward(paranetAssetResult.UAL);
    console.log('======================== OPERATOR REWARD TO CLAIM');
    console.log(claimable);
    divider();

    const updateAssetResult = await DkgClient.asset.update(createSecondAssetResult.UAL, {
        public: {
            '@context': ['https://schema.org'],
            '@id': 'uuid:1',
            company: 'TL',
            user: {
                '@id': 'uuid:user:2',
            },
            city: {
                '@id': 'uuid:Madrid',
            },
        },
    });
    console.log('========================KNOWLEDGE ASSET UPDATED');
    console.log(updateAssetResult);
    divider();

    await DkgClient.asset.waitFinalization(createSecondAssetResult.UAL);
    console.log('======================== FINALIZATION COMPLETED');
    divider();

    await DkgClient.paranet.updateClaimableRewards(paranetAssetResult.UAL);
    console.log('======================== CLAIMABLE REWARDS UPDATED');
    divider();

    const queryWhereMadrid = `PREFIX schema: <http://schema.org/>
        SELECT DISTINCT ?graphName
        WHERE {
          GRAPH ?graphName {
            ?s schema:city <uuid:uzice> .
          }
        }`;

    let queryResult = await DkgClient.graph.query(
        queryWhereMadrid,
        'SELECT',
        { paranetUAL: paranetAssetResult.UAL },
    );
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
        
          SERVICE <${createSecondAssetResult.UAL}> {
            ?s2 schema:city <uuid:Belgrade> .
            ?s2 schema:city ?city2 .
            ?s2 schema:user ?user2;
          }
        
          filter(contains(str(?city2), "Belgrade"))
        }
    `;

    queryResult = await DkgClient.graph.query(
        federatedQuery,
        'SELECT',
        { graphLocation: paranetAssetResult.UAL },
    );
    console.log('======================== FEDERATED QUERY RESULT');
    console.log(queryResult.data);
    divider();
})();
