import { strict as assert } from 'assert';
import DKG from '../index.js';
import { BLOCKCHAIN_IDS, ENVIRONMENTS } from '../constants.js';
import 'dotenv/config';
import { randomUUID } from 'crypto';

const ENVIRONMENT = ENVIRONMENTS.TESTNET;
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0x0111ff148a06Eb44Ee0FA65e6c3627433B8dE4Df';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Random word helper
function getRandomWord() {
  const words = ['Galaxy', 'Nebula', 'Orbit', 'Quantum', 'Pixel', 'Velocity', 'Echo', 'Nova'];
  return words[Math.floor(Math.random() * words.length)];
}

// Random sentence helper
function getRandomDescription() {
  const templates = [
    'This asset explores the mysteries of {}.',
    'An in-depth look into {} technologies.',
    'Unlocking the power of {} in modern systems.',
    'How {} shapes our digital future.',
    'A fresh perspective on {} innovation.'
  ];
  const word = getRandomWord();
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace('{}', word);
}

[
  { name: 'Node 02', hostname: 'https://v6-pegasus-node-02.origin-trail.network' },
  { name: 'Node 03', hostname: 'https://v6-pegasus-node-03.origin-trail.network' },
].forEach(({ name, hostname }) => {
  describe(`DKG Asset Lifecycle on Testnet (${name})`, function () {
    this.timeout(360000);

    const DkgClient = new DKG({
      environment: ENVIRONMENT,
      endpoint: hostname,
      port: OT_NODE_PORT,
      blockchain: {
        name: BLOCKCHAIN_IDS.NEUROWEB_TESTNET,
        publicKey: PUBLIC_KEY,
        privateKey: PRIVATE_KEY,
      },
      maxNumberOfRetries: 300,
      frequency: 2,
      contentType: 'all',
      nodeApiVersion: '/v1',
    });

    it('should publish and query a Knowledge Asset', async () => {
      const uniqueWord = getRandomWord();
      const content = {
        public: {
          '@context': 'https://www.schema.org',
          '@id': `urn:ka:${name.replace(' ', '').toLowerCase()}-${randomUUID()}`,
          '@type': 'CreativeWork',
          name: `DKG ${uniqueWord} ${Date.now()}`,
          description: getRandomDescription(),
        },
      };

      const create_result = await DkgClient.asset.create(content, {
        epochsNum: 2,
        minimumNumberOfFinalizationConfirmations: 3,
        minimumNumberOfNodeReplications: 1,
      });

      if (!create_result) {
        throw new Error(`Knowledge Asset not published successfully on ${name}`);
      }

      console.log(`Knowledge Asset Published successfully on ${name}:`, JSON.stringify(create_result, null, 2));

      const queryOperationResult = await DkgClient.graph.query(
        `
        PREFIX schema: <http://schema.org/>
        SELECT ?s ?name ?description
        WHERE {
          ?s schema:name ?name ;
             schema:description ?description .
        }
        `,
        'SELECT'
      );

      assert.ok(queryOperationResult?.data?.length > 0, `Query returned no results for ${name}`);
      console.log(`Query results from ${name}:`, queryOperationResult);
    });
  });
});
