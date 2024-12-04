import DKG from '../index';

const OT_NODE_HOSTNAME = 'localhost';
const OT_NODE_PORT = '8903';

// initialize connection to your DKG Node
let options = { endpoint: OT_NODE_HOSTNAME, port: OT_NODE_PORT, };
const dkg = new DKG(options);

async function main() {
    console.log('============ DKG-Client v6 Demo ===================');

    options = {
        operation: 'PUBLISH',
        metadata: {
            type: 'Product',
            issuer: '0x4609ffd1d9bc8ebeeb048834721dbe43e420e528',
            visibility: 'public',
            keywords: ['24.06.2022', 'awdaawd8'],
            dataRootId: 'https://origintrail.io/default-data-id',
        },
        data: [
            '<https://origintrail.io/default-data-id> <http://schema.org/aggregateRating> _:c14n5 .',
            '<https://origintrail.io/default-data-id> <http://schema.org/offers> _:c14n2 .',
        ],
        ual: 'dkg://did.otp.0x174714134abcd13431413413/987654321',
    };

    await dkg.socketPublish(options).then((result) => {
        console.log('============ Publish results ===================');
        console.log(JSON.stringify(result, null, 2));
        console.log('===============================');
    });
}

/* const keypress = async () => {
    console.log('Press any key...');
    process.stdin.setRawMode(true);
    return new Promise((resolve) =>
        process.stdin.once('data', () => {
            process.stdin.setRawMode(false);
            resolve();
        }),
    );
}; */

main();
