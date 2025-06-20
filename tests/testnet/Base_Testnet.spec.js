import { BLOCKCHAINS } from '../../constants/constants.js';
BLOCKCHAINS.testnet['base:84532'].rpc = process.env.BASE_TESTNET_RPC;

import { strict as assert } from 'assert';
import DKG from '../../index.js';
import { BLOCKCHAIN_IDS } from '../../constants/constants.js';
import 'dotenv/config';
import { randomUUID } from 'crypto';
import fs from 'fs';

const OT_NODE_PORT = '8900';

const nodeKeys = {
  'Node 01': {
    publicKey: process.env.TESTNET_BASE_NODE01_PUBLIC_KEY,
    privateKey: process.env.TESTNET_BASE_NODE01_PRIVATE_KEY
  },
  'Node 04': {
    publicKey: process.env.TESTNET_BASE_NODE04_PUBLIC_KEY,
    privateKey: process.env.TESTNET_BASE_NODE04_PRIVATE_KEY
  },
  'Node 05': {
    publicKey: process.env.TESTNET_BASE_NODE05_PUBLIC_KEY,
    privateKey: process.env.TESTNET_BASE_NODE05_PRIVATE_KEY
  },
  'Node 06': {
    publicKey: process.env.TESTNET_BASE_NODE06_PUBLIC_KEY,
    privateKey: process.env.TESTNET_BASE_NODE06_PRIVATE_KEY
  },
  'Node 07': {
    publicKey: process.env.TESTNET_BASE_NODE07_PUBLIC_KEY,
    privateKey: process.env.TESTNET_BASE_NODE07_PRIVATE_KEY
  },
  'Node 08': {
    publicKey: process.env.TESTNET_BASE_NODE08_PUBLIC_KEY,
    privateKey: process.env.TESTNET_BASE_NODE08_PRIVATE_KEY
  },
  'Node 09': {
    publicKey: process.env.TESTNET_BASE_NODE09_PUBLIC_KEY,
    privateKey: process.env.TESTNET_BASE_NODE09_PRIVATE_KEY
  },
  'Node 10': {
    publicKey: process.env.TESTNET_BASE_NODE10_PUBLIC_KEY,
    privateKey: process.env.TESTNET_BASE_NODE10_PRIVATE_KEY
  },
  'Node 13': {
    publicKey: process.env.TESTNET_BASE_NODE13_PUBLIC_KEY,
    privateKey: process.env.TESTNET_BASE_NODE13_PRIVATE_KEY
  },
  'Node 14': {
    publicKey: process.env.TESTNET_BASE_NODE14_PUBLIC_KEY,
    privateKey: process.env.TESTNET_BASE_NODE14_PRIVATE_KEY
  },
  'Node 21': {
    publicKey: process.env.TESTNET_BASE_NODE21_PUBLIC_KEY,
    privateKey: process.env.TESTNET_BASE_NODE21_PRIVATE_KEY
  },
  'Node 23': {
    publicKey: process.env.TESTNET_BASE_NODE23_PUBLIC_KEY,
    privateKey: process.env.TESTNET_BASE_NODE23_PRIVATE_KEY
  },
  'Node 37': {
    publicKey: process.env.TESTNET_BASE_NODE37_PUBLIC_KEY,
    privateKey: process.env.TESTNET_BASE_NODE37_PRIVATE_KEY
  }
};

const nodes = [
  { name: 'Node 01', hostname: 'https://v6-pegasus-node-01.origin-trail.network' },
  { name: 'Node 04', hostname: 'https://v6-pegasus-node-04.origin-trail.network' },
  { name: 'Node 05', hostname: 'https://v6-pegasus-node-05.origin-trail.network' },
  { name: 'Node 06', hostname: 'https://v6-pegasus-node-06.origin-trail.network' },
  { name: 'Node 07', hostname: 'https://v6-pegasus-node-07.origin-trail.network' },
  { name: 'Node 08', hostname: 'https://v6-pegasus-node-08.origin-trail.network' },
  { name: 'Node 09', hostname: 'https://v6-pegasus-node-09.origin-trail.network' },
  { name: 'Node 10', hostname: 'https://v6-pegasus-node-10.origin-trail.network' },
  { name: 'Node 13', hostname: 'https://v6-pegasus-node-13.origin-trail.network' },
  { name: 'Node 14', hostname: 'https://v6-pegasus-node-14.origin-trail.network' },
  { name: 'Node 21', hostname: 'https://v6-pegasus-node-21.origin-trail.network' },
  { name: 'Node 23', hostname: 'https://v6-pegasus-node-23.origin-trail.network' },
  { name: 'Node 37', hostname: 'https://v6-pegasus-node-37.origin-trail.network' },
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

function formatDuration(ms) {
  if (!ms || isNaN(ms)) return `0.00 seconds`;

  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)} seconds`;
  } else {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins} min ${secs} sec`;
  }
}

function safeRate(success, fail) {
  const total = success + fail;
  return total === 0 ? '0.00' : ((success / total) * 100).toFixed(2);
}

function logError(error, nodeName, step = 'unknown') {
  console.log(`\n❌ Error on ${nodeName} during ${step}`);
  console.log(`🔺 Type: ${error.name}`);
  console.log(`🧵 Message: ${error.message}`);
  if (error.stack) {
    const stackLines = error.stack.split('\n').filter(line => !line.includes('node_modules'));
    const lastRelevant = stackLines[1] || stackLines[0];
    if (lastRelevant) console.log(`📍 Location: ${lastRelevant.trim()}`);
  }

  if (!errorStats[nodeName]) errorStats[nodeName] = {};

  const key = `${step} — ${error.name}: ${error.message.split('\n')[0]}`;
  errorStats[nodeName][key] = (errorStats[nodeName][key] || 0) + 1;
}

describe('DKG Asset Lifecycle on Base Testnet', function () {
  this.timeout(130 * 60 * 1000);

  it('should sequentially test selected node(s)', async () => {
    const NODE_TO_TEST = process.env.NODE_TO_TEST;

    const nodesToRun = NODE_TO_TEST
      ? nodes.filter((node) => node.name === NODE_TO_TEST)
      : nodes;

    console.log(`\n🚀 Running test for node: ${nodesToRun.map((n) => n.name).join(', ')}`);

    for (let currentIndex = 0; currentIndex < nodesToRun.length; currentIndex++) {
      const { name, hostname } = nodesToRun[currentIndex];

      // Initialize per-step counters:
      let publishSuccess = 0;
      let publishFail = 0;
      let querySuccess = 0;
      let queryFail = 0;
      let localGetSuccess = 0;
      let localGetFail = 0;
      let remoteGetSuccess = 0;
      let remoteGetFail = 0;

      const publishDurations = [];
      const queryDurations = [];
      const localGetDurations = [];
      const remoteGetDurations = [];

      const failedAssets = [];

      const DkgClient = new DKG({
        endpoint: hostname,
        port: OT_NODE_PORT,
        blockchain: {
          name: BLOCKCHAIN_IDS.BASE_TESTNET,
          publicKey: nodeKeys[name].publicKey,
          privateKey: nodeKeys[name].privateKey,
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
              // Measure publish time:
              const publishStart = Date.now();

              const create_result = await DkgClient.asset.create(content, {
                epochsNum: 2,
                minimumNumberOfFinalizationConfirmations: 1,
                minimumNumberOfNodeReplications: 3,
              });

              const publishEnd = Date.now();
              publishDurations.push(publishEnd - publishStart);

              assert.ok(create_result);
              assert.ok(create_result.operation);
              assert.strictEqual(create_result.operation.publish.status, 'COMPLETED');
              assert.ok(create_result.operation.finality);
              assert.strictEqual(create_result.operation.finality.status, 'FINALIZED');

              ual = create_result.UAL;
              assert.ok(ual);
              console.log(`✅ Published KA #${i + 1} with UAL: ${ual}`);
              publishSuccess++;

            })(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout after 3 minutes during "${step}" on ${stepNodeName}`)), 3 * 60 * 1000)
            ),
          ]);
        } catch (error) {
          logError(error, stepNodeName, step);
          const reason = 'Publish failed — No UAL';
          failedAssets.push(`KA #${i + 1} (${reason})`);
          publishFail++;
          ual = 'did:dkg:base:84532/0xd5550173b0f7b8766ab2770e4ba86caf714a5af5/195774';
          console.log(`⚠️ Using fallback UAL: ${ual}`);
        }

        // Continue with query, local get, and remote get regardless of publish status
        try {
          step = 'querying';
          const queryStart = Date.now();
          await Promise.race([
            (async () => {
              const queryResult = await DkgClient.graph.query(
                `PREFIX schema: <http://schema.org/>
                 SELECT ?s ?name ?description
                 WHERE {
                   ?s schema:name ?name ; schema:description ?description .
                 }`,
                'SELECT'
              );
              const queryEnd = Date.now();
              queryDurations.push(queryEnd - queryStart);
              assert.ok(queryResult?.data?.length > 0);
              console.log(`✅ Query succeeded`);
              querySuccess++;
            })(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout after 3 minutes during "${step}" on ${stepNodeName}`)), 3 * 60 * 1000)
            ),
          ]);
        } catch (error) {
          logError(error, stepNodeName, step);
          const reason = `Query failed — UAL: ${ual}`;
          failedAssets.push(`KA #${i + 1} (${reason})`);
          queryFail++;
        }

        try {
          step = 'local get';
          const localGetStart = Date.now();
          await Promise.race([
            (async () => {
              const getResult = await DkgClient.asset.get(ual);
              const localGetEnd = Date.now();
              localGetDurations.push(localGetEnd - localGetStart);
              assert.ok(getResult?.assertion);
              console.log(`✅ Local Get Succeeded`);
              localGetSuccess++;
            })(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout after 3 minutes during "${step}" on ${stepNodeName}`)), 3 * 60 * 1000)
            ),
          ]);
        } catch (error) {
          logError(error, stepNodeName, step);
          const reason = `Local Get failed — UAL: ${ual}`;
          failedAssets.push(`KA #${i + 1} (${reason})`);
          localGetFail++;
        }

        try {
          step = 'get';
          const otherIndexes = nodes.map((_, i) => i).filter(i => i !== currentIndex);
          const remoteNode = nodes[otherIndexes[Math.floor(Math.random() * otherIndexes.length)]];
          stepNodeName = remoteNode.name;
          const remoteGetStart = Date.now();
          await Promise.race([
            (async () => {
              const RemoteDkgClient = new DKG({
                endpoint: remoteNode.hostname,
                port: OT_NODE_PORT,
                blockchain: {
                  name: BLOCKCHAIN_IDS.BASE_TESTNET,
                  publicKey: nodeKeys[remoteNode.name].publicKey,
                  privateKey: nodeKeys[remoteNode.name].privateKey,
                },
                maxNumberOfRetries: 300,
                frequency: 2,
                contentType: 'all',
                nodeApiVersion: '/v1',
              });
              const remoteGetResult = await RemoteDkgClient.asset.get(ual);
              const remoteGetEnd = Date.now();
              remoteGetDurations.push(remoteGetEnd - remoteGetStart);
              assert.ok(remoteGetResult?.assertion);
              console.log(`✅ Get Succeeded on ${remoteNode.name}`);
              remoteGetSuccess++;
            })(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout after 3 minutes during "${step}" on ${stepNodeName}`)), 3 * 60 * 1000)
            ),
          ]);
        } catch (error) {
          logError(error, stepNodeName, step);
          const reason = `Get failed — UAL: ${ual}`;
          failedAssets.push(`KA #${i + 1} (${reason})`);
          remoteGetFail++;
        }
      }

      const avgPublishMs = publishSuccess > 0 && publishDurations.length > 0 ? publishDurations.reduce((a, b) => a + b, 0) / publishDurations.length : 0;
      const avgQueryMs = querySuccess > 0 && queryDurations.length > 0 ? queryDurations.reduce((a, b) => a + b, 0) / queryDurations.length : 0;
      const avgLocalGetMs = localGetSuccess > 0 && localGetDurations.length > 0 ? localGetDurations.reduce((a, b) => a + b, 0) / localGetDurations.length : 0;
      const avgRemoteGetMs = remoteGetSuccess > 0 && remoteGetDurations.length > 0 ? remoteGetDurations.reduce((a, b) => a + b, 0) / remoteGetDurations.length : 0;

      console.log(`\n──────────── Summary for ${name} ────────────`);
      if (failedAssets.length > 0) {
        console.log(`🔍 Failed Assets:`);
        failedAssets.forEach(entry => console.log(`  - ${entry}`));
      } else {
        console.log(`✅ All assets processed successfully`);
      }

      // Save stats for global summary:
      globalStats[BLOCKCHAIN_IDS.BASE_TESTNET][name] = {
        publishSuccess,
        publishFail,
        querySuccess,
        queryFail,
        localGetSuccess,
        localGetFail,
        remoteGetSuccess,
        remoteGetFail,
        avgPublishMs,
        avgQueryMs,
        avgLocalGetMs,
        avgRemoteGetMs,
      };

      const summary = {
        blockchain_name: BLOCKCHAIN_IDS.BASE_TESTNET,
        node_name: name,
        publish_success_rate: safeRate(publishSuccess, publishFail),
        query_success_rate: safeRate(querySuccess, queryFail),
        publisher_get_success_rate: safeRate(localGetSuccess, localGetFail),
        non_publisher_get_success_rate: safeRate(remoteGetSuccess, remoteGetFail),
        average_publish_time: (avgPublishMs / 1000).toFixed(2),
        average_query_time: (avgQueryMs / 1000).toFixed(2),
        average_publisher_get_time: (avgLocalGetMs / 1000).toFixed(2),
        average_non_publisher_get_time: (avgRemoteGetMs / 1000).toFixed(2),
        time_stamp: new Date().toISOString()
    };

      // Define safe file name:
      const summaryFileName = `summary_${name.replace(' ', '_')}.json`;
      fs.writeFileSync(summaryFileName, JSON.stringify(summary, null, 2));
      console.log(`✅ Saved summary to ${summaryFileName}`);
      const errorsFileName = `errors_${name.replace(' ', '_')}.json`;
      fs.writeFileSync(errorsFileName, JSON.stringify(errorStats[name] || {}, null, 2));
      console.log(`✅ Saved errors to ${errorsFileName}`);
    }
  });

  after(() => {
    console.log(`\n\n📊 Global Publish Summary:`);
    Object.entries(globalStats).forEach(([blockchain, nodeStats]) => {
      console.log(`\n🔗 Blockchain: ${blockchain}`);
      Object.entries(nodeStats).forEach(([nodeName, stats]) => {
        console.log(`  • ${nodeName}:`);
        console.log(`    🔸 Publish: ✅ ${stats.publishSuccess} / ❌ ${stats.publishFail} -> ${safeRate(stats.publishSuccess, stats.publishFail)}%`);
        console.log(`    🔸 Query:   ✅ ${stats.querySuccess} / ❌ ${stats.queryFail} -> ${safeRate(stats.querySuccess, stats.queryFail)}%`);
        console.log(`    🔸 Local Get: ✅ ${stats.localGetSuccess} / ❌ ${stats.localGetFail} -> ${safeRate(stats.localGetSuccess, stats.localGetFail)}%`);
        console.log(`    🔸 Get: ✅ ${stats.remoteGetSuccess} / ❌ ${stats.remoteGetFail} -> ${safeRate(stats.remoteGetSuccess, stats.remoteGetFail)}%`);
        console.log(`    ⏱️ Avg Publish Time: ${formatDuration(stats.avgPublishMs)}`);
        console.log(`    ⏱️ Avg Query Time: ${formatDuration(stats.avgQueryMs)}`);
        console.log(`    ⏱️ Avg Local Get Time: ${formatDuration(stats.avgLocalGetMs)}`);
        console.log(`    ⏱️ Avg Get Time: ${formatDuration(stats.avgRemoteGetMs)}`);
      });
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
