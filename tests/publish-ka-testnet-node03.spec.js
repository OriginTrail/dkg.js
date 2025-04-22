import { strict as assert } from 'assert';
import DKG from '../index.js';
import { BLOCKCHAIN_IDS, ENVIRONMENTS } from '../constants.js';
import 'dotenv/config';

describe('DKG Asset Lifecycle on Testnet (Node 03)', function () {
  this.timeout(360000);

  const ENVIRONMENT = ENVIRONMENTS.TESTNET;
  const OT_NODE_HOSTNAME = 'https://v6-pegasus-node-03.origin-trail.network';
  const OT_NODE_PORT = '8900';
  const PUBLIC_KEY = '0x0111ff148a06Eb44Ee0FA65e6c3627433B8dE4Df';
  const PRIVATE_KEY = process.env.PRIVATE_KEY;

  const DkgClient = new DKG({
    environment: ENVIRONMENT,
    endpoint: OT_NODE_HOSTNAME,
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
    const content = {
      public: {
        '@context': 'https://www.schema.org',
        '@id': 'urn:first-ka:info:hello-dkg',
        '@type': 'CreativeWork',
        name: 'Hello DKG',
        description: 'My first Knowledge Asset on the Decentralized Knowledge Graph!',
      },
    };

    const create_result = await DkgClient.asset.create(content, {
      epochsNum: 2,
      minimumNumberOfFinalizationConfirmations: 3,
      minimumNumberOfNodeReplications: 1,
    });

    if (!create_result) {
      throw new Error('Knowledge Asset was not published successfully');
    }

  console.log(JSON.stringify(create_result));

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

    assert.ok(queryOperationResult?.data?.length > 0, 'Query returned no results');
    console.log('Query results:', queryOperationResult);
  });
});
