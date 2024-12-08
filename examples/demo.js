import jsonld from 'jsonld';
import DKG from '../index.js';

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
    nodeApiVersion: '/v1',
});

function divider() {
    console.log('==================================================');
    console.log('==================================================');
    console.log('==================================================');
}

(async () => {
    // const content = {
    //     public: `<uuid:1> <http://schema.org/city> <uuid:nis> .
    //     <uuid:3> <http://schema.org/company> "TL" .`,
    //     private: `<uuid:2> <http://schema.org/city> <uuid:belgrade> .
    // <uuid:2> <http://schema.org/company> "OT" .
    // <uuid:2> <http://schema.org/user> <uuid:user:1> .
    // <uuid:3> <http://schema.org/user> <uuid:user:1> .

    // `,
    // };
    const content = {
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
                {
                    problem: 'empty',
                },
                {
                    solution: 'generate',
                },
            ],
        },
    };

    // divider();

    const nodeInfo = await DkgClient.node.info();
    console.log('======================== NODE INFO RECEIVED');
    console.log(nodeInfo);

    divider();

    const createAssetResult = await DkgClient.asset.create(content, {
        epochsNum: 2,
        tokenAmount: '100',
        minimumNumberOfNodeReplications: 1,
    });
    console.log('======================== ASSET CREATED');
    console.log(createAssetResult);

    divider();

    const createCollectionResult = await DkgClient.graph.create(content, {
        epochsNum: 2,
        tokenAmount: '100',
        minimumNumberOfNodeReplications: 1,
    });
    console.log('======================== ASSET CREATED');
    console.log(createCollectionResult);

    divider();

    const getOperationResult = await DkgClient.graph.get(createCollectionResult.UAL);
    console.log('======================== ASSET GET');
    console.log(getOperationResult);

    divider();

    const queryOperationResult = await DkgClient.graph.query(
        `select ?s ?p ?o where { ?s ?p ?o }`,
        'SELECT',
    );
    console.log('======================== ASSET QUERY');
    console.log(queryOperationResult);

    divider();
})();
