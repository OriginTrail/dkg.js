import { BLOCKCHAINS } from '../../constants/constants.js';
BLOCKCHAINS.testnet['base:84532'].rpc = process.env.BASE_TESTNET_RPC;

import { strict as assert } from 'assert';
import DKG from '../../index.js';
import { BLOCKCHAIN_IDS } from '../../constants/constants.js';
import 'dotenv/config';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { Interface } from 'ethers';

const OT_NODE_PORT = '8900';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ERC1155_INTERFACE = new Interface([
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
  'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
]);

function extractMintedTokenIdsFromReceipt(receipt) {
  const logs = receipt?.logs || [];
  const mintedIds = [];
  for (const log of logs) {
    try {
      const parsed = ERC1155_INTERFACE.parseLog({ topics: log.topics, data: log.data });
      if (parsed.name === 'TransferSingle') {
        const from = String(parsed.args.from || '').toLowerCase();
        if (from === ZERO_ADDRESS) {
          mintedIds.push(String(parsed.args.id));
        }
      }
      if (parsed.name === 'TransferBatch') {
        const from = String(parsed.args.from || '').toLowerCase();
        if (from === ZERO_ADDRESS) {
          for (const id of parsed.args.ids || []) {
            mintedIds.push(String(id));
          }
        }
      }
    } catch {
      // Ignore non-ERC1155 logs.
    }
  }
  return mintedIds;
}

function buildChildUalsFromRoot(rootUal, tokenIds) {
  if (!rootUal || !Array.isArray(tokenIds) || tokenIds.length === 0) {
    return [];
  }
  const [didPrefix, contractAddress] = rootUal.split('/');
  if (!didPrefix || !contractAddress) {
    return [];
  }
  return tokenIds.map((tokenId) => `${didPrefix}/${contractAddress}/${tokenId}`);
}

function getNodeWallet(nodeId, walletSlot = null) {
  const resolvedWalletSlot = String(walletSlot || process.env.TEST_WALLET_SLOT || '01').padStart(2, '0');
  const prefixedPublic = process.env[`JS_TESTNET_BASE_NODE${nodeId}_W${resolvedWalletSlot}_PUBLIC_KEY`];
  const prefixedPrivate = process.env[`JS_TESTNET_BASE_NODE${nodeId}_W${resolvedWalletSlot}_PRIVATE_KEY`];
  const legacyPublic = process.env[`JS_TESTNET_BASE_NODE${nodeId}_PUBLIC_KEY`];
  const legacyPrivate = process.env[`JS_TESTNET_BASE_NODE${nodeId}_PRIVATE_KEY`];

  return {
    publicKey: prefixedPublic || legacyPublic,
    privateKey: prefixedPrivate || legacyPrivate,
  };
}

function getNodeIdFromName(nodeName) {
  return nodeName.split(' ')[1];
}

const nodes = [
  { name: 'Node 01', hostname: 'https://v6-pegasus-node-02.origin-trail.network' },
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

const TEST_CONTENT_SIZE_KB = Number(process.env.TEST_CONTENT_SIZE_KB || 1);
const TEST_ENTITY_COUNT = Number(process.env.TEST_ENTITY_COUNT || 500);
const TEST_COMPACT_CHUNK_MODE = String(process.env.TEST_COMPACT_CHUNK_MODE || 'false').toLowerCase() === 'true';
const TEST_COMPACT_CHUNK_IDS = Number(process.env.TEST_COMPACT_CHUNK_IDS || 8000);
const TEST_COMPACT_CHUNK_EDGES = Number(process.env.TEST_COMPACT_CHUNK_EDGES || 2);

function createLargeText(sizeBytes) {
  const resolvedSizeBytes = Math.max(0, Math.floor(sizeBytes));
  if (resolvedSizeBytes === 0) return '';

  const chunk = 'OTDKG_LOAD_PAYLOAD_';
  return chunk.repeat(Math.ceil(resolvedSizeBytes / chunk.length)).slice(0, resolvedSizeBytes);
}

function buildContent(nodeName, kaNumber) {
  const rootId = `urn:ka:${nodeName.replace(' ', '').toLowerCase()}-${randomUUID()}`;
  const entities = Array.from({ length: TEST_ENTITY_COUNT }, (_, index) => ({
    '@id': `urn:entity:${nodeName.replace(' ', '').toLowerCase()}:${kaNumber}:${index + 1}:${randomUUID()}`,
    '@type': 'Thing',
    name: `${getRandomWord()}-${index + 1}`,
    description: getRandomDescription(),
    isPartOf: { '@id': rootId },
  }));

  const datasetNode = {
    '@id': rootId,
    '@type': 'Dataset',
    name: `DKG ${getRandomWord()} ${Date.now()}`,
    description: getRandomDescription(),
    entityCount: TEST_ENTITY_COUNT,
    kaNumber,
    generatedAt: new Date().toISOString(),
    metadata: {
      loadProfile: 'high-entity-count',
      targetSizeKb: TEST_CONTENT_SIZE_KB,
      actualEntityCount: TEST_ENTITY_COUNT,
      filler: '',
    },
  };

  const graph = [
    datasetNode,
    ...entities,
  ];

  const publicContent = {
    '@context': 'https://www.schema.org',
    '@graph': graph,
  };

  const targetBytes = Math.max(0, Math.floor(TEST_CONTENT_SIZE_KB * 1024));
  const currentBytes = Buffer.byteLength(JSON.stringify(publicContent), 'utf8');
  const fillerBytes = Math.max(0, targetBytes - currentBytes);
  publicContent['@graph'][0].metadata.filler = createLargeText(fillerBytes);

  return { public: publicContent };
}

function buildCompactChunkContent(nodeName, kaNumber) {
  const nodeKey = nodeName.replace(' ', '').toLowerCase();
  const chunkRoot = `urn:chunk:${nodeKey}:${kaNumber}:${randomUUID()}`;
  const mentionPredicate = 'https://dkg.synthetic/vocab/mentions';
  const weightPredicate = 'https://dkg.synthetic/vocab/weight';
  const ids = Array.from(
    { length: TEST_COMPACT_CHUNK_IDS },
    (_, index) => `${chunkRoot}:id:${index + 1}`,
  );

  const graph = ids.map((subjectId, index) => ({
    '@id': subjectId,
    [weightPredicate]: (index % 10) + 1,
    [mentionPredicate]: Array.from(
      { length: TEST_COMPACT_CHUNK_EDGES },
      (_, edgeIndex) => ({ '@id': ids[(index + edgeIndex + 1) % ids.length] }),
    ),
  }));

  graph.push({
    '@id': `${chunkRoot}:meta`,
    'https://dkg.synthetic/vocab/chunkOrdinal': kaNumber,
    'https://dkg.synthetic/vocab/node': nodeName,
    [mentionPredicate]: ids.slice(0, Math.min(10, ids.length)).map((id) => ({ '@id': id })),
  });

  return {
    public: {
      '@context': { '@vocab': 'https://dkg.synthetic/vocab/' },
      '@graph': graph,
    },
  };
}

function buildPublishContent(nodeName, kaNumber) {
  if (TEST_COMPACT_CHUNK_MODE) {
    return buildCompactChunkContent(nodeName, kaNumber);
  }
  return buildContent(nodeName, kaNumber);
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Categorize error by service/component using stack trace analysis
 */
function categorizeErrorService(error) {
  const stack = error.stack || '';
  const message = error.message.toLowerCase();
  
  // Check stack trace first (most reliable)
  if (stack.includes('blockchain-service')) {
    return 'blockchain-service';
  }
  if (stack.includes('node-api-service') || stack.includes('http-service')) {
    return 'node-api-service';
  }
  if (stack.includes('graph-operations-manager')) {
    return 'graph-operations';
  }
  if (stack.includes('asset-operations-manager')) {
    return 'asset-operations';
  }
  if (stack.includes('assertion-operations-manager')) {
    return 'assertion-operations';
  }
  
  // Fallback to message analysis if stack doesn't help
  
  // Blockchain errors (from RPC/smart contracts)
  if (message.includes('vm exception') || message.includes('revert')) {
    return 'blockchain-rpc';
  }
  if (message.includes('already known') || message.includes('nonce too low') || message.includes('replacement transaction underpriced')) {
    return 'blockchain-rpc';
  }
  if (message.includes('insufficient funds') || message.includes('gas required exceeds')) {
    return 'blockchain-rpc';
  }
  
  // ot-node API errors
  if (message.includes('operation exceeded maximum wait time')) {
    return 'ot-node-api';
  }
  if (message.includes('unable to get assertion') || message.includes('connect etimedout')) {
    return 'ot-node-api';
  }
  if (message.includes('publish_replicate_start') || (message.includes('finality') && !message.includes('blockchain'))) {
    return 'ot-node-finality';
  }
  
  // Query/Blazegraph errors
  if (message.includes('query') || message.includes('sparql')) {
    return 'blazegraph';
  }
  
  // Test timeouts (from test suite)
  if (message.includes('timeout after 3 minutes')) {
    return 'test-timeout';
  }
  
  // Network errors
  if (message.includes('econnrefused') || message.includes('econnreset') || message.includes('etimedout')) {
    return 'network';
  }
  
  // Unknown/Other
  return 'other';
}

function logError(error, nodeName, step = 'unknown', remoteNodeName = null, kaNumber = null) {
  console.log(`\n❌ Error on ${nodeName} during ${step}`);
  console.log(`Type: ${error.name}`);
  
  // Clean up message for revert errors (remove ugly transaction receipt JSON)
  let cleanMessage = error.message;
  
  // Check if this is a revert error with transaction receipt JSON
  if (cleanMessage.includes('Transaction has been reverted') || cleanMessage.includes('VM Exception')) {
    // Only show first line, strip out everything after (the JSON receipt)
    cleanMessage = cleanMessage.split('\n')[0];
    
    // If error.data exists, we'll show it separately, so just show the main error line
    if (error.data && typeof error.data === 'string' && error.data.startsWith('0x')) {
      console.log(`Message: ${cleanMessage}`);
      console.log(`Error Data (hex): ${error.data}`);
    } else {
      console.log(`Message: ${cleanMessage}`);
    }
  } else {
    // For non-revert errors, show full message
    console.log(`Message: ${cleanMessage}`);
  }
  
  if (error.stack) {
    const stackLines = error.stack.split('\n').filter(line => !line.includes('node_modules'));
    const lastRelevant = stackLines[1] || stackLines[0];
    if (lastRelevant) console.log(`Location: ${lastRelevant.trim()}`);
  }

  if (!errorStats[nodeName]) errorStats[nodeName] = {};

  // Clean up error message for aggregation (truncate long hex strings)
  let cleanErrorMessage = error.message.split('\n')[0];
  
  // Handle long blockchain error messages
  if (cleanErrorMessage.includes('Returned error:') && cleanErrorMessage.includes('0x')) {
    // Extract the error type and truncate the long hex part
    const match = cleanErrorMessage.match(/Returned error: ([^(]+)/);
    if (match) {
      const errorType = match[1].trim();
      cleanErrorMessage = `Returned error: ${errorType}`;
    }
  }
  
  // Append error data hex to message if available (for aggregation)
  let errorDataSuffix = '';
  if (error.data && typeof error.data === 'string' && error.data.startsWith('0x')) {
    errorDataSuffix = ` | Error Data: ${error.data}`;
  }
  
  // Categorize error by service using stack trace
  const service = categorizeErrorService(error);
  
  // Create aggregated key (without KA number for counting) - use clean message
  let aggregatedKey = `${step} — ${error.name}: ${cleanErrorMessage}${errorDataSuffix}`;
  if (remoteNodeName) {
    // Only add remote node name if it's not already in the error message
    if (!error.message.includes(`on ${remoteNodeName}`)) {
      aggregatedKey += ` on ${remoteNodeName}`;
    }
  }
  
  // Create detailed key (with KA number for database processing) - keep full message for DB
  let detailedKey = `${step} — ${error.name}: ${error.message.split('\n')[0]}`;
  if (remoteNodeName) {
    // Only add remote node name if it's not already in the error message
    if (!error.message.includes(`on ${remoteNodeName}`)) {
      detailedKey += ` on ${remoteNodeName}`;
    }
  }
  if (kaNumber) {
    detailedKey += ` for KA #${kaNumber}`;
  }

  // Store both aggregated and detailed versions with service info
  if (!errorStats[nodeName].aggregated) errorStats[nodeName].aggregated = {};
  if (!errorStats[nodeName].detailed) errorStats[nodeName].detailed = {};
  if (!errorStats[nodeName].services) errorStats[nodeName].services = {};
  
  errorStats[nodeName].aggregated[aggregatedKey] = (errorStats[nodeName].aggregated[aggregatedKey] || 0) + 1;
  errorStats[nodeName].detailed[detailedKey] = (errorStats[nodeName].detailed[detailedKey] || 0) + 1;
  errorStats[nodeName].services[aggregatedKey] = service; // Store service for this error
}

describe('DKG Asset Lifecycle on Base Testnet', function () {
  this.timeout(130 * 60 * 1000);

  it('should sequentially test selected node(s)', async () => {
    const NODE_TO_TEST = process.env.NODE_TO_TEST;

    const nodesToRun = NODE_TO_TEST
      ? nodes.filter((node) => node.name === NODE_TO_TEST)
      : nodes;

    console.log(`\nRunning test for node: ${nodesToRun.map((n) => n.name).join(', ')}`);

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

      const PARALLEL_KA_BATCH_SIZE = Number(process.env.TEST_PARALLEL_KA_BATCH_SIZE || 10);
      const TEST_KA_BATCHES = Number(process.env.TEST_KA_BATCHES || 10);
      const TEST_WALLET_SLOTS = Number(process.env.TEST_WALLET_SLOTS || 10);
      const TEST_TARGET_UALS = Number(process.env.TEST_TARGET_UALS || 0);
      const TEST_TARGET_MINTED_UALS = Number(process.env.TEST_TARGET_MINTED_UALS || 0);
      const TEST_BATCH_DELAY_MS = Number(process.env.TEST_BATCH_DELAY_MS || 0);
      const TEST_RATE_LIMIT_COOLDOWN_MS = Number(process.env.TEST_RATE_LIMIT_COOLDOWN_MS || 65000);
      const TEST_RATE_LIMIT_MAX_RETRIES = Number(process.env.TEST_RATE_LIMIT_MAX_RETRIES || 3);
      const isTargetUalMode = TEST_TARGET_UALS > 0;
      const isTargetMintedMode = TEST_TARGET_MINTED_UALS > 0;
      const totalKAs = isTargetUalMode ? TEST_TARGET_UALS : (PARALLEL_KA_BATCH_SIZE * TEST_KA_BATCHES);
      const totalBatches = isTargetUalMode
        ? Math.ceil(totalKAs / PARALLEL_KA_BATCH_SIZE)
        : TEST_KA_BATCHES;
      const estimatedMintedPerSuccessfulPublish = TEST_COMPACT_CHUNK_MODE
        ? (TEST_COMPACT_CHUNK_IDS + 1)
        : (TEST_ENTITY_COUNT + 2);
      const walletPublishStats = {};
      for (let slot = 1; slot <= TEST_WALLET_SLOTS; slot++) {
        const slotKey = String(slot).padStart(2, '0');
        walletPublishStats[slotKey] = {
          attempted: 0,
          success: 0,
          fail: 0,
          mintedChildUals: 0,
        };
      }
      let mintedChildUalTotal = 0;
      let rateLimit429Count = 0;
      let rateLimitRetryCount = 0;
      const DEFAULT_MAX_ATTEMPTS = isTargetMintedMode
        ? Math.max(PARALLEL_KA_BATCH_SIZE, Math.ceil(TEST_TARGET_MINTED_UALS / Math.max(1, estimatedMintedPerSuccessfulPublish)) * 3)
        : totalKAs;
      const TEST_MAX_ATTEMPTS = Number(process.env.TEST_MAX_ATTEMPTS || DEFAULT_MAX_ATTEMPTS);

      if (isTargetUalMode) {
        console.log(`Load mode on ${name}: target publish attempts = ${totalKAs} KAs`);
      } else if (isTargetMintedMode) {
        console.log(`Load mode on ${name}: target child UALs from mint logs = ${TEST_TARGET_MINTED_UALS}`);
      } else {
        console.log(`Load mode on ${name}: ${TEST_KA_BATCHES} batches x ${PARALLEL_KA_BATCH_SIZE} parallel publishes = ${totalKAs} total KAs`);
      }
      console.log(`Wallet mode on ${name}: rotating through ${TEST_WALLET_SLOTS} wallet slots`);
      if (TEST_COMPACT_CHUNK_MODE) {
        console.log(`Content mode on ${name}: compact chunk mode (${TEST_COMPACT_CHUNK_IDS} ids/chunk, ${TEST_COMPACT_CHUNK_EDGES} edges/id)`);
      }
      if (TEST_BATCH_DELAY_MS > 0) {
        console.log(`Pacing mode on ${name}: ${TEST_BATCH_DELAY_MS}ms delay between batches`);
      }
      console.log(`Rate-limit mode on ${name}: cooldown=${TEST_RATE_LIMIT_COOLDOWN_MS}ms, max429Retries=${TEST_RATE_LIMIT_MAX_RETRIES}`);
      console.log(`Payload mode on ${name}: ~${TEST_CONTENT_SIZE_KB}KB public assertion payload per KA`);
      console.log(`Entity mode on ${name}: ${TEST_ENTITY_COUNT} @id entities per published JSON-LD`);

      const processKnowledgeAsset = async (kaNumber, walletSlot) => {
        console.log(`\nPublishing KA #${kaNumber} on ${name} with wallet W${walletSlot}`);
        if (walletPublishStats[walletSlot]) {
          walletPublishStats[walletSlot].attempted++;
        }
        const content = buildPublishContent(name, kaNumber);

        let ual = null;
        let create_result = null;
        let step = 'publishing';
        let stepNodeName = name;
        const nodeId = getNodeIdFromName(name);
        const publishingWallet = getNodeWallet(nodeId, walletSlot);
        const DkgClient = new DKG({
          endpoint: hostname,
          port: OT_NODE_PORT,
          blockchain: {
            name: BLOCKCHAIN_IDS.BASE_TESTNET,
            publicKey: publishingWallet.publicKey,
            privateKey: publishingWallet.privateKey,
          },
          maxNumberOfRetries: 300,
          frequency: 2,
          contentType: 'all',
          nodeApiVersion: '/v1',
        });

        let publishSucceeded = false;
        let terminalPublishError = null;
        const maxPublishAttemptsPerKa = 1 + TEST_RATE_LIMIT_MAX_RETRIES;
        let rateLimitedRetriesUsed = 0;
        let publishAttempt = 0;
        while (!publishSucceeded && publishAttempt < maxPublishAttemptsPerKa) {
          publishAttempt++;
          try {
            await Promise.race([
              (async () => {
                const publishStart = Date.now();
                create_result = await DkgClient.asset.create(content, {
                  epochsNum: 2,
                  minimumNumberOfFinalizationConfirmations: 0,
                });
                const publishEnd = Date.now();
                publishDurations.push(publishEnd - publishStart);

                assert.ok(create_result);
                assert.ok(create_result.operation);
                const publishOperation = create_result.operation.publish || {};
                const publishStatus = publishOperation.status || 'UNKNOWN';
                if (publishStatus !== 'COMPLETED') {
                  const publishOperationId = create_result.operation?.operationId || create_result.operationId || publishOperation.operationId || 'N/A';
                  let publishReason = publishOperation.errorMessage || publishOperation.reason || publishOperation.message || publishOperation.error || publishOperation.statusMessage;
                  if (!publishReason) {
                    publishReason = JSON.stringify(publishOperation);
                  }
                  throw new Error(`Publish status ${publishStatus} (operationId=${publishOperationId}): ${publishReason}`);
                }

                const finalityOperation = create_result.operation.finality || {};
                const finalityStatus = finalityOperation.status || 'UNKNOWN';
                if (finalityStatus !== 'FINALIZED') {
                  const finalityOperationId = create_result.operation?.operationId || create_result.operationId || finalityOperation.operationId || 'N/A';
                  let finalityReason = finalityOperation.errorMessage || finalityOperation.reason || finalityOperation.message || finalityOperation.error || finalityOperation.statusMessage;
                  if (!finalityReason) {
                    finalityReason = JSON.stringify(finalityOperation);
                  }
                  throw new Error(`Finality status ${finalityStatus} (operationId=${finalityOperationId}): ${finalityReason}`);
                }

                ual = create_result.UAL;
                const operationId = create_result.operation?.operationId || create_result.operationId || (create_result.operation?.publish?.operationId) || 'N/A';
                assert.ok(ual);
                console.log(`✅ Published KA #${kaNumber} | UAL: ${ual} | Operation ID: ${operationId}`);
                const mintReceipt = create_result.operation?.mintKnowledgeCollection;
                const mintedTokenIds = extractMintedTokenIdsFromReceipt(mintReceipt);
                const childUals = buildChildUalsFromRoot(ual, mintedTokenIds);
                const mintedChildCount = childUals.length > 0 ? childUals.length : estimatedMintedPerSuccessfulPublish;
                console.log(`🔢 Minted child assets in tx: ${mintedChildCount}`);
                if (childUals.length > 0) {
                  console.log('📌 Child UAL sample (first 5):');
                  childUals.slice(0, 5).forEach((childUal) => console.log(`  - ${childUal}`));
                }
                if (walletPublishStats[walletSlot]) {
                  walletPublishStats[walletSlot].success++;
                  walletPublishStats[walletSlot].mintedChildUals += mintedChildCount;
                }
                mintedChildUalTotal += mintedChildCount;
                publishSuccess++;
                publishSucceeded = true;
              })(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout after 6 minutes during "publishing" on ${stepNodeName}`)), 6 * 60 * 1000)
              ),
            ]);
          } catch (error) {
            const message = String(error?.message || '');
            const isRateLimited = message.includes('status code 429') || message.toLowerCase().includes('too many requests');
            if (isRateLimited && rateLimitedRetriesUsed < TEST_RATE_LIMIT_MAX_RETRIES) {
              rateLimit429Count++;
              rateLimitRetryCount++;
              rateLimitedRetriesUsed++;
              console.log(`⏳ Rate limited on KA #${kaNumber} (W${walletSlot}). Retry ${rateLimitedRetriesUsed}/${TEST_RATE_LIMIT_MAX_RETRIES} after ${TEST_RATE_LIMIT_COOLDOWN_MS}ms`);
              await sleep(TEST_RATE_LIMIT_COOLDOWN_MS);
              continue;
            }
            terminalPublishError = error;
            break;
          }
        }

        if (!publishSucceeded) {
          const error = terminalPublishError || new Error('Publishing failed without explicit error');
          logError(error, stepNodeName, step, null, kaNumber);

          let operationId = 'N/A';
          let actualUal = null;

          if (error.UAL) {
            actualUal = error.UAL;
          }
          if (error.operationId) {
            operationId = error.operationId;
          }

          if (!actualUal && create_result) {
            actualUal = create_result.UAL || null;
            if (operationId === 'N/A') {
              operationId = create_result.operation?.operationId || create_result.operationId || (create_result.operation?.publish?.operationId) || 'N/A';
            }
          }

          if (actualUal) {
            console.log(`❌ Publish failed but got UAL: ${actualUal} | Operation ID: ${operationId}`);
            ual = actualUal;
          } else {
            console.log(`❌ Publish failed | No UAL | Operation ID: ${operationId}`);
            ual = 'did:dkg:base:84532/0xd5550173b0f7b8766ab2770e4ba86caf714a5af5/237041';
            console.log(`ℹ️  Using fallback UAL for remaining operations: ${ual}`);
          }

          const reason = actualUal ? 'Publish failed but UAL exists' : 'Publish failed — No UAL';
          failedAssets.push(`KA #${kaNumber} (${reason})`);
          if (walletPublishStats[walletSlot]) {
            walletPublishStats[walletSlot].fail++;
          }
          publishFail++;
        }

        try {
          step = 'querying';
          const queryStart = Date.now();
          const queryResult = await Promise.race([
            DkgClient.graph.query(
              `PREFIX schema: <http://schema.org/>
               SELECT ?s ?name ?description
               WHERE {
                 ?s schema:name ?name ; schema:description ?description .
               }`,
              'SELECT'
            ),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout after 6 minutes during "querying" on ${stepNodeName}`)), 6 * 60 * 1000)
            ),
          ]);
          const queryEnd = Date.now();
          queryDurations.push(queryEnd - queryStart);
          assert.ok(queryResult?.data?.length > 0);
          console.log(`✅ Query succeeded`);
          querySuccess++;
        } catch (error) {
          logError(error, stepNodeName, step, null, kaNumber);
          const reason = `Query failed — UAL: ${ual}`;
          failedAssets.push(`KA #${kaNumber} (${reason})`);
          queryFail++;
        }

        try {
          step = 'local get';
          const localGetStart = Date.now();
          const localGetResult = await Promise.race([
            DkgClient.asset.get(ual),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout after 6 minutes during "local get" on ${stepNodeName}`)), 6 * 60 * 1000)
            ),
          ]);
          const localGetEnd = Date.now();
          localGetDurations.push(localGetEnd - localGetStart);
          assert.ok(localGetResult?.assertion);
          console.log(`✅ Local Get Succeeded`);
          localGetSuccess++;
        } catch (error) {
          logError(error, stepNodeName, step, null, kaNumber);
          const reason = `Local Get failed — UAL: ${ual}`;
          failedAssets.push(`KA #${kaNumber} (${reason})`);
          localGetFail++;
        }

        step = 'get';
        const otherIndexes = nodes.map((_, idx) => idx).filter(idx => idx !== currentIndex);
        const remoteNode = nodes[otherIndexes[Math.floor(Math.random() * otherIndexes.length)]];
        const originalStepNodeName = stepNodeName;
        stepNodeName = remoteNode.name;

        try {
          const RemoteDkgClient = new DKG({
            endpoint: remoteNode.hostname,
            port: OT_NODE_PORT,
            blockchain: {
              name: BLOCKCHAIN_IDS.BASE_TESTNET,
              publicKey: getNodeWallet(getNodeIdFromName(remoteNode.name), walletSlot).publicKey,
              privateKey: getNodeWallet(getNodeIdFromName(remoteNode.name), walletSlot).privateKey,
              gasPriceBufferPercent: 50,
            },
            maxNumberOfRetries: 300,
            frequency: 2,
            contentType: 'all',
            nodeApiVersion: '/v1',
          });
          const remoteGetStart = Date.now();
          const remoteGetResult = await Promise.race([
            RemoteDkgClient.asset.get(ual),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout after 6 minutes during "get" on ${stepNodeName}`)), 6 * 60 * 1000)
            ),
          ]);
          const remoteGetEnd = Date.now();
          remoteGetDurations.push(remoteGetEnd - remoteGetStart);
          assert.ok(remoteGetResult?.assertion);
          console.log(`✅ Get Succeeded on ${remoteNode.name}`);
          remoteGetSuccess++;
        } catch (error) {
          logError(error, originalStepNodeName, step, remoteNode.name, kaNumber);
          const reason = `Get failed — UAL: ${ual}`;
          failedAssets.push(`KA #${kaNumber} (${reason})`);
          remoteGetFail++;
        }
      };

      if (isTargetUalMode || isTargetMintedMode) {
        console.log(`⚙️ Worker mode on ${name}: ${PARALLEL_KA_BATCH_SIZE} concurrent workers`);
        let nextKaNumber = 1;
        let nextWalletSlotNumber = 1;
        const shouldStop = () => {
          if (isTargetUalMode && nextKaNumber > totalKAs) {
            return true;
          }
          if (isTargetMintedMode && mintedChildUalTotal >= TEST_TARGET_MINTED_UALS) {
            return true;
          }
          return (publishSuccess + publishFail) >= TEST_MAX_ATTEMPTS;
        };
        const claimNextTask = () => {
          if (shouldStop()) {
            return null;
          }
          const kaNumber = nextKaNumber;
          const walletSlot = String(nextWalletSlotNumber).padStart(2, '0');
          nextKaNumber += 1;
          nextWalletSlotNumber = nextWalletSlotNumber % TEST_WALLET_SLOTS + 1;
          return { kaNumber, walletSlot };
        };

        const workerCount = Math.max(1, PARALLEL_KA_BATCH_SIZE);
        const workers = Array.from({ length: workerCount }, () => (async () => {
          while (true) {
            const task = claimNextTask();
            if (task === null) {
              return;
            }
            await processKnowledgeAsset(task.kaNumber, task.walletSlot);
            if (isTargetMintedMode) {
              const attempts = publishSuccess + publishFail;
              if (attempts % 50 === 0) {
                console.log(`📈 Minted child UAL progress on ${name}: ${mintedChildUalTotal}/${TEST_TARGET_MINTED_UALS} (attempts=${attempts})`);
              }
            }
            if (TEST_BATCH_DELAY_MS > 0) {
              await sleep(TEST_BATCH_DELAY_MS);
            }
          }
        })());
        await Promise.all(workers);
        if ((publishSuccess + publishFail) >= TEST_MAX_ATTEMPTS) {
          console.log(`⚠️ Reached TEST_MAX_ATTEMPTS=${TEST_MAX_ATTEMPTS}, stopping target mode on ${name}`);
        }
      } else {
        for (let batch = 0; batch < totalBatches; batch++) {
          const startKa = batch * PARALLEL_KA_BATCH_SIZE + 1;
          const batchKAs = Array.from(
            { length: PARALLEL_KA_BATCH_SIZE },
            (_, idx) => startKa + idx
          );
          const batchWalletSlots = batchKAs.map(
            (kaNumber) => String(((kaNumber - 1) % TEST_WALLET_SLOTS) + 1).padStart(2, '0')
          );
          console.log(`\n▶ Running batch ${batch + 1}/${totalBatches} on ${name}: KAs ${batchKAs[0]}-${batchKAs[batchKAs.length - 1]}`);
          await Promise.all(batchKAs.map((kaNumber, idx) => processKnowledgeAsset(kaNumber, batchWalletSlots[idx])));
          if (TEST_BATCH_DELAY_MS > 0) {
            await sleep(TEST_BATCH_DELAY_MS);
          }
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
      const targetDescription = isTargetMintedMode
        ? `🎯 Target child UALs on ${name}: ${TEST_TARGET_MINTED_UALS} | Minted child UALs: ${mintedChildUalTotal}`
        : `🎯 Target attempts on ${name}: ${totalKAs} | Attempted: ${publishSuccess + publishFail} | Success: ${publishSuccess} | Failed: ${publishFail}`;
      console.log(targetDescription);
      console.log(`🚦 Rate-limit stats on ${name}: 429s=${rateLimit429Count}, retries=${rateLimitRetryCount}`);
      console.log('👛 Wallet publish distribution:');
      Object.entries(walletPublishStats).forEach(([slot, stats]) => {
        console.log(`  - W${slot}: attempted=${stats.attempted}, success=${stats.success}, failed=${stats.fail}, mintedChildUals=${stats.mintedChildUals}`);
      });

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
        targetAttempts: totalKAs,
        actualAttempts: publishSuccess + publishFail,
        targetMintedUals: TEST_TARGET_MINTED_UALS,
        mintedChildUalTotal,
        walletPublishStats,
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
      // Include blockchain information in error file for proper blockchain detection
      const errorData = {
          blockchain_id: BLOCKCHAIN_IDS.BASE_TESTNET,
          aggregated: errorStats[name]?.aggregated || {},
          detailed: errorStats[name]?.detailed || {},
          services: errorStats[name]?.services || {}
      };
      fs.writeFileSync(errorsFileName, JSON.stringify(errorData, null, 2));
      console.log(`✅ Saved errors to ${errorsFileName}`);
    }
  });

  after(() => {
    console.log(`\n\nGlobal Publish Summary:`);
    Object.entries(globalStats).forEach(([blockchain, nodeStats]) => {
      console.log(`\n🔗 Blockchain: ${blockchain}`);
      Object.entries(nodeStats).forEach(([nodeName, stats]) => {
        console.log(`  • ${nodeName}:`);
        console.log(`    Publish: ✅ ${stats.publishSuccess} / ❌ ${stats.publishFail} -> ${safeRate(stats.publishSuccess, stats.publishFail)}%`);
        console.log(`    Query:   ✅ ${stats.querySuccess} / ❌ ${stats.queryFail} -> ${safeRate(stats.querySuccess, stats.queryFail)}%`);
        console.log(`    Local Get: ✅ ${stats.localGetSuccess} / ❌ ${stats.localGetFail} -> ${safeRate(stats.localGetSuccess, stats.localGetFail)}%`);
        console.log(`    Get: ✅ ${stats.remoteGetSuccess} / ❌ ${stats.remoteGetFail} -> ${safeRate(stats.remoteGetSuccess, stats.remoteGetFail)}%`);
        console.log(`    Avg Publish Time: ${formatDuration(stats.avgPublishMs)}`);
        console.log(`    Avg Query Time: ${formatDuration(stats.avgQueryMs)}`);
        console.log(`    Avg Local Get Time: ${formatDuration(stats.avgLocalGetMs)}`);
        console.log(`    Avg Get Time: ${formatDuration(stats.avgRemoteGetMs)}`);
      });
    });

    console.log(`\n\nError Breakdown by Node:`);
    Object.entries(errorStats).forEach(([nodeName, errors]) => {
      console.log(`\n${nodeName}`);
      
      // Handle both new format (aggregated section) and old format (direct errors)
      if (errors.aggregated && Object.keys(errors.aggregated).length > 0) {
        // New format - use aggregated section with service info
        Object.entries(errors.aggregated).forEach(([message, count]) => {
          const service = errors.services && errors.services[message] ? errors.services[message] : '';
          const serviceLabel = service ? ` [${service}]` : '';
          console.log(`  • ${count}x ${message}${serviceLabel}`);
        });
      } else if (errors.detailed && Object.keys(errors.detailed).length > 0) {
        // New format but only detailed available - aggregate the detailed errors
        const groupedErrors = {};
        
        Object.entries(errors.detailed).forEach(([message, count]) => {
          // Remove KA numbers and node-specific details for aggregation
          let aggregatedMessage = message;
          
          // Remove "for KA #X" patterns
          aggregatedMessage = aggregatedMessage.replace(/\s+for\s+KA\s*#\d+/gi, '');
          
          // Remove "on Node X" patterns (keep the error type)
          aggregatedMessage = aggregatedMessage.replace(/\s+on\s+Node\s+\d+/gi, '');
          
          // Group by the cleaned message
          if (groupedErrors[aggregatedMessage]) {
            groupedErrors[aggregatedMessage] += count;
          } else {
            groupedErrors[aggregatedMessage] = count;
          }
        });
        
        Object.entries(groupedErrors).forEach(([message, count]) => {
          console.log(`  • ${count}x ${message}`);
        });
      } else {
        console.log(`  ✅ No errors`);
      }
    });
  });
});
