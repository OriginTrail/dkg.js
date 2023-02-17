const jsonld = require('jsonld');
const DKG = require('./index.js');

const OT_NODE_HOSTNAME = 'http://localhost';
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0xBaF76aC0d0ef9a2FFF76884d54C9D3e270290a43';
const PRIVATE_KEY = '0x9b9af041edc816692276ac3c8f1d5565e3c01ddff80ec982943a29bd8d1d8863';

const DkgClient = new DKG({
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    blockchain: {
        name: 'ganache',
        publicKey: PUBLIC_KEY,
        privateKey: PRIVATE_KEY,
    },
    maxNumberOfRetries: 30,
    frequency: 2,
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

    const queryResult = await DkgClient.graph.query(
        'construct { ?s ?p ?o } where { ?s ?p ?o . <uuid:user:1> ?p ?o }',
        'CONSTRUCT',
    );
    console.log('======================== QUERY RESULT');
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
