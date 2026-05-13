/**
 * Biomedical Research Example
 *
 * Demonstrates publishing a healthcare knowledge asset to the OriginTrail DKG
 * using the schema.org/MedicalStudy vocabulary with PubMed citation provenance.
 *
 * Use case: OpenGenome (https://opengenome.bio) publishes AI-generated biomedical
 * research reports as verifiable knowledge assets on the DKG after minting
 * the corresponding NFT on Solana. This creates a dual-anchor for each report:
 * one on-chain (Solana NFT) and one on the knowledge graph (DKG UAL).
 *
 * Run:
 *   node examples/biomedical-research.js
 *
 * Prerequisites:
 *   - Copy .env.example to .env and fill in PRIVATE_KEY
 *   - Ensure your wallet has testnet TRAC and Base Sepolia ETH
 *     TRAC faucet:     https://faucet.origintrail.io
 *     ETH faucet:      https://www.alchemy.com/faucets/base-sepolia
 */

import DKG from '../index.js';
import { BLOCKCHAIN_IDS } from '../constants/constants.js';
import 'dotenv/config';

const OT_NODE_HOSTNAME = 'https://v6-pegasus-node-02.origin-trail.network';
const OT_NODE_PORT = '8900';
const BLOCKCHAIN_NAME = BLOCKCHAIN_IDS.BASE_TESTNET;

// IMPORTANT: Don't forget to add your PRIVATE_KEY to the .env file.
const DkgClient = new DKG({
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    blockchain: {
        name: BLOCKCHAIN_NAME,
        privateKey: process.env.PRIVATE_KEY,
    },
    maxNumberOfRetries: 300,
    frequency: 2,
    contentType: 'all',
    nodeApiVersion: '/v1',
});

function divider() {
    console.log('==================================================');
    console.log('==================================================');
    console.log('==================================================');
}

/**
 * A biomedical research report structured as a schema.org/MedicalStudy.
 *
 * The `og:` prefix is a custom vocabulary namespace for OpenGenome-specific
 * fields (confidence scores, Solana mint address, herb recommendations).
 * All standard medical metadata uses schema.org types directly.
 *
 * PubMed citations are included as ScholarlyArticle references so the
 * knowledge asset carries full source provenance on-chain.
 */
const researchContent = {
    public: {
        '@context': {
            '@vocab': 'https://schema.org/',
            og: 'https://opengenome.bio/schema/v1/',
        },
        '@id': 'urn:opengenome:analysis:1',
        '@type': 'MedicalStudy',
        name: 'Hantavirus Pulmonary Syndrome - OpenGenome Research #1',
        description:
            'AI-assisted biomedical research report identifying Hantavirus Pulmonary Syndrome ' +
            'with supporting PubMed evidence and evidence-backed herbal adjunct recommendations.',
        'og:analysisId': 1,
        'og:primarySignal': 'Hantavirus Pulmonary Syndrome',
        'og:confidenceScore': 87,
        'og:signalStrength': 82,
        'og:solanaMint': 'ExampleSolanaAddressHere',
        'og:platform': 'https://opengenome.bio',
        dateCreated: new Date().toISOString(),
        studySubject: {
            '@type': 'MedicalCondition',
            name: 'Hantavirus Pulmonary Syndrome',
            code: {
                '@type': 'MedicalCode',
                codeValue: 'B33.4',
                codingSystem: 'ICD-10',
            },
        },
        'og:herbs': [
            {
                '@type': 'Drug',
                name: 'Ginger',
                alternateName: 'Zingiber officinale',
                'og:pmid': '21945235',
                description: 'Anti-inflammatory and antiviral properties studied in respiratory conditions.',
            },
            {
                '@type': 'Drug',
                name: 'Turmeric',
                alternateName: 'Curcuma longa',
                'og:pmid': '37105214',
                description: 'Curcumin shown to modulate cytokine response relevant to viral lung injury.',
            },
        ],
        citation: [
            {
                '@type': 'ScholarlyArticle',
                identifier: 'PMID:21945235',
                url: 'https://pubmed.ncbi.nlm.nih.gov/21945235/',
                name: 'Antiviral properties of ginger extracts against respiratory viruses',
            },
            {
                '@type': 'ScholarlyArticle',
                identifier: 'PMID:37105214',
                url: 'https://pubmed.ncbi.nlm.nih.gov/37105214/',
                name: 'Curcumin modulates cytokine storm in viral pneumonia models',
            },
        ],
    },
};

(async () => {
    const nodeInfo = await DkgClient.node.info();
    console.log('======================== NODE INFO RECEIVED');
    console.log(nodeInfo);

    divider();

    // Publish the knowledge asset to the DKG
    const createResult = await DkgClient.asset.create(researchContent, {
        epochsNum: 2,
    });

    console.log('======================== KNOWLEDGE ASSET CREATED');
    console.log('UAL:', createResult.UAL);
    console.log('View on DKG Explorer:');
    console.log('https://dkg.origintrail.io/explore?ual=' + createResult.UAL);

    divider();

    // Retrieve the asset back to verify
    const getResult = await DkgClient.asset.get(createResult.UAL);

    console.log('======================== KNOWLEDGE ASSET RETRIEVED');
    console.log(JSON.stringify(getResult, null, 2));

    divider();

    // SPARQL query: find all OpenGenome research assets
    const queryResult = await DkgClient.graph.query(
        `PREFIX schema: <https://schema.org/>
         PREFIX og: <https://opengenome.bio/schema/v1/>

         SELECT ?id ?signal ?confidence WHERE {
             ?s a schema:MedicalStudy ;
                og:analysisId ?id ;
                og:primarySignal ?signal ;
                og:confidenceScore ?confidence .
         }`,
        'SELECT',
    );

    console.log('======================== SPARQL QUERY RESULTS');
    console.log(JSON.stringify(queryResult, null, 2));
})();
