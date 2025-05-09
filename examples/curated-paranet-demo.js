import jsonld from 'jsonld';
import DKG from '../index.js';

import {
    PARANET_NODES_ACCESS_POLICY,
    PARANET_MINERS_ACCESS_POLICY,
    PARANET_KC_SUBMISSION_POLICY,
} from '../constants/constants.js';

const OT_NODE_HOSTNAME = 'http://localhost';
const OT_NODE_PORT = '8900';
const BLOCKCHAIN_NAME = BLOCKCHAIN_IDS.HARDHAT_1;

const DkgClient = new DKG({
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    blockchain: {
        name: BLOCKCHAIN_NAME,
        privateKey: process.env.PRIVATE_KEY,
    },
    maxNumberOfRetries: 30,
    frequency: 2,
    contentType: 'all',
});

const NODE1_KEYS = {
    publicKey: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
};

const NODE2_KEYS = {
    publicKey: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
};

const NODE3_KEYS = {
    publicKey: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
};

const NODE4_KEYS = {
    publicKey: '0xe5beaB7853A22f054Ef287EA62aCe7A32528b3eE',
    privateKey: '0x9904da7fe786e5d1f8629b565b688425d78053d4325e746c5ad8ac4328248037',
};

const NODE5_KEYS = {
    publicKey: '0x8A4673B00B04b59CaC44926ABeDa85ed181fA436',
    privateKey: '0xfb07091daf99c1d493820ae8dcbc439b48b13ca844684bb1dcae27c9e680e62b',
};

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
        },
    };

    divider();

    const paranetAssetResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== PARANET KNOWLEDGE ASSET CREATED');
    console.log(paranetAssetResult);

    divider();

    const paranetOptions = {
        paranetName: 'FirstParanet',
        paranetDescription: 'First ever paranet on DKG!',
        paranetNodesAccessPolicy: PARANET_NODES_ACCESS_POLICY.PERMISSIONED,
        paranetMinersAccessPolicy: PARANET_MINERS_ACCESS_POLICY.PERMISSIONED,
        knowledgeCollectionsSubmissionPolicy: PARANET_KC_SUBMISSION_POLICY.OPEN,
    };

    const paranetUAL = `${paranetAssetResult.UAL}/1`;
    const paranetRegistered = await DkgClient.paranet.create(paranetUAL, paranetOptions);
    console.log('======================== A PERMISSIONED PARANET REGISTERED');
    console.log(paranetRegistered);
    divider();

    const node1IdentityId = await DkgClient.node.getIdentityId(NODE1_KEYS.publicKey);
    const node2IdentityId = await DkgClient.node.getIdentityId(NODE2_KEYS.publicKey);
    const node3IdentityId = await DkgClient.node.getIdentityId(NODE3_KEYS.publicKey);
    let identityIds = [node1IdentityId, node2IdentityId, node3IdentityId];
    await DkgClient.paranet.addPermissionedNodes(paranetUAL, identityIds);
    console.log('======================== ADDED NODES TO A PERMISSIONED PARANET');
    let nodes = await DkgClient.paranet.getPermissionedNodes(paranetUAL);
    console.log({
        paranetUAL: paranetUAL,
        permissionedNodes: nodes,
    });
    divider();

    identityIds = [node2IdentityId, node3IdentityId];
    await DkgClient.paranet.removePermissionedNodes(paranetUAL, identityIds);
    console.log('======================== REMOVED NODES FROM A PERMISSIONED PARANET');
    nodes = await DkgClient.paranet.getPermissionedNodes(paranetUAL);
    console.log({
        paranetUAL: paranetUAL,
        permissionedNodes: nodes,
    });
    divider();

    await DkgClient.paranet.requestParanetPermissionedNodeAccess(paranetUAL, {
        blockchain: NODE2_KEYS,
    });
    await DkgClient.paranet.rejectPermissionedNode(paranetUAL, node2IdentityId);
    console.log(
        "======================== REJECT A NODE'S ACCESS REQUEST TO A PERMISSIONED PARANET",
    );
    nodes = await DkgClient.paranet.getPermissionedNodes(paranetUAL);
    console.log({
        paranetUAL: paranetUAL,
        permissionedNodes: nodes,
    });
    divider();

    await DkgClient.paranet.requestParanetPermissionedNodeAccess(paranetUAL, {
        blockchain: NODE2_KEYS,
    });
    await DkgClient.paranet.approvePermissionedNode(paranetUAL, node2IdentityId);
    console.log(
        "======================== APPROVE A NODE'S ACCESS REQUEST TO A PERMISSIONED PARANET",
    );
    nodes = await DkgClient.paranet.getPermissionedNodes(paranetUAL);
    console.log({
        paranetUAL: paranetUAL,
        permissionedNodes: nodes,
    });
    divider();

    let minerAddresses = [NODE3_KEYS.publicKey, NODE4_KEYS.publicKey, NODE5_KEYS.publicKey];
    await DkgClient.paranet.addParanetPermissionedMiners(paranetUAL, minerAddresses);
    console.log('======================== ADDED KNOWLEDGE MINERS TO A PERMISSIONED PARANET');
    let miners = await DkgClient.paranet.getKnowledgeMiners(paranetUAL);
    console.log({
        paranetUAL: paranetUAL,
        knowledgeMiners: miners,
    });
    divider();

    minerAddresses = [NODE4_KEYS.publicKey, NODE5_KEYS.publicKey];
    await DkgClient.paranet.removeParanetPermissionedMiners(paranetUAL, minerAddresses);
    console.log('======================== REMOVED KNOWLEDGE MINERS FROM A PERMISSIONED PARANET');
    miners = await DkgClient.paranet.getKnowledgeMiners(paranetUAL);
    console.log({
        paranetUAL: paranetUAL,
        knowledgeMiners: miners,
    });
    divider();

    let minerAddress = NODE4_KEYS.publicKey;
    await DkgClient.paranet.requestParanetPermissionedMinerAccess(paranetUAL, {
        blockchain: NODE4_KEYS,
    });
    await DkgClient.paranet.rejectPermissionedMiner(paranetUAL, minerAddress);
    console.log(
        "======================== REJECT A KNOWLEDGE MINER'S ACCESS REQUEST TO A PERMISSIONED PARANET",
    );
    miners = await DkgClient.paranet.getKnowledgeMiners(paranetUAL);
    console.log({
        paranetUAL: paranetUAL,
        permissionedMiners: miners,
    });
    divider();

    await DkgClient.paranet.requestParanetPermissionedMinerAccess(paranetUAL, {
        blockchain: NODE4_KEYS,
    });
    await DkgClient.paranet.approvePermissionedMiner(paranetUAL, minerAddress);
    console.log(
        "======================== APPROVE A KNOWLEDGE MINER'S ACCESS REQUEST TO A PERMISSIONED PARANET",
    );
    miners = await DkgClient.paranet.getKnowledgeMiners(paranetAssetResult.UAL);
    console.log({
        paranetUAL: paranetUAL,
        permissionedMiners: miners,
    });
    divider();

    const localStoreFirstAssetResult = await DkgClient.asset.create(content, {
        epochsNum: 2,
        minimumNumberOfFinalizationConfirmations: 3,
        minimumNumberOfNodeReplications: 3,
    });
    console.log(
        '======================== MINT A KA, LOCAL STORE AND SUBMIT IT TO A PERMISSIONED PARANET - KNOWLEDGE MINER IS APPROVED',
    );
    console.log(localStoreFirstAssetResult);
    divider();

    const KCContent = {
        public: {
            '@context': 'https://www.schema.org',
            '@id': 'urn:us-cities:info:new-york',
            '@type': 'City',
            name: 'New York',
            state: 'New York',
            population: '8,336,817',
            area: '468.9 sq mi',
        },
        private: {
            '@context': 'https://www.schema.org',
            '@id': 'urn:us-cities:data:new-york',
            '@type': 'CityPrivateData',
            crimeRate: 'Low',
            averageIncome: '$63,998',
            infrastructureScore: '8.5',
            relatedCities: [
                { '@id': 'urn:us-cities:info:los-angeles', name: 'Los Angeles' },
                { '@id': 'urn:us-cities:info:chicago', name: 'Chicago' },
            ],
        },
    };

    const createResult = await DkgClient.asset.create(KCContent, {
        epochsNum: 2,
        minimumNumberOfFinalizationConfirmations: 3,
        minimumNumberOfNodeReplications: 3,
    });

    console.log(
        '======================== MINT A KA, LOCAL STORE AND SUBMIT IT TO A PERMISSIONED PARANET - KNOWLEDGE MINER IS NOT APPROVED',
    );
    console.log(createResult);
    divider();

    const submitToParanetResult = await DkgClient.asset.submitToParanet(
        createResult.UAL,
        paranetUAL,
    );

    console.log('======================== KNOWLEDGE COLLECTION ADDED TO PARANET');
    console.log(submitToParanetResult);
    divider();
})();
