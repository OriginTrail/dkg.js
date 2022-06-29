const DKG = require('./index');

const OT_NODE_HOSTNAME = '0.0.0.0';
const OT_NODE_PORT = '8900';

const dkg = new DKG({ endpoint: OT_NODE_HOSTNAME, port: OT_NODE_PORT, useSSL: false, loglevel: 'trace' }, {
    privateKey: "02b39cac1532bef9dba3e36ec32d3de1e9a88f1dda597d3ac6e2130aed9adc4e",
    publicKey: "0xd6879C0A03aDD8cFc43825A42a3F3CF44DB7D2b9",
});

async function main() {

    const seed = Math.random().toString();
    const content =
        {
            "@context": "https://schema.org",
            "@type": "Product",
            "seed": seed,
            "description": "0.7 cubic feet countertop microwave. Has six preset cooking categories and convenience features like Add-A-Minute and Child Lock.",
            "name": "Kenmore White 17\" Microwave",
            "image": "kenmore-microwave-17in.jpg",
            "offers": {
                "@type": "Offer",
                "availability": "https://schema.org/InStock",
                "price": "55.00",
                "priceCurrency": "USD"
            }
        }
    const result = await dkg.assets.create(content, {
        keywords: ['13128adwadwda2111231331', "24.06.2022"],
        visibility: 'public',
        tokenAmount: 1,
        holdingTimeInSeconds: 200
    }, {
        privateKey: "02b39cac1532bef9dba3e36ec32d3de1e9a88f1dda597d3ac6e2130aed9adc4e",
        publicKey: "0xd6879C0A03aDD8cFc43825A42a3F3CF44DB7D2b9",
    })
    console.log(JSON.stringify(result, null, 2));
}


main();
