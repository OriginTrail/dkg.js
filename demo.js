const jsonld = require('jsonld');
const DKG = require('./index.js');

const OT_NODE_HOSTNAME = 'http://localhost';
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0xBaF76aC0d0ef9a2FFF76884d54C9D3e270290a43';
const PRIVATE_KEY = '0x9b9af041edc816692276ac3c8f1d5565e3c01ddff80ec982943a29bd8d1d8863';
const blockchain = {
    name: 'ganache',
    publicKey: PUBLIC_KEY,
    privateKey: PRIVATE_KEY,
};

const DkgClient = new DKG({
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    useSSL: true,
    loglevel: 'trace',
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
            '@context': 'http://schema.org',
            '@id': 'http://Max',
            '@type': 'Person',
            name: 'Max',
        },
        {
            '@context': 'http://schema.org',
            '@id': 'http://Max',
            governmentId: '123',
        },
        {
            epochsNum: 2,
            maxNumberOfRetries: 30,
            frequency: 2,
            blockchain,
        },
    );
    console.log('======================== ASSET CREATED');
    console.log(createAssetResult);

    divider();
    let ownerResult = await DkgClient.asset.getOwner(createAssetResult.UAL, {
        blockchain,
    });
    console.log('======================== GET ASSET OWNER');
    console.log(ownerResult);

    divider();

    const getAssetResult = await DkgClient.asset.get(createAssetResult.UAL, {
        validate: true,
        maxNumberOfRetries: 30,
        frequency: 1,
        blockchain,
    });
    console.log('======================== ASSET RESOLVED');
    console.log(JSON.stringify(getAssetResult, null, 2));

    divider();

    const queryResult = await DkgClient.graph.query(
        'construct { ?s ?p ?o } where { ?s ?p ?o . <http://Max> ?p ?o }',
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
    const transferResult = await DkgClient.asset.transfer(createAssetResult.UAL, newOwner, {
        blockchain,
    });
    console.log(`======================== ASSET TRANSFERRED TO ${newOwner}`);
    console.log(transferResult);

    divider();
})();
