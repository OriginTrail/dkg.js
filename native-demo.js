const DKG = require('./index');

const OT_NODE_HOSTNAME = '0.0.0.0';
const OT_NODE_PORT = '8910';

// initialize connection to your DKG Node
let options = { endpoint: OT_NODE_HOSTNAME, port: OT_NODE_PORT, useSSL: false, loglevel: 'trace' };
const dkg = new DKG(options);

async function main() {

    const dkg = new DKG({
        endpoint: "0.0.0.0",
        useSSL: false,
        port: 8900,
        loglevel: "trace",
    });

    // SET & GET
    options = {
        keywords: ['13128adwadwda2111231331', "24.06.2022"],
        visibility: 'public',
        "publicKey": "0xd6879C0A03aDD8cFc43825A42a3F3CF44DB7D2b9",
        "privateKey": "0x02b39cac1532bef9dba3e36ec32d3de1e9a88f1dda597d3ac6e2130aed9adc4e"
    };

    const content =
        {
            "@context": "https://schema.org/",
            "@type": "Product",
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "3.5",
                "reviewCount": "11"
            },
            "seed": Math.random().toString(),
            "description": "0.7 cubic feet countertop microwave. Has six preset cooking categories and convenience features like Add-A-Minute and Child Lock.",
            "name": "Kenmore White 17\" Microwave",
            "image": "kenmore-microwave-17in.jpg",
            "offers": {
                "@type": "Offer",
                "availability": "https://schema.org/InStock",
                "price": "55.00",
                "priceCurrency": "USD"
            },
            "review": [
                {
                    "@type": "Review",
                    "author": "Ellie",
                    "datePublished": "2011-04-01",
                    "reviewBody": "The lamp burned out and now I have to replace it.",
                    "name": "Not a happy camper",
                    "reviewRating": {
                        "@type": "Rating",
                        "bestRating": "5",
                        "ratingValue": "1",
                        "worstRating": "1"
                    }
                },
                {
                    "@type": "Review",
                    "author": "Lucas",
                    "datePublished": "2011-03-25",
                    "reviewBody": "Great microwave for the price. It is small and fits in my apartment.",
                    "name": "Value purchase",
                    "reviewRating": {
                        "@type": "Rating",
                        "bestRating": "5",
                        "ratingValue": "4",
                        "worstRating": "1"
                    }
                }
            ]
        }
    const result = await dkg.publish(content, options)
    console.log(JSON.stringify(result, null, 2));
}

main();
