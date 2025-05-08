import { strict as assert } from 'assert';
import DKG from '../../index.js';
import { BLOCKCHAIN_IDS, ENVIRONMENTS } from '../../constants.js';
import 'dotenv/config';
import { randomUUID } from 'crypto';

const ENVIRONMENT = ENVIRONMENTS.TESTNET;
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0x0111ff148a06Eb44Ee0FA65e6c3627433B8dE4Df';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Total number of nodes to test
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

nodes.forEach(({ name, hostname }) => {
  describe(`DKG Asset Lifecycle on Testnet (${name})`, function () {
    this.timeout(300000);

    const DkgClient = new DKG({
      environment: ENVIRONMENT,
      endpoint: hostname,
      port: OT_NODE_PORT,
      blockchain: {
        name: BLOCKCHAIN_IDS.NEUROWEB_MAINNET,
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
      this.retries(2);

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

        await new Promise(resolve => setTimeout(resolve, 60000));

        // 1. Publish
        const create_result = await DkgClient.asset.create(content, {
          epochsNum: 2,
          minimumNumberOfFinalizationConfirmations: 3,
          minimumNumberOfNodeReplications: 1,
        });
        assert.ok(create_result, `❌ No result returned from publish call on ${name}`);
        assert.ok(create_result.operation, `❌ Missing operation in create_result on ${name}`);
        assert.strictEqual(
          create_result.operation.publish.status,
          'COMPLETED',
          `❌ Publish status is not COMPLETED on ${name}. Got: ${create_result.operation.publish.status}`
        );
        assert.ok(
          create_result.operation.finality,
          `❌ Missing finality object in operation on ${name}`
        );
        assert.strictEqual(
          create_result.operation.finality.status,
          'FINALIZED',
          `❌ Finality status is not FINALIZED on ${name}. Got: ${create_result.operation.finality.status}`
        );

        console.log(`Knowledge Asset Published successfully on ${name}:`);
        const ual = create_result?.UAL;
        assert.ok(ual, `UAL not found after publish on ${name}`);

        // 2. Query
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
        console.log(`Successfully queried Knowledge Asset on ${name}`);

        // 3. Get
        const getResult = await DkgClient.asset.get(ual);
        assert.ok(getResult?.assertion, `Get operation failed or no assertion found for ${name}`);
        console.log(`Successfully got Knowledge Asset on ${name}`);
      });
    });
  });
});
