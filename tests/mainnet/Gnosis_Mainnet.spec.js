import { strict as assert } from 'assert';
import DKG from '../../index.js';
import { BLOCKCHAIN_IDS, ENVIRONMENTS } from '../../constants.js';
import 'dotenv/config';
import { randomUUID } from 'crypto';

const ENVIRONMENT = ENVIRONMENTS.MAINNET;
const OT_NODE_HOSTNAME = 'https://positron.origin-trail.network';
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0x42ae12826Eb3b920D3b818e1D6fdF9Ad0054e471';
const PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY;

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
  describe(`DKG Asset Lifecycle on Mainnet`, function () {
    this.timeout(180000);

    const DkgClient = new DKG({
      environment: ENVIRONMENT,
      endpoint: OT_NODE_HOSTNAME,
      port: OT_NODE_PORT,
      blockchain: {
        name: BLOCKCHAIN_IDS.GNOSIS_MAINNET,
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
      this.retries(5);

    it('should publish, query, and get a Knowledge Asset', async () => {
      console.log('Attempt:', attempt);
      attempt++;
      const name = "Mainnet Gnosis";
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

      // 1. Publish
      const create_result = await DkgClient.asset.create(content, {
        epochsNum: 2,
        minimumNumberOfFinalizationConfirmations: 3,
        minimumNumberOfNodeReplications: 1,
      });
      assert.ok(create_result, `No result returned from publish call on ${name}`);
        assert.ok(create_result.operation, `Missing operation in create_result on ${name}`);
        assert.strictEqual(
          create_result.operation.publish.status,
          'COMPLETED',
          `Publish status is not COMPLETED on ${name}. Got: ${create_result.operation.publish.status}`
        );
        assert.ok(
          create_result.operation.finality,
          `Missing finality object in operation on ${name}`
        );
        assert.strictEqual(
          create_result.operation.finality.status,
          'FINALIZED',
          `Finality status is not FINALIZED on ${name}. Got: ${create_result.operation.finality.status}`
        );
      const ual = create_result?.UAL;
      assert.ok(ual, `UAL not found after publish on ${name}`);
      console.log(`Knowledge Asset Published successfully on ${name}`);

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