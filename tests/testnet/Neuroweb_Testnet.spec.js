import { strict as assert } from 'assert';
import DKG from '../../index.js';
import { BLOCKCHAIN_IDS, ENVIRONMENTS } from '../../constants.js';
import 'dotenv/config';
import { randomUUID } from 'crypto';

const ENVIRONMENT = ENVIRONMENTS.TESTNET;
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0xC804682F30c611B7c2AD40F17587Ad5e04974418';
const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY;

const TOTAL_NODES = 3;

const nodes = Array.from({ length: TOTAL_NODES }, (_, i) => {
  const nodeNumber = (i + 1).toString().padStart(2, '0');
  return {
    name: `Node ${nodeNumber}`,
    hostname: `https://v6-pegasus-node-${nodeNumber}.origin-trail.network`,
  };
});

function getRandomWord() {
  const words = ['Galaxy', 'Nebula', 'Orbit', 'Quantum', 'Pixel', 'Velocity', 'Echo', 'Nova'];
  return words[Math.floor(Math.random() * words.length)];
}

function getRandomDescription() {
  const templates = [
    'This asset explores the mysteries of {}.',
    'An in-depth look into {} technologies.',
    'Unlocking the power of {} in modern systems.',
    'How {} shapes our digital future.',
    'A fresh perspective on {} innovation.',
  ];
  const word = getRandomWord();
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace('{}', word);
}

function logError(error, name) {
  console.log(`\n❌ Error on ${name}`);
  console.log(`🔺 Type: ${error.name}`);
  console.log(`🧵 Message: ${error.message}`);
  if (error.stack) {
    const stackLines = error.stack.split('\n').filter(line => !line.includes('node_modules'));
    const lastRelevant = stackLines[1] || stackLines[0];
    if (lastRelevant) console.log(`📍 Location: ${lastRelevant.trim()}`);
  }
}

nodes.forEach(({ name, hostname }) => {
  describe(`DKG Asset Lifecycle on Testnet (${name})`, function () {
    this.timeout(180000);

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

    let attempt = 0;
    describe('', function () {
      this.retries(0);

      it('should publish, query, and get a Knowledge Asset', async () => {
        console.log('Attempt:', attempt);
        attempt++;

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

        await new Promise(resolve => setTimeout(resolve, 30000));

        try {
          const create_result = await DkgClient.asset.create(content, {
            epochsNum: 2,
            minimumNumberOfFinalizationConfirmations: 3,
            minimumNumberOfNodeReplications: 1,
          });

          assert.ok(create_result, `No result returned from publish call on ${name}`);
          assert.ok(create_result.operation, `Missing operation in create_result on ${name}`);
          assert.strictEqual(create_result.operation.publish.status, 'COMPLETED');
          assert.ok(create_result.operation.finality);
          assert.strictEqual(create_result.operation.finality.status, 'FINALIZED');

          console.log(`\n✅  Knowledge Asset Published successfully on ${name}`);
          const ual = create_result?.UAL;
          assert.ok(ual, `UAL not found after publish on ${name}`);

          const queryOperationResult = await DkgClient.graph.query(
            `PREFIX schema: <http://schema.org/>
             SELECT ?s ?name ?description
             WHERE {
               ?s schema:name ?name ; schema:description ?description .
             }`,
            'SELECT'
          );
          assert.ok(queryOperationResult?.data?.length > 0, `Query returned no results for ${name}`);
          console.log(`✅ Successfully queried Knowledge Asset on ${name}`);

          const getResult = await DkgClient.asset.get(ual);
          assert.ok(getResult?.assertion, `Get operation failed or no assertion found for ${name}`);
          console.log(`✅ Successfully got Knowledge Asset on ${name}`);
        } catch (error) {
          logError(error, name);
          assert.fail(`Test failed on ${name}: ${error.message}`);
        }
        
      });
    });
  });
});