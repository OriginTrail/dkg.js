import { strict as assert } from 'assert';
import DKG from '../../index.js';
import { BLOCKCHAIN_IDS } from '../../constants/constants.js';
import 'dotenv/config';
import { randomUUID } from 'crypto';

const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0xC804682F30c611B7c2AD40F17587Ad5e04974418';
const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY;

const nodes = [
  { name: 'Node 01', hostname: 'https://v6-pegasus-node-01.origin-trail.network' },
  { name: 'Node 08', hostname: 'https://v6-pegasus-node-08.origin-trail.network' },
  { name: 'Node 09', hostname: 'https://v6-pegasus-node-09.origin-trail.network' },
];

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

nodes.forEach(({ name, hostname }, currentIndex) => {
  describe(`DKG Asset Lifecycle on Testnet (${name})`, function () {
    this.timeout(10 * 60 * 1000); // 10 minutes

    const DkgClient = new DKG({
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

      it('should publish 20 Knowledge Assets per node', async () => {
        for (let i = 0; i < 15; i++) {
          console.log(`\nPublishing KA #${i + 1} on ${name} (Attempt ${attempt})`);
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

          try {
            const create_result = await DkgClient.asset.create(content, {
              epochsNum: 2,
              minimumNumberOfFinalizationConfirmations: 3,
              minimumNumberOfNodeReplications: 3,
            });

            assert.ok(create_result, `No result returned from publish call on ${name}`);
            assert.ok(create_result.operation, `Missing operation in create_result on ${name}`);
            assert.strictEqual(create_result.operation.publish.status, 'COMPLETED');
            assert.ok(create_result.operation.finality);
            assert.strictEqual(create_result.operation.finality.status, 'FINALIZED');

            const ual = create_result?.UAL;
            assert.ok(ual, `UAL not found after publish on ${name}`);
            console.log(`✅ Published KA #${i + 1} on ${name} with UAL: ${ual}`);

            const queryResult = await DkgClient.graph.query(
              `PREFIX schema: <http://schema.org/>
               SELECT ?s ?name ?description
               WHERE {
                 ?s schema:name ?name ; schema:description ?description .
               }`,
              'SELECT'
            );
            assert.ok(queryResult?.data?.length > 0, `Query returned no results for ${name}`);
            console.log(`✅ Query succeeded on ${name}`);

            const getResult = await DkgClient.asset.get(ual);
            assert.ok(getResult?.assertion, `Get failed on ${name}`);
            console.log(`✅ Local get succeeded on ${name}`);

            const otherIndexes = nodes.map((_, i) => i).filter(i => i !== currentIndex);
            const remoteNode = nodes[otherIndexes[Math.floor(Math.random() * otherIndexes.length)]];

            const RemoteDkgClient = new DKG({
              endpoint: remoteNode.hostname,
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

            const remoteGetResult = await RemoteDkgClient.asset.get(ual);
            assert.ok(remoteGetResult?.assertion, `Failed to get KA from ${remoteNode.name}`);
            console.log(`✅ Remote get succeeded on ${remoteNode.name}`);
          } catch (error) {
            logError(error, name);
            assert.fail(`Test failed on ${name}: ${error.message}`);
          }
        }
      });
    });
  });
});