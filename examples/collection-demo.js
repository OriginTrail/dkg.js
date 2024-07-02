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
    const content = {
        '@context': ['https://schema.org'],
        '@id': 'uuid:1',
        company: 'OT',
        user: {
            '@id': 'uuid:user:1',
        },
        city: {
            '@id': 'uuid:belgrade',
        },
    };
    const contentArray = new Array(200).fill(content);

    const createCollectionResult = await DkgClient.collection.create(contentArray, '10000000000000000000');
    console.log('======================== KNOWLEDGE COLLECTION CREATED');
    console.log(createCollectionResult);

    divider();
})();
