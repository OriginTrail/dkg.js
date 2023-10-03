const jsonld = require('jsonld');
const DKG = require('../index.js');

const OT_NODE_HOSTNAME = 'http://localhost';
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const DkgClient = new DKG({
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    blockchain: {
        name: 'hardhat',
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
    };

    divider();

    const nodeInfo = await DkgClient.node.info();
    console.log('======================== NODE INFO RECEIVED');
    console.log(nodeInfo);

    divider();

    const assertions = await DkgClient.assertion.formatGraph(content);
    console.log('======================== ASSERTIONS FORMATTED');
    console.log(JSON.stringify(assertions));

    divider();

    const publicAssertionId = await DkgClient.assertion.getPublicAssertionId(content);
    console.log('======================== PUBLIC ASSERTION ID (MERKLE ROOT) CALCULATED');
    console.log(publicAssertionId);

    divider();

    const publicAssertionSize = await DkgClient.assertion.getSizeInBytes(content);
    console.log('======================== PUBLIC ASSERTION SIZE CALCULATED');
    console.log(publicAssertionSize);

    divider();

    const bidSuggestion = await DkgClient.network.getBidSuggestion(
        publicAssertionId,
        publicAssertionSize,
        { epochsNum: 2 },
    );
    console.log('======================== BID SUGGESTION CALCULATED');
    console.log(bidSuggestion);

    divider();

    const increaseAllowanceResult = await DkgClient.asset.increaseAllowance(bidSuggestion);
    console.log('======================== ALLOWANCE INCREASED');
    console.log(increaseAllowanceResult);

    divider();

    const decreaseAllowanceResult = await DkgClient.asset.decreaseAllowance(bidSuggestion);
    console.log('======================== ALLOWANCE DECREASED');
    console.log(decreaseAllowanceResult);

    divider();

    const setAllowanceResult = await DkgClient.asset.setAllowance(bidSuggestion);
    console.log('======================== ALLOWANCE SET');
    console.log(setAllowanceResult);

    divider();

    const createAssetResult = await DkgClient.asset.create(content, { epochsNum: 2 });
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

    const updateAssetResult = await DkgClient.asset.update(createAssetResult.UAL, {
        public: {
            '@context': ['https://schema.org'],
            '@id': 'uuid:1',
            company: 'TL',
            user: {
                '@id': 'uuid:user:2',
            },
            city: {
                '@id': 'uuid:Nis',
            },
        },
        private: {
            '@context': ['https://schema.org'],
            '@graph': [
                {
                    '@id': 'uuid:user:1',
                    name: 'Adam',
                    lastname: 'Smith',
                    identifier: `${Math.floor(Math.random() * 1e10)}`,
                },
            ],
        },
    });
    console.log('======================== ASSET UPDATED');
    console.log(updateAssetResult);

    divider();

    const getLatestAssetResult = await DkgClient.asset.get(createAssetResult.UAL);
    console.log('======================== ASSET LATEST  RESOLVED');
    console.log(JSON.stringify(getLatestAssetResult, null, 2));

    divider();

    let getLatestFinalizedAssetResult = await DkgClient.asset.get(createAssetResult.UAL, {
        state: 'LATEST_FINALIZED',
    });
    console.log('======================== ASSET LATEST FINALIZED RESOLVED');
    console.log(JSON.stringify(getLatestFinalizedAssetResult, null, 2));

    divider();

    await DkgClient.asset.waitFinalization(createAssetResult.UAL);
    console.log('======================== FINALIZATION COMPLETED');

    divider();

    getLatestFinalizedAssetResult = await DkgClient.asset.get(createAssetResult.UAL, {
        state: 'LATEST_FINALIZED',
    });
    console.log('======================== ASSET LATEST FINALIZED RESOLVED');
    console.log(JSON.stringify(getLatestFinalizedAssetResult, null, 2));

    divider();

    const getFirstStateByIndex = await DkgClient.asset.get(createAssetResult.UAL, {
        state: 0,
    });
    console.log('======================== ASSET FIRST STATE (GET BY STATE INDEX) RESOLVED');
    console.log(JSON.stringify(getFirstStateByIndex, null, 2));

    divider();

    const getSecondStateByIndex = await DkgClient.asset.get(createAssetResult.UAL, {
        state: 1,
    });
    console.log('======================== ASSET SECOND STATE (GET BY STATE INDEX) RESOLVED');
    console.log(JSON.stringify(getSecondStateByIndex, null, 2));

    divider();

    const getFirstStateByHash = await DkgClient.asset.get(createAssetResult.UAL, {
        state: createAssetResult.publicAssertionId,
    });
    console.log('======================== ASSET FIRST STATE (GET BY STATE HASH) RESOLVED');
    console.log(JSON.stringify(getFirstStateByHash, null, 2));

    divider();

    const getSecondStateByHash = await DkgClient.asset.get(createAssetResult.UAL, {
        state: updateAssetResult.publicAssertionId,
    });
    console.log('======================== ASSET SECOND STATE (GET BY STATE HASH) RESOLVED');
    console.log(JSON.stringify(getSecondStateByHash, null, 2));

    let queryResult = await DkgClient.graph.query(
        'construct { ?s ?p ?o } where { ?s ?p ?o . <uuid:1> ?p ?o }',
        'CONSTRUCT',
    );
    console.log('======================== QUERY LOCAL CURRENT RESULT');
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

    queryResult = await DkgClient.graph.query(
        'construct { ?s ?p ?o } where { ?s ?p ?o . <uuid:user:1> ?p ?o }',
        'CONSTRUCT',
        { graphState: 'HISTORICAL', graphLocation: 'LOCAL_KG' },
    );
    console.log('======================== QUERY LOCAL HISTORY RESULT');
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
