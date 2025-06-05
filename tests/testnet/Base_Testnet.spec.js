import { strict as assert } from 'assert';
import DKG from '../../index.js';
import { BLOCKCHAIN_IDS } from '../../constants/constants.js';
import 'dotenv/config';
import { randomUUID } from 'crypto';

const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0xC804682F30c611B7c2AD40F17587Ad5e04974418';
const PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY;

const nodes = [
  { name: 'Node 04', hostname: 'https://v6-pegasus-node-04.origin-trail.network' },
  { name: 'Node 01', hostname: 'https://v6-pegasus-node-01.origin-trail.network' },
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
  [BLOCKCHAIN_IDS.BASE_TESTNET]: {},
};

const errorStats = {};

function logError(error, nodeName) {
  console.log(`\n❌ Error on ${nodeName}`);
  console.log(`🔺 Type: ${error.name}`);
  console.log(`🧵 Message: ${error.message}`);
  if (error.stack) {
    const stackLines = error.stack.split('\n').filter(line => !line.includes('node_modules'));
    const lastRelevant = stackLines[1] || stackLines[0];
    if (lastRelevant) console.log(`📍 Location: ${lastRelevant.trim()}`);
  }
  if (!errorStats[nodeName]) errorStats[nodeName] = {};
  const key = `${error.name}: ${error.message.split('\n')[0]}`;
  errorStats[nodeName][key] = (errorStats[nodeName][key] || 0) + 1;
}

describe('DKG Asset Lifecycle on Base Testnet', function () {
  this.timeout(95 * 60 * 1000);

  it('should sequentially test all nodes', async () => {
    for (let currentIndex = 0; currentIndex < nodes.length; currentIndex++) {
      const { name, hostname } = nodes[currentIndex];
      let totalPassed = 0;
      let totalFailed = 0;
      const failedAssets = [];

      const DkgClient = new DKG({
        endpoint: hostname,
        port: OT_NODE_PORT,
        blockchain: {
          name: BLOCKCHAIN_IDS.BASE_TESTNET,
          publicKey: PUBLIC_KEY,
          privateKey: PRIVATE_KEY,
        },
        maxNumberOfRetries: 300,
        frequency: 2,
        contentType: 'all',
        nodeApiVersion: '/v1',
      });

      for (let i = 0; i < 10; i++) {
        console.log(`\n📡 Publishing KA #${i + 1} on ${name}`);
        const content = {
          public: {
            '@context': 'https://www.schema.org',
            '@id': `urn:ka:${name.replace(' ', '').toLowerCase()}-${randomUUID()}`,
            '@type': 'CreativeWork',
            name: `DKG ${getRandomWord()} ${Date.now()}`,
            description: getRandomDescription(),
          },
        };

        let ual = null;
        let step = 'publishing';
        let stepNodeName = name;

        try {
          await Promise.race([
            (async () => {
              const create_result = await DkgClient.asset.create(content, {
                epochsNum: 2,
                minimumNumberOfFinalizationConfirmations: 3,
                minimumNumberOfNodeReplications: 3,
              });

              assert.ok(create_result);
              assert.ok(create_result.operation);
              assert.strictEqual(create_result.operation.publish.status, 'COMPLETED');
              assert.ok(create_result.operation.finality);
              assert.strictEqual(create_result.operation.finality.status, 'FINALIZED');

              ual = create_result.UAL;
              assert.ok(ual);
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
              assert.ok(queryResult?.data?.length > 0);
              console.log(`✅ Query succeeded`);

              step = 'local get';
              const getResult = await DkgClient.asset.get(ual);
              assert.ok(getResult?.assertion);
              console.log(`✅ Local get succeeded`);

              step = 'remote get';
              const otherIndexes = nodes.map((_, i) => i).filter(i => i !== currentIndex);
              const remoteNode = nodes[otherIndexes[Math.floor(Math.random() * otherIndexes.length)]];
              stepNodeName = remoteNode.name;

              const RemoteDkgClient = new DKG({
                endpoint: remoteNode.hostname,
                port: OT_NODE_PORT,
                blockchain: {
                  name: BLOCKCHAIN_IDS.BASE_TESTNET,
                  publicKey: PUBLIC_KEY,
                  privateKey: PRIVATE_KEY,
                },
                maxNumberOfRetries: 300,
                frequency: 2,
                contentType: 'all',
                nodeApiVersion: '/v1',
              });

              const remoteGetResult = await RemoteDkgClient.asset.get(ual);
              assert.ok(remoteGetResult?.assertion);
              console.log(`✅ Remote get succeeded on ${remoteNode.name}`);

              totalPassed++;
            })(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout after 2 minutes during "${step}" on ${stepNodeName}`)), 2 * 60 * 1000)
            ),
          ]);
        } catch (error) {
          logError(error, stepNodeName);
          const reason = !ual
            ? 'Publish failed — No UAL'
            : `${step.charAt(0).toUpperCase() + step.slice(1)} failed — UAL: ${ual}`;
          failedAssets.push(`KA #${i + 1} (${reason})`);
          totalFailed++;
        }
      }

      console.log(`\n──────────── Summary for ${name} ────────────`);
      console.log(`✅ Success: ${totalPassed} / 15 -> ${((totalPassed / 15) * 100).toFixed(2)}%`);
      console.log(`❌ Failed: ${totalFailed}`);
      if (failedAssets.length > 0) {
        console.log(`🔍 Failed Assets:`);
        failedAssets.forEach(entry => console.log(`  - ${entry}`));
      }

      globalStats[BLOCKCHAIN_IDS.BASE_TESTNET][name] = {
        success: totalPassed,
        failed: totalFailed,
      };
    }
  });

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
});