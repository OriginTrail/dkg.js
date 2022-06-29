const DkgClient = require('./index');

const OT_NODE_HOSTNAME = 'v6-devnet-node-01.origin-trail.network';
const OT_NODE_PORT = '8900';

// initialize connection to your DKG Node
let options = { endpoint: OT_NODE_HOSTNAME, port: OT_NODE_PORT, useSSL: true, loglevel: 'trace' };
const dkg = new DkgClient(options);

async function main() {
    let result, ual, name, asset;

    console.log('============ DKG-Client v6 Demo ===================')

    await dkg.nodeInfo().then(result => {
        console.log('============ Node info results ===================');
        console.log(JSON.stringify(result, null, 2));
        console.log('===============================');
    });
    //
    //
    //
    // options = {
    //     keywords: ['test1'],
    //     visibility: 'public'
    // };
    //
    // result = await dkg.assets.create(
    //     {
    //         "@context": "https://schema.org",
    //         "@type": "Product",
    //         "@id": "45674764345",
    //         "description": "Bob Metcalfe's T-Shirt by OriginTrail.",
    //         "name": "Obey the Metcalfe's law T-Shirt",
    //         "image": "URL",
    //         "color": "white",
    //         "manufacturer": "dkg://did.ganache.testnet.0xA99754D3634B8Be489F50F69F728c3d1fEB1fcce/123545678912354567891",
    //         "material": "Cotton",
    //         "size": "L",
    //         "isRelatedTo": "dkg://did.ganache.testnet.0xA99754D3634B8Be489F50F69F728c3d1fEB1fcce/99998888",
    //         "number": "043"
    //
    //     }
    // ,options)
    // ual = result.data.metadata.UAL;
    // console.log(`Created UAL is ${ual}`)

    // asset = await dkg.assets.get('dkg://did.ganache.testnet.0xA99754D3634B8Be489F50F69F728c3d1fEB1fcce/6666666');

    // console.log(asset.toString());

    options = { query: 'demo', resultType: 'entities' };
    await dkg.search(options, cb)

    console.log("That's all folks");
    process.exit(0);
}

function cb(results) {
    console.log(results);
    // use the results here
}

main();
