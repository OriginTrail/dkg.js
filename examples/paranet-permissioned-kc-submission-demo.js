import DKG from '../index.js';
import 'dotenv/config';

import {
    PARANET_NODES_ACCESS_POLICY,
    PARANET_MINERS_ACCESS_POLICY,
    BLOCKCHAIN_IDS,
    PARANET_KC_SUBMISSION_POLICY,
} from '../constants/constants.js';

const OT_NODE_HOSTNAME = 'http://localhost';
const OT_NODE_PORT = '8900';
const BLOCKCHAIN_NAME = BLOCKCHAIN_IDS.HARDHAT_1;

// IMPORTANT: Don't forget to add your PRIVATE_KEY to the .env file.
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
    nodeApiVersion: '/v1',
});

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
            '@context': 'http://www.schema.org',
            '@id': 'urn:paranet:01',
            '@type': 'Paranet',
            name: 'Paranet test',
        },
    };

    divider();

    const paranetKcResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== PARANET KNOWLEDGE COLLECTION CREATED');
    console.log(paranetKcResult);

    divider();

    // Paranet UAL is a Knowledge Asset UAL (combination of Knowledge Collection UAL and Knowledge Asset token id)
    const paranetUAL = `${paranetKcResult.UAL}/1`;
    const paranetOptions = {
        paranetName: 'FirstParanet',
        paranetDescription: 'First ever paranet on DKG!',
        paranetNodesAccessPolicy: PARANET_NODES_ACCESS_POLICY.OPEN,
        paranetMinersAccessPolicy: PARANET_MINERS_ACCESS_POLICY.OPEN,
        paranetKcSubmissionPolicy: PARANET_KC_SUBMISSION_POLICY.STAGING, // Set up to be staging
    };

    const paranetRegistered = await DkgClient.paranet.create(paranetUAL, paranetOptions);
    console.log(
        '======================== PARANET WITH PERMISSIONED KC SUBMISSION POLICY REGISTERED',
    );
    console.log(paranetRegistered);
    divider();

    // ADD CURATOR TO PARANET
    const addCuratorResult = await DkgClient.paranet.addCurator(
        paranetUAL,
        await DkgClient.blockchain.getWalletAddress(),
    );
    console.log('======================== CURATOR ADDED TO PARANET');
    console.log(addCuratorResult);
    divider();

    content = {
        public: {
            '@context': 'https://www.schema.org',
            '@id': 'urn:us-cities:info:dallas',
            '@type': 'City',
            name: 'Dallas',
            state: 'Texas',
            population: '1,343,573',
            area: '386.5 sq mi',
        },
        private: {
            '@context': 'https://www.schema.org',
            '@id': 'urn:us-cities:data:dallas',
            '@type': 'CityPrivateData',
            crimeRate: 'Low',
            averageIncome: '$80,998',
            infrastructureScore: '7.5',
            relatedCities: [
                { '@id': 'urn:us-cities:info:austin', name: 'Austin' },
                { '@id': 'urn:us-cities:info:houston', name: 'Houston' },
            ],
        },
    };
    const createKcResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== KNOWLEDGE COLLECTION CREATED');
    console.log(createKcResult);
    divider();

    // STAGE KNOWLEDGE COLLECTION TO PARANET
    let stageToParanetResult = await DkgClient.paranet.stageKnowledgeCollection(
        createKcResult.UAL,
        paranetUAL,
    );
    console.log('======================== KNOWLEDGE COLLECTION STAGED TO PARANET');
    console.log(stageToParanetResult);
    divider();

    // CHECK IF KNOWLEDGE COLLECTION IS STAGED TO PARANET AND GET APPROVAL STATUS
    console.log(
        '======================== IS KNOWLEDGE COLLECTION STAGED TO PARANET: ',
        await DkgClient.paranet.isKnowledgeCollectionStaged(createKcResult.UAL, paranetUAL),
    );
    console.log(
        '======================== KNOWLEDGE COLLECTION PARANET APPROVAL STATUS: ',
        await DkgClient.paranet.getKnowledgeCollectionApprovalStatus(
            createKcResult.UAL,
            paranetUAL,
        ),
    );
    divider();

    // REVIEW SUBMITTED KNOWLEDGE COLLECTION - REJECT
    let reviewKnowledgeCollectionResult = await DkgClient.paranet.reviewKnowledgeCollection(
        createKcResult.UAL,
        paranetUAL,
        false,
    );
    console.log('======================== KNOWLEDGE COLLECTION REVIEWED AND REJECTED');
    console.log(reviewKnowledgeCollectionResult);
    divider();

    // CHECK IF KNOWLEDGE COLLECTION IS APPROVED AND GET APPROVAL STATUS
    console.log(
        '======================== IS KNOWLEDGE COLLECTION APPROVED: ',
        await DkgClient.paranet.isKnowledgeCollectionApproved(createKcResult.UAL, paranetUAL),
    );
    console.log(
        '======================== KNOWLEDGE COLLECTION PARANET APPROVAL STATUS: ',
        await DkgClient.paranet.getKnowledgeCollectionApprovalStatus(
            createKcResult.UAL,
            paranetUAL,
        ),
    );
    divider();

    // CHECK IF KNOWLEDGE COLLECTION IS REGISTERED TO PARANET - SHOULD RETURN FALSE
    console.log(
        '======================== IS KNOWLEDGE COLLECTION REGISTERED TO PARANET: ',
        await DkgClient.paranet.isKnowledgeCollectionRegistered(createKcResult.UAL, paranetUAL),
    );
    divider();

    // SUBMIT THE KNOWLEDGE COLLECTION AGAIN
    stageToParanetResult = await DkgClient.paranet.stageKnowledgeCollection(
        createKcResult.UAL,
        paranetUAL,
    );
    console.log(
        '======================== KNOWLEDGE COLLECTION SUBMITTED TO PARANET FOR THE SECOND TIME',
    );
    console.log(stageToParanetResult);
    divider();

    // REVIEW SUBMITTED KNOWLEDGE COLLECTION - ACCEPT
    reviewKnowledgeCollectionResult = await DkgClient.paranet.reviewKnowledgeCollection(
        createKcResult.UAL,
        paranetUAL,
        true,
    );
    console.log('======================== KNOWLEDGE COLLECTION REVIEWED AGAIN AND ACCEPTED');
    console.log(reviewKnowledgeCollectionResult);
    divider();

    // CHECK IF KNOWLEDGE COLLECTION IS APPROVED AND GET APPROVAL STATUS
    console.log(
        '======================== IS KNOWLEDGE COLLECTION APPROVED: ',
        await DkgClient.paranet.isKnowledgeCollectionApproved(createKcResult.UAL, paranetUAL),
    );
    console.log(
        '======================== KNOWLEDGE COLLECTION PARANET APPROVAL STATUS: ',
        await DkgClient.paranet.getKnowledgeCollectionApprovalStatus(
            createKcResult.UAL,
            paranetUAL,
        ),
    );
    divider();

    // CHECK IF KNOWLEDGE COLLECTION IS REGISTERED TO PARANET - SHOULD RETURN TRUE
    console.log(
        '======================== IS KNOWLEDGE COLLECTION REGISTERED TO PARANET: ',
        await DkgClient.paranet.isKnowledgeCollectionRegistered(createKcResult.UAL, paranetUAL),
    );
    divider();

    // REMOVE CURATOR
    const removeCuratorResult = await DkgClient.paranet.removeCurator(
        paranetUAL,
        await DkgClient.blockchain.getWalletAddress(),
    );
    console.log('======================== CURATOR REMOVED FROM PARANET');
    console.log(removeCuratorResult);
    divider();
})();
