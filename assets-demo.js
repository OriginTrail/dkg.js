const DkgClient = require('./index');

const OT_NODE_HOSTNAME = '0.0.0.0';
const OT_NODE_PORT = '8910';

// initialize connection to your DKG Node
let options = { endpoint: OT_NODE_HOSTNAME, port: OT_NODE_PORT, useSSL: false, loglevel: 'trace' };
const dkg = new DkgClient(options);

async function main() {
    let result, ual, name, asset;

    console.log('============ DKG-Client v6 Demo ===================')

    await dkg.nodeInfo().then(result => {
        console.log('============ Node info results ===================');
        console.log(JSON.stringify(result, null, 2));
        console.log('===============================');
    });

    options = {
        keywords: ['tracie', 'nft', 'origintrail'],
        visibility: 'public'
    };

    result = await dkg.assets.create({
        "@context": "https://www.schema.org/",
        "@type": "ERC721",
        "asset_data": {
            "properties": {
                "prop1": "value1",
                "prop2": {
                    "abc":"ads",
                    "abs":"adsb"
                },
            },

            "urls": "https://opensea.io/assets/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/8520"

        },
        "keywords": [
            "tracie",
            "origintrail",
            "denver",
        ],
        "native_blockchain": "polygon",
        "onchain_data": {
            "contract_address": "0x123",
            "tokenID": "32",
            "tokenURI": "....",
            "owner": "0x12345431",
            "name": "Tracie 101 Updated",
            "symbol": "TRACIE",
            "eventHistory": [{
                "timestamp": "2020-10-12",
                "from": "0x123",
                "to": "0x343",
                "event": "Transfer",
            },
                {
                    "timestamp": "2020-09-11",
                    "from": "0x123",
                    "to": "0x343",
                    "event": "Sale",
                    "price": "1.23",
                    "currency": "ETH",
                }

            ]
        },
        "erc721_metadata": {
            "title": "Asset Metadata",
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Identifies the asset to which this NFT represents"
                },
                "description": {
                    "type": "string",
                    "description": "Describes the asset to which this NFT represents"
                },
                "image": {
                    "type": "string",
                    "description": "A URI pointing to a resource with mime type image/* representing the asset to which this NFT represents. Consider making any images at a width between 320 and 1080 pixels and aspect ratio between 1.91:1 and 4:5 inclusive."
                }
            }
        },
        "linkedTo": [
            "ual1",
            "ual2",
        ],
        "proof": {
            "signature": "sa9disa9das9d",
            "hash": "sa9disa9das9d",
            "public_key": "0x14356745324523",
        }
    },options)
    ual = result.data.metadata.UALs[0];
    console.log(`Created UAL is ${ual}`)

    const states = await dkg.assets.getStateCommitHashes(ual);
    asset = await dkg.assets.get(ual);

    name = await asset.data.native_blockchain;
    console.log(`Owner of UAL ${ual} is ${name}`)

    options = {
        keywords: ['tracie', 'nft', 'origintrail'],
        visibility: 'public',
    };

    await dkg.assets.update({
        "@context": "https://www.schema.org/",
        "@type": "ERC721",
        "asset_data": {
            "properties": {
                "prop1": "value1",
                "prop2": {
                    "abc":"ads",
                    "abs":"adsb"
                },
            },

            "urls": "https://opensea.io/assets/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/8520"

        },
        "keywords": [
            "tracie",
            "origintrail",
            "denver",
        ],
        "native_blockchain": "polygon",
        "onchain_data": {
            "contract_address": "0x123",
            "tokenID": "32",
            "tokenURI": "....",
            "owner": "0x12345431",
            "name": "Tracie 101 Updated",
            "symbol": "TRACIE",
            "eventHistory": [{
                "timestamp": "2020-10-12",
                "from": "0x123",
                "to": "0x343",
                "event": "Transfer",
            },
                {
                    "timestamp": "2020-09-11",
                    "from": "0x123",
                    "to": "0x343",
                    "event": "Sale",
                    "price": "1.23",
                    "currency": "ETH",
                }

            ]
        },
        "erc721_metadata": {
            "title": "Asset Metadata",
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Identifies the asset to which this NFT represents"
                },
                "description": {
                    "type": "string",
                    "description": "Describes the asset to which this NFT represents"
                },
                "image": {
                    "type": "string",
                    "description": "A URI pointing to a resource with mime type image/* representing the asset to which this NFT represents. Consider making any images at a width between 320 and 1080 pixels and aspect ratio between 1.91:1 and 4:5 inclusive."
                }
            }
        },
        "linkedTo": [
            "ual1",
            "ual2",
        ],
        "proof": {
            "signature": "sa9disa9das9d",
            "hash": "sa9disa9das9d",
            "public_key": "0x14356745324523",
        }
    }, ual, options)

    name = await asset.data.name.valueOf;
    console.log(`New owner of UAL ${ual} is ${name.toString()}`)

    console.log("That's all folks");
    process.exit(0);
}

main();
