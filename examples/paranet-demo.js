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

    /**/
    divider();

    let content = {
        public: {
            '@context': ['https://schema.org'],
            '@id': 'uuid:1',
            company: 'ParanetOperator',
            user: {
                '@id': 'uuid:user:1',
            },
            city: {
                '@id': 'uuid:belgrade',
            },
        }
    };

    divider();

    const paranetAssetResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== PARANET ASSET CREATED');
    console.log(paranetAssetResult);

    divider();
    /**/

    // Paranet testing
    const paranetOptions = {
        paranetName: 'FirstParanet',
        paranetDescription: 'First ever paranet on DKG!',
        tracToNeuroRation: 5,
        tracTarget: 1200,
        operatorRewardPercentage: 10,
    };
    const paranetUAL = 'did:dkg:hardhat2:31337/0x8aafc28174bb6c3bdc7be92f18c2f134e876c05e/1';
    const paranetRegistered = await DkgClient.paranet.create(paranetAssetResult.UAL, paranetOptions);
    console.log('======================== PARANET REGISTERED');
    console.log(paranetRegistered);
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
    console.log('======================== ASSET CREATED TO PARANET');
    console.log(createAssetResult);

    divider();

    const getAssetResult = await DkgClient.asset.get(createAssetResult.UAL);
    console.log('======================== ASSET RESOLVED');
    console.log(JSON.stringify(getAssetResult, null, 2));

    divider();

    const updateAssetResult = await DkgClient.asset.update(createAssetResult.UAL, {
        public: {
            '@context': ['https://schema.org'],
            '@id': 'uuid:1',
            company: 'TL',
            user: {
                '@id': 'uuid:user:2',
            },
            city: {
                '@id': 'uuid:Nis',
            },
        },
        private: {
            '@context': ['https://schema.org'],
            '@graph': [
                {
                    '@id': 'uuid:user:1',
                    name: 'Adam',
                    lastname: 'Smith',
                    identifier: `${Math.floor(Math.random() * 1e10)}`,
                },
            ],
        },
    });
    console.log('======================== ASSET UPDATED');
    console.log(updateAssetResult);

    divider();

    const getLatestAssetResult = await DkgClient.asset.get(createAssetResult.UAL);
    console.log('======================== ASSET LATEST  RESOLVED');
    console.log(JSON.stringify(getLatestAssetResult, null, 2));

    divider();

    let getLatestFinalizedAssetResult = await DkgClient.asset.get(createAssetResult.UAL, {
        state: 'LATEST_FINALIZED',
    });
    console.log('======================== ASSET LATEST FINALIZED RESOLVED');
    console.log(JSON.stringify(getLatestFinalizedAssetResult, null, 2));

    divider();

    await DkgClient.asset.waitFinalization(createAssetResult.UAL);
    console.log('======================== FINALIZATION COMPLETED');

    divider();

    getLatestFinalizedAssetResult = await DkgClient.asset.get(createAssetResult.UAL, {
        state: 'LATEST_FINALIZED',
    });
    console.log('======================== ASSET LATEST FINALIZED RESOLVED');
    console.log(JSON.stringify(getLatestFinalizedAssetResult, null, 2));

    divider();

    const getFirstStateByIndex = await DkgClient.asset.get(createAssetResult.UAL, {
        state: 0,
    });
    console.log('======================== ASSET FIRST STATE (GET BY STATE INDEX) RESOLVED');
    console.log(JSON.stringify(getFirstStateByIndex, null, 2));

    divider();

    const getSecondStateByIndex = await DkgClient.asset.get(createAssetResult.UAL, {
        state: 1,
    });
    console.log('======================== ASSET SECOND STATE (GET BY STATE INDEX) RESOLVED');
    console.log(JSON.stringify(getSecondStateByIndex, null, 2));

    divider();

    const getFirstStateByHash = await DkgClient.asset.get(createAssetResult.UAL, {
        state: createAssetResult.publicAssertionId,
    });
    console.log('======================== ASSET FIRST STATE (GET BY STATE HASH) RESOLVED');
    console.log(JSON.stringify(getFirstStateByHash, null, 2));

    divider();

    const getSecondStateByHash = await DkgClient.asset.get(createAssetResult.UAL, {
        state: updateAssetResult.publicAssertionId,
    });
    console.log('======================== ASSET SECOND STATE (GET BY STATE HASH) RESOLVED');
    console.log(JSON.stringify(getSecondStateByHash, null, 2));

    let queryResult = await DkgClient.graph.query(
        'construct { ?s ?p ?o } where { ?s ?p ?o . <uuid:1> ?p ?o }',
        'CONSTRUCT',
    );
    console.log('======================== QUERY LOCAL CURRENT RESULT');
    console.log(
        JSON.stringify(
            await jsonld.fromRDF(queryResult.data, {
                algorithm: 'URDNA2015',
                format: 'application/n-quads',
            }),
            null,
            2,
        ),
    );

    divider();

    queryResult = await DkgClient.graph.query(
        'construct { ?s ?p ?o } where { ?s ?p ?o . <uuid:user:1> ?p ?o }',
        'CONSTRUCT',
        { graphState: 'HISTORICAL', graphLocation: 'LOCAL_KG' },
    );
    console.log('======================== QUERY LOCAL HISTORY RESULT');
    console.log(
        JSON.stringify(
            await jsonld.fromRDF(queryResult.data, {
                algorithm: 'URDNA2015',
                format: 'application/n-quads',
            }),
            null,
            2,
        ),
    );

    divider();

    const newOwner = '0x2ACa90078563133db78085F66e6B8Cf5531623Ad';
    const transferResult = await DkgClient.asset.transfer(createAssetResult.UAL, newOwner);
    console.log(`======================== ASSET TRANSFERRED TO ${newOwner}`);
    console.log(transferResult);

    divider();
})();
