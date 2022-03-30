const DkgClient = require('./index');

const OT_NODE_HOSTNAME = '0.0.0.0';
const OT_NODE_PORT = '8900';

// initialize connection to your DKG Node
let options = { endpoint: OT_NODE_HOSTNAME, port: OT_NODE_PORT, useSSL: false, loglevel: 'trace' };
const dkg = new DkgClient(options);

async function main() {

    console.log('============ DKG-Client v6 Demo ===================')

    await dkg.nodeInfo().then(result => {
        console.log('============ Node info results ===================');
        console.log(JSON.stringify(result, null, 2));
        console.log('===============================');
    } );

    await keypress();

    options = {
        filepath: './kg-example.json',
        keywords: ['Product', 'Executive Objects', 'ACME'],
        visibility: 'public'
    };

    await dkg.publish(options).then((result) => {
        console.log('============ Publish results ===================');
        console.log(JSON.stringify(result, null, 2));
        console.log('===============================');
    });

    await keypress();

    options = {
        ids: [
            '9f388253151d743a36ed2e06d3466949fab2190d09acafc36d973f4f1bbc74f3'
        ]
    };

    await dkg.resolve(options).then((result) => {
        console.log('============ Resolve results ===================');
        console.log(JSON.stringify(result, null, 2));
        console.log('===============================');
    });

    await keypress();

    // search assertions
    options = { query: 'acme', resultType: 'assertions' };
    await dkg.search(options).then((result) => {
        console.log('============ Search assertions results ===================');
        console.log(JSON.stringify(result, null, 2));
        console.log('===============================');
    });

    await keypress();

    // search entities
    options = { query: 'acme', resultType: 'entities' };
    await dkg.search(options).then((result) => {
        console.log('============ Search entities results ===================');
        console.log(JSON.stringify(result, null, 2));
        console.log('===============================');
    });

    await keypress();

    options = {
        query: `PREFIX schema: <http://schema.org/>
            construct { ?s ?p ?o}
            WHERE { 
                GRAPH ?g {?s ?p ?o .
                    ?s schema:offers / schema:seller/ schema:name "Executive Objects" .
                }
            }`
    };

    await dkg.query(options).then((result) => {
        console.log('============ Query results ===================');
        console.log(JSON.stringify(result, null, 2));
        console.log('===============================');
    });

    await keypress();

    options = {
        nquads: [
            '<did:dkg:43a5f8c55600a36882f9bac7c69c05a3e0edd1293b56b8024faf3a29d8157435> <http://schema.org/hasDataHash> \"019042b4b5cb5701579a4fd8e339bed0fa983b06920ed8cd4d5864ffcb01c801\" .',
            '<did:dkg:43a5f8c55600a36882f9bac7c69c05a3e0edd1293b56b8024faf3a29d8157435> <http://schema.org/hasIssuer> \"0xbd084ab97c704fe4a6d620cb7c30c0be0366646f\" .'
        ],
    };
    await dkg.validate(options).then((result) => {
        console.log('============ Validate results ===================');
        console.log(JSON.stringify(result, null, 2));
        console.log('===============================');
    });

    console.log("That's all folks");
    process.exit(0);
}

const keypress = async () => {
    console.log('Press any key...')
    process.stdin.setRawMode(true)
    return new Promise(resolve => process.stdin.once('data', () => {
        process.stdin.setRawMode(false)
        resolve()
    }))
}

main();
