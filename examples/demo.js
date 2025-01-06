import jsonld from 'jsonld';
import DKG from '../index.js';
import { sleepForMilliseconds } from '../services/utilities.js';

const ENVIRONMENT = 'testnet';
const OT_NODE_HOSTNAME = 'https://v6-pegasus-node-06.origin-trail.network';
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '';
const PRIVATE_KEY = '';

const DkgClient = new DKG({
    environment: ENVIRONMENT,
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    blockchain: {
        name: 'otp:20430',
        publicKey: PUBLIC_KEY,
        privateKey: PRIVATE_KEY,
    },
    maxNumberOfRetries: 300,
    frequency: 2,
    contentType: 'all',
    nodeApiVersion: '/v1',
});

function divider() {
    console.log('==================================================');
    console.log('==================================================');
    console.log('==================================================');
}

(async () => {
    // const content = {
    //     private: ``,
    // };

    // const privatePart = [];

    // for (let i = 0; i < 1000; i++) {
    //     privatePart.push(`<uuid:${i}> <http://schema.org/company> "OT" .`);
    // }

    // content.private = privatePart.join('\n');

    const content = {
        private: {
            '@context': 'https://www.schema.org',
            '@id': 'urn:eu-pp:safety-test:3oRIwPtUOJapwNSAGZTzCOWR9bEo',
            '@type': 'ProductSafetyTest',
            testType: 'Functional Safety Test',
            testResults: 'Fail',
            relatedProduct: [
                {
                    '@id': 'urn:epc:id:sgtin:59G1yu8uivSRKLLu',
                    name: '59G1yu8uivSRKLLu',
                },
            ],
        },
    };

    // divider();

    const nodeInfo = await DkgClient.node.info();
    console.log('======================== NODE INFO RECEIVED');
    console.log(nodeInfo);

    divider();

    // console.time('Publish (1 replication, 3 finalizations)')
    // const result0 = await DkgClient.asset.create(content, {
    //     epochsNum: 2,
    //     tokenAmount: '100',
    //     minimumNumberOfFinalizationConfirmations: 3,
    //     minimumNumberOfNodeReplications: 1,
    // });
    // console.timeEnd('Publish (1 replication, 3 finalizations)')

    // console.log(JSON.stringify(result0));

    // divider();

    // console.time('Publish (1 replication, 1 finalization)');
    // const result1 = await DkgClient.asset.create(content, {
    //     epochsNum: 2,
    //     tokenAmount: '100',
    //     minimumNumberOfFinalizationConfirmations: 1,
    //     minimumNumberOfNodeReplications: 1,
    // });
    // console.timeEnd('Publish (1 replication, 1 finalization)');

    // console.log(JSON.stringify(result1));

    // divider();

    // console.time('Publish (3 replications, 1 finalizations)');
    // const result2 = await DkgClient.asset.create(content, {
    //     epochsNum: 2,
    //     minimumNumberOfFinalizationConfirmations: 1,
    //     minimumNumberOfNodeReplications: 3,
    // });
    // console.timeEnd('Publish (3 replications, 1 finalizations)');

    // console.log(result2);

    // await sleepForMilliseconds(15000);

    // console.time('aaaaa');
    // const result3 = await DkgClient.asset.get(
    //     'did:dkg:otp/0x1a061136ed9f5ed69395f18961a0a535ef4b3e5f/243039',
    //     {
    //         contentType: 'all',
    //     },
    // );
    // console.timeEnd('aaaa');

    // console.log(result3);

    // divider();

    console.time('Publish (5 replications, 5 finalizations)');
    const result3 = await DkgClient.asset.create(content, {
        epochsNum: 2,
        minimumNumberOfFinalizationConfirmations: 3,
        minimumNumberOfNodeReplications: 3,
    });//payer in options
    console.timeEnd('Publish (5 replications, 5 finalizations)');

    console.log(JSON.stringify(result3, null, 2));

    // divider();

    // const createCollectionResult = await DkgClient.graph.create(content, {
    //     epochsNum: 2,
    //     tokenAmount: '100',
    //     minimumNumberOfFinalizationConfirmations: 1,
    // });
    // console.log('======================== ASSET CREATED');
    // console.log(createCollectionResult);

    // divider();

    // const publishFinalityResult = await DkgClient.graph.publishFinality(createAssetResult.UAL);
    // console.log('======================== ASSET FINALITY');
    // console.log(publishFinalityResult);
    console.time('get');
    const getOperationResult = await DkgClient.graph.get(
        'did:dkg:base:84532/0xd5550173b0f7b8766ab2770e4ba86caf714a5af5/2',
    );
    console.log('======================== ASSET GET');
    console.log(getOperationResult);
    console.timeEnd('get');

    // divider();

    // const queryOperationResult = await DkgClient.graph.query(
    //     `PREFIX gs1: <https://gs1.org/voc/>
    //     PREFIX schema: <http://schema.org/>

    //     SELECT ?recipeNameRaw ?baseUal
    //     WHERE {
    //       ?recipe a schema:Recipe ;
    //       GRAPH ?ual {
    //           ?recipe     schema:name ?recipeNameRaw ;
    //       }
    //        FILTER (STRSTARTS(STR(?ual), "did:dkg:base:84532/0x4e8ebfce9a0f4be374709f1ef2791e8ca6371ecb/"))
    //     BIND (REPLACE(STR(?ual), "(did:dkg:base:[^/]+/[^/]+/[^/]+)(/.*)?", "$1") AS ?baseUal)
    //     }`,
    //     'SELECT',
    //     {
    //         graphLocation: 'LOCAL_KG',
    //         graphState: 'CURRENT',
    //     },
    // );
    // console.log('======================== ASSET QUERY');
    // console.log(queryOperationResult);

    // console.time('Publish (3 replications, 1 finalizations)');

    // const queryOperationResult1 = await DkgClient.graph.query(
    //     `CONSTRUCT {  ?s ?p ?o .}WHERE {  GRAPH ?g {    ?s ?p ?o .  }  VALUES ?g {    <did:dkg:gnosis:10200/0xcdd5ce31fe2181490348ef6fd9f782d575776e5b/4/1/public>    <did:dkg:gnosis:10200/0xcdd5ce31fe2181490348ef6fd9f782d575776e5b/4/2/public>     }}`,
    //     'CONSTRUCT',
    // );
    // console.log('======================== ASSET QUERY');
    // console.log(JSON.stringify(queryOperationResult1));

    // divider();

    // console.timeEnd('Publish (3 replications, 1 finalizations)');
    // console.time('aaaa');

    // console.time('Query (3 replications, 1 finalizations)');

    // const queryOperationResult = await DkgClient.graph.query(
    //     `CONSTRUCT {  ?s ?p ?o .} WHERE {  {    GRAPH <did:dkg:gnosis:10200/0xcdd5ce31fe2181490348ef6fd9f782d575776e5b/4/1/public> {      ?s ?p ?o .    }  }  UNION  {    GRAPH <did:dkg:gnosis:10200/0xcdd5ce31fe2181490348ef6fd9f782d575776e5b/4/2/public> {      ?s ?p ?o .    }  } }`,
    //     'CONSTRUCT',
    // );
    // console.log('======================== ASSET QUERY');
    // console.log(JSON.stringify(queryOperationResult));

    // // divider();

    // console.timeEnd('Query (3 replications, 1 finalizations)');
    // console.time('aaaa');
})();
