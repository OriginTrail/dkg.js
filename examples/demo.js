const jsonld = require('jsonld');
const DKG = require('../index.js');

const OT_NODE_HOSTNAME = 'http://localhost';
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const DkgClient = new DKG({
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    blockchain: {
        name: 'hardhat',
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

    const createAssetResult = await DkgClient.asset.create(
        {
            public: {
                '@context': ['https://schema.org'],
                '@id': 'uuid:1',
                company: 'OT',
                user: {
                    '@id': 'uuid:user:1',
                },
                city: {
                    '@id': 'uuid:belgrade',
                },
            },
            private: {
                '@context': ['https://schema.org'],
                '@graph': [
                    {
                        '@id': 'uuid:user:1',
                        name: 'Adam',
                        lastname: 'Smith',
                    },
                    {
                        '@id': 'uuid:belgrade',
                        title: 'Belgrade',
                        postCode: '11000',
                    },
                ],
            },
        },
        { epochsNum: 2 },
    );
    console.log('======================== ASSET CREATED');
    console.log(createAssetResult);

    divider();

    const ownerResult = await DkgClient.asset.getOwner(createAssetResult.UAL);
    console.log('======================== GET ASSET OWNER');
    console.log(ownerResult);

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

    let getLatestAssetResult = await DkgClient.asset.get(createAssetResult.UAL);
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
        'construct { ?s ?p ?o } where { ?s ?p ?o . <uuid:1> ?p ?o }',
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
