import DKG from '../index.js';
import 'dotenv/config';

import {
    PARANET_NODES_ACCESS_POLICY,
    PARANET_MINERS_ACCESS_POLICY,
    BLOCKCHAIN_IDS,
    ENVIRONMENTS,
} from '../constants.js';

const ENVIRONMENT = ENVIRONMENTS.DEVELOPMENT;
const OT_NODE_HOSTNAME = 'http://localhost';
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

// IMPORTANT: Don't forget to add your PRIVATE_KEY to the .env file.
const DkgClient = new DKG({
    environment: ENVIRONMENT,
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    blockchain: {
        name: BLOCKCHAIN_IDS.HARDHAT_1,
        publicKey: PUBLIC_KEY,
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

    divider();

    const paranetCollectionResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== PARANET KNOWLEDGE COLLECTION CREATED');
    console.log(paranetCollectionResult);

    divider();

    // Paranet UAL is a Knowledge Asset UAL (combination of Knowledge Collection UAL and Knowledge Asset token id)
    const paranetUAL = `${paranetCollectionResult.UAL}/1`;
    const paranetOptions = {
        paranetName: 'FirstParanet',
        paranetDescription: 'First ever paranet on DKG!',
        tracToTokenEmissionMultiplier: 5,
        incentivizationProposalVotersRewardPercentage: 12.0,
        operatorRewardPercentage: 10.0,
        paranetNodesAccessPolicy: PARANET_NODES_ACCESS_POLICY.OPEN,
        paranetMinersAccessPolicy: PARANET_MINERS_ACCESS_POLICY.OPEN,
    };

    const paranetRegistered = await DkgClient.paranet.create(paranetUAL, paranetOptions);
    console.log('======================== PARANET REGISTERED');
    console.log(paranetRegistered);
    divider();

    // OPEN SUBMISSION POLICY
    content = {
        public: {
            '@context': 'https://www.schema.org',
            '@id': 'urn:us-cities:info:denver',
            '@type': 'City',
            name: 'Denver',
            state: 'Colorado',
            population: '700,000',
            area: '153.3 sq mi',
        },
        private: {
            '@context': 'https://www.schema.org',
            '@id': 'urn:us-cities:data:denver',
            '@type': 'CityPrivateData',
            crimeRate: 'Low',
            averageIncome: '$50,998',
            infrastructureScore: '6.5',
            relatedCities: [
                { '@id': 'urn:us-cities:info:boston', name: 'Boston' },
                { '@id': 'urn:us-cities:info:chicago', name: 'Chicago' },
            ],
        },
    };

    const createCollectionResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== KNOWLEDGE COLLECTION CREATED');
    console.log(createCollectionResult);
    divider();

    const submitToParanetResult = await DkgClient.asset.submitToParanet(
        createCollectionResult.UAL,
        paranetUAL,
    );
    console.log('======================== KNOWLEDGE COLLECTION SUBMITTED TO PARANET');
    console.log(submitToParanetResult);
    divider();

    // ADD CURATOR TO PARANET
    const addCuratorResult = await DkgClient.paranet.addCurator(paranetUAL, PUBLIC_KEY);
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
    const createSecondCollectionResult = await DkgClient.asset.create(content, { epochsNum: 2 });
    console.log('======================== KNOWLEDGE COLLECTION #2 CREATED');
    console.log(createSecondCollectionResult);
    divider();

    let submitToParanetResult2 = await DkgClient.asset.submitToParanet(
        createSecondCollectionResult.UAL,
        paranetUAL,
    );
    console.log('======================== KNOWLEDGE COLLECTION #2 SUBMITTED TO PARANET');
    console.log(submitToParanetResult2);
    divider();

    // GET TO CONFIRM THE NEWLY CREATED KNOWLEDGE COLLECTION IS NOT IN PARANET - UNDER REVIEW

    // REVIEW SUBMITTED KNOWLEDGE COLLECTION - REJECT

    // GET TO CONFIRM THE NEWLY CREATED KNOWLEDGE COLLECTION IS NOT IN PARANET

    // SUBMIT THE KNOWLEDGE COLLECTION AGAIN
    submitToParanetResult2 = await DkgClient.asset.submitToParanet(
        createSecondCollectionResult.UAL,
        paranetUAL,
    );
    console.log(
        '======================== KNOWLEDGE COLLECTION #2 SUBMITTED TO PARANET FOR THE SECOND TIME',
    );
    console.log(submitToParanetResult2);
    divider();

    // REVIEW SUBMITTED KNOWLEDGE COLLECTION - ACCEPT

    // GET TO CONFIRM THE NEWLY CREATED KNOWLEDGE COLLECTION IS IN PARANET

    // REMOVE CURATOR
    const removeCuratorResult = await DkgClient.paranet.removeCurator(paranetUAL, PUBLIC_KEY);
    console.log('======================== CURATOR REMOVED FROM PARANET');
    console.log(removeCuratorResult);
    divider();
})();
