import jsonld from 'jsonld';
import DKG from '../index.js';
import { sleepForMilliseconds } from '../services/utilities.js';

const ENVIRONMENT = 'testnet';
const OT_NODE_HOSTNAME = 'https://v6-pegasus-node-02.origin-trail.network';
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0x1dD2C730a2BcD26d6aEf7DCCF171FC2AB1384d14';
const PRIVATE_KEY = '8ae4f7c247ad422913c1c60187856091ad2bcb4e53fb2936d7633d7d02bd180a';

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

    // const nodeInfo = await DkgClient.node.info();
    // console.log('======================== NODE INFO RECEIVED');
    // console.log(nodeInfo);

    divider();

    //Publish paymaster

    // const paymasterAddress = await DkgClient.paymaster.deployPaymasterContract({
    //     epochsNum: 2,
    //     minimumNumberOfFinalizationConfirmations: 3,
    //     minimumNumberOfNodeReplications: 3,
    // });
    
    // console.log('Deployed Address:', paymasterAddress);

    await DkgClient.paymaster.addAllowedAddress(
        '0x1d23852331eDA24d1b6F5E21fdc419A38B0de28c',    //Paymaster address
        '0x1dD2C730a2BcD26d6aEf7DCCF171FC2AB1384d14'     // address to be added
    );
    
    console.log('Added allowed address.');


    await DkgClient.paymaster.removeAllowedAddress(
        '0x1d23852331eDA24d1b6F5E21fdc419A38B0de28c',    //Paymaster address
        '0x1dD2C730a2BcD26d6aEf7DCCF171FC2AB1384d14'     // address to be removed
    );

    console.log('Removed allowed address.');

    await DkgClient.paymaster.fundPaymaster(
        '0x1d23852331eDA24d1b6F5E21fdc419A38B0de28c',
        BigInt(1000000)
    );
    console.log('Funded Paymaster.');

    await DkgClient.paymaster.withdraw(
        '0x1d23852331eDA24d1b6F5E21fdc419A38B0de28c',    //Paymaster address
        '0x1dD2C730a2BcD26d6aEf7DCCF171FC2AB1384d14',     // address of recipient
        BigInt(500000)
    );
    console.log('Withdrawal complete.');


    // console.time('Publish (5 replications, 5 finalizations)');
    // const result3 = await DkgClient.asset.create(content, {
    //     epochsNum: 2,
    //     minimumNumberOfFinalizationConfirmations: 3,
    //     minimumNumberOfNodeReplications: 3,
    // });//payer in options

    // console.timeEnd('Publish (5 replications, 5 finalizations)');

    // console.log(JSON.stringify(result3, null, 2));

    // console.time('get');
    // const getOperationResult = await DkgClient.graph.get(
    //     'did:dkg:base:84532/0xd5550173b0f7b8766ab2770e4ba86caf714a5af5/2',
    // );
    // console.log('======================== ASSET GET');
    // console.log(getOperationResult);
    // console.timeEnd('get');

})();
