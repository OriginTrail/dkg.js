const jsonld = require('jsonld');
const DKG = require('../index.js');

const ENVIRONMENT = 'development';
const OT_NODE_HOSTNAME = 'http://localhost';
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const {
    PARANET_NODES_ACCESS_POLICY,
    PARANET_MINERS_ACCESS_POLICY,
} = require('../constants.js');

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

const NODE2_KEYS = {
    publicKey: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
}

const NODE3_KEYS = {
    publicKey: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6'
}

const NODE4_KEYS = {
    publicKey: '0xe5beaB7853A22f054Ef287EA62aCe7A32528b3eE',
    privateKey: '0x9904da7fe786e5d1f8629b565b688425d78053d4325e746c5ad8ac4328248037'
}

const NODE5_KEYS = {
    publicKey: '0x8A4673B00B04b59CaC44926ABeDa85ed181fA436',
    privateKey: '0xfb07091daf99c1d493820ae8dcbc439b48b13ca844684bb1dcae27c9e680e62b'
}

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

    let content = {
        public: {
            '@context': ['https://schema.org'],
            '@id': 'uuid:1',
            company: 'ParanetOperatorsDAO',
            user: {
                '@id': 'uuid:user:1',
            },
            city: {
                '@id': 'uuid:Belgrade',
            },
        }
    };

    divider();

    const paranetAssetResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== PARANET KNOWLEDGE ASSET CREATED');
    console.log(paranetAssetResult);

    divider();

    const paranetOptions = {
        paranetName: 'FirstParanet',
        paranetDescription: 'First ever paranet on DKG!',
        paranetNodesAccessPolicy: PARANET_NODES_ACCESS_POLICY.CURATED,
        paranetMinersAccessPolicy: PARANET_MINERS_ACCESS_POLICY.CURATED,
    };
    const paranetRegistered = await DkgClient.paranet.create(paranetAssetResult.UAL, paranetOptions);
    console.log('======================== A CURATED PARANET REGISTERED');
    console.log(paranetRegistered);
    divider();

    let identityIds = [1, 2, 3];
    await DkgClient.paranet.addCuratedNodes(paranetAssetResult.UAL, identityIds);
    console.log('======================== ADDED NODES TO A CURATED PARANET');
    let nodes = await DkgClient.paranet.getCuratedNodes(paranetAssetResult.UAL);
    console.log({
        paranetUAL: paranetAssetResult.UAL,
        curatedNodes: nodes
    });
    divider();

    identityIds = [2, 3];
    await DkgClient.paranet.removeCuratedNodes(paranetAssetResult.UAL, identityIds);
    console.log('======================== REMOVED NODES FROM A CURATED PARANET');
    nodes = await DkgClient.paranet.getCuratedNodes(paranetAssetResult.UAL);
    console.log({
        paranetUAL: paranetAssetResult.UAL,
        curatedNodes: nodes
    });
    divider();

    const identityId = 2;
    await DkgClient.paranet.requestCuratedNodeAccess(paranetAssetResult.UAL, { blockchain: NODE2_KEYS });
    await DkgClient.paranet.rejectCuratedNode(paranetAssetResult.UAL, identityId);
    console.log("======================== REJECT A NODE'S ACCESS REQUEST TO A CURATED PARANET");
    nodes = await DkgClient.paranet.getCuratedNodes(paranetAssetResult.UAL);
    console.log({
        paranetUAL: paranetAssetResult.UAL,
        curatedNodes: nodes
    });
    divider();

    await DkgClient.paranet.requestCuratedNodeAccess(paranetAssetResult.UAL, { blockchain: NODE2_KEYS });
    await DkgClient.paranet.approveCuratedNode(paranetAssetResult.UAL, identityId);
    console.log("======================== APPROVE A NODE'S ACCESS REQUEST TO A CURATED PARANET");
    nodes = await DkgClient.paranet.getCuratedNodes(paranetAssetResult.UAL);
    console.log({
        paranetUAL: paranetAssetResult.UAL,
        curatedNodes: nodes
    });
    divider();

    let minerAddresses = [NODE3_KEYS.publicKey, NODE4_KEYS.publicKey, NODE5_KEYS.publicKey];
    await DkgClient.paranet.addCuratedMiners(paranetAssetResult.UAL, minerAddresses);
    console.log('======================== ADDED KNOWLEDGE MINERS TO A CURATED PARANET');
    let miners = await DkgClient.paranet.getKnowledgeMiners(paranetAssetResult.UAL);
    console.log({
        paranetUAL: paranetAssetResult.UAL,
        knowledgeMiners: miners
    });
    divider();

    minerAddresses = [NODE4_KEYS.publicKey, NODE5_KEYS.publicKey];
    await DkgClient.paranet.removeCuratedMiners(paranetAssetResult.UAL, minerAddresses);
    console.log('======================== REMOVED KNOWLEDGE MINERS FROM A CURATED PARANET');
    miners = await DkgClient.paranet.getKnowledgeMiners(paranetAssetResult.UAL);
    console.log({
        paranetUAL: paranetAssetResult.UAL,
        knowledgeMiners: miners
    });
    divider();

    let minerAddress = NODE4_KEYS.publicKey;
    await DkgClient.paranet.requestCuratedMinerAccess(paranetAssetResult.UAL, { blockchain: NODE4_KEYS });
    await DkgClient.paranet.rejectCuratedMiner(paranetAssetResult.UAL, minerAddress);
    console.log("======================== REJECT A KNOWLEDGE MINER'S ACCESS REQUEST TO A CURATED PARANET");
    miners = await DkgClient.paranet.getKnowledgeMiners(paranetAssetResult.UAL);
    console.log({
        paranetUAL: paranetAssetResult.UAL,
        curatedMiners: miners
    });
    divider();

    await DkgClient.paranet.requestCuratedMinerAccess(paranetAssetResult.UAL, { blockchain: NODE4_KEYS });
    await DkgClient.paranet.approveCuratedMiner(paranetAssetResult.UAL, minerAddress);
    console.log("======================== APPROVE A KNOWLEDGE MINER'S ACCESS REQUEST TO A CURATED PARANET");
    miners = await DkgClient.paranet.getKnowledgeMiners(paranetAssetResult.UAL);
    console.log({
        paranetUAL: paranetAssetResult.UAL,
        curatedMiners: miners
    });
    divider();

    const createFirstAssetResult = await DkgClient.asset.create(content, { epochsNum: 2, blockchain: NODE3_KEYS });
    const approvedSubmitResult = await DkgClient.asset.submitToParanet(createFirstAssetResult.UAL, paranetAssetResult.UAL, { blockchain: NODE3_KEYS });
    console.log('======================== CREATE A KA AND SUBMIT IT TO A CURATED PARANET - KNOWLEDGE MINER IS APPROVED');
    console.log({
        paranetUAL: paranetAssetResult.UAL,
        assetUAL: createFirstAssetResult.UAL,
        submitResult: approvedSubmitResult
    });
    divider();

    const createSecondAssetResult = await DkgClient.asset.create(content, { epochsNum: 2, blockchain: NODE5_KEYS });
    let notApprovedSubmitResult;
    try {
        await DkgClient.asset.submitToParanet(createSecondAssetResult.UAL, paranetAssetResult.UAL, { blockchain: NODE5_KEYS });
    } catch (error) {
        notApprovedSubmitResult = error.message;
    }
    console.log('======================== CREATE A KA AND SUBMIT IT TO A CURATED PARANET - KNOWLEDGE MINER IS NOT APPROVED');
    console.log({
        paranetUAL: paranetAssetResult.UAL,
        assetUAL: createSecondAssetResult.UAL,
        submitResult: notApprovedSubmitResult
    });
    divider();
})();
