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
  { name: 'Node 04', hostname: 'https://v6-pegasus-node-04.origin-trail.network' },
  { name: 'Node 08', hostname: 'https://v6-pegasus-node-08.origin-trail.network' },
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

const globalStats = {
  [BLOCKCHAIN_IDS.NEUROWEB_TESTNET]: {},
};

const errorStats = {};

function logError(error, name) {
  console.log(`\n❌ Error on ${name}`);
  console.log(`🔺 Type: ${error.name}`);
  console.log(`🧵 Message: ${error.message}`);
  if (error.stack) {
    const stackLines = error.stack.split('\n').filter(line => !line.includes('node_modules'));
    const lastRelevant = stackLines[1] || stackLines[0];
    if (lastRelevant) console.log(`📍 Location: ${lastRelevant.trim()}`);
  }

  // Track the error
  if (!errorStats[name]) errorStats[name] = {};
  const key = `${error.name}: ${error.message.split('\n')[0]}`;
  errorStats[name][key] = (errorStats[name][key] || 0) + 1;
}

nodes.forEach(({ name, hostname }, currentIndex) => {
  describe(`DKG Asset Lifecycle on Testnet (${name})`, function () {
    this.timeout(1200000);

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

    describe('', function () {
      this.retries(0);

      it('should publish 15 Knowledge Assets per node', async () => {
        let totalPassed = 0;
        let totalFailed = 0;
        const failedAssets = [];

        for (let i = 0; i < 15; i++) {
          console.log(`\n📡 Publishing KA #${i + 1} on ${name}`);
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

          let ual = null;
          let step = 'publishing';

          try {
            const create_result = await DkgClient.asset.create(content, {
              epochsNum: 2,
              minimumNumberOfFinalizationConfirmations: 3,
              minimumNumberOfNodeReplications: 3,
            });

            assert.ok(create_result, `No result returned from publish call`);
            assert.ok(create_result.operation, `Missing operation in create_result`);
            assert.strictEqual(create_result.operation.publish.status, 'COMPLETED');
            assert.ok(create_result.operation.finality);
            assert.strictEqual(create_result.operation.finality.status, 'FINALIZED');

            ual = create_result?.UAL;
            assert.ok(ual, `UAL not found after publish`);
            console.log(`✅ Published KA #${i + 1} with UAL: ${ual}`);

            step = 'querying';
            const queryResult = await DkgClient.graph.query(
              `PREFIX schema: <http://schema.org/>
               SELECT ?s ?name ?description
               WHERE {
                 ?s schema:name ?name ; schema:description ?description .
               }`,
              'SELECT'
            );
            assert.ok(queryResult?.data?.length > 0, `Query returned no results`);
            console.log(`✅ Query succeeded`);

            step = 'local get';
            const getResult = await DkgClient.asset.get(ual);
            assert.ok(getResult?.assertion, `Get failed`);
            console.log(`✅ Local get succeeded`);

            step = 'remote get';
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
            assert.ok(remoteGetResult?.assertion, `Remote get failed`);
            console.log(`✅ Remote get succeeded on ${remoteNode.name}`);

            totalPassed++;
          } catch (error) {
            logError(error, name);

            let reason;
            if (!ual) {
              reason = `Publish failed — No UAL`;
            } else if (step === 'querying') {
              reason = `Query failed — UAL: ${ual}`;
            } else if (step === 'local get') {
              reason = `Local get failed — UAL: ${ual}`;
            } else if (step === 'remote get') {
              reason = `Remote get failed — UAL: ${ual}`;
            } else {
              reason = `Failed after publish — UAL: ${ual}`;
            }

            failedAssets.push(`KA #${i + 1} (${reason})`);
            totalFailed++;
            continue;
          }
        }

        console.log(`\n──────────── Summary for ${name} ────────────`);
        console.log(`✅ Success: ${totalPassed} / 15 -> ${((totalPassed / 15) * 100).toFixed(2)}%`);
        console.log(`❌ Failed: ${totalFailed}`);
        if (failedAssets.length > 0) {
          console.log(`🔍 Failed Assets:`);
          failedAssets.forEach(entry => console.log(`  - ${entry}`));
        }

        // Store in global stats
        globalStats[BLOCKCHAIN_IDS.NEUROWEB_TESTNET][name] = {
          success: totalPassed,
          failed: totalFailed,
        };
      });
    });
  });
});

// Print final global summary
after(() => {
  console.log(`\n\n📊 Global Publish Summary:`);

  Object.entries(globalStats).forEach(([blockchain, nodeStats]) => {
    console.log(`\n🔗 Blockchain: ${blockchain}`);

    let totalSuccess = 0;
    let totalFail = 0;

    Object.entries(nodeStats).forEach(([nodeName, { success, failed }]) => {
      const total = success + failed;
      const rate = ((success / total) * 100).toFixed(2);
      totalSuccess += success;
      totalFail += failed;
      console.log(`  • ${nodeName}: ✅ ${success} / ❌ ${failed} (${rate}%)`);
    });

    const grandTotal = totalSuccess + totalFail;
    const totalRate = ((totalSuccess / grandTotal) * 100).toFixed(2);
    console.log(`  📦 TOTAL: ✅ ${totalSuccess} / ❌ ${totalFail} -> ${totalRate}%`);
  });

  console.log(`\n\n📊 Error Breakdown by Node:`);
  Object.entries(errorStats).forEach(([nodeName, errors]) => {
    console.log(`\n🔧 ${nodeName}`);
    Object.entries(errors).forEach(([message, count]) => {
      console.log(`  • ${count}x ${message}`);
    });
  });
});