const DKG = require('./index.js');

const OT_NODE_HOSTNAME = 'http://localhost';
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0xBaF76aC0d0ef9a2FFF76884d54C9D3e270290a43';
const PRIVATE_KEY = '0x9b9af041edc816692276ac3c8f1d5565e3c01ddff80ec982943a29bd8d1d8863';

// const blockchain = {
//   name: "otp",
//   publicKey: PUBLIC_KEY,
//   privateKey: PRIVATE_KEY,
// };

const blockchain = {
    name: 'ganache',
    publicKey: PUBLIC_KEY,
    privateKey: PRIVATE_KEY,
};

const options = {
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    useSSL: true,
    loglevel: 'trace',
};
const DkgClient = new DKG(options);

function divider() {
    console.log('==================================================');
    console.log('==================================================');
    console.log('==================================================');
}

async function main() {
    const assetData = {
        '@context': 'https://json-ld.org/contexts/person.jsonld',
        '@id': `http://dbpedia.org/resource/John_Lenno${Math.random()}`,
        name: 'John Lennon',
        born: '1940-10-09',
        spouse: 'http://dbpedia.org/resource/Cynthia_Lennon',
    };

    const publishOptions = {
        epochsNum: 2,
        maxNumberOfRetries: 30,
        frequency: 1,
        blockchain,
    };
    const getOptions = {
        validate: true,
        maxNumberOfRetries: 30,
        frequency: 1,
        blockchain,
    };
    const transferAssetOptions = {
        blockchain,
    };
    const getAssetOwnerOptions = {
        blockchain,
    };

    try {
        divider();

        const nodeInfo = await DkgClient.node.info();
        console.log('======================== NODE INFO RECEIVED');
        console.log(nodeInfo);

        divider();

        const createAssetResult = await DkgClient.asset.create(assetData, publishOptions);
        console.log('======================== ASSET CREATED');
        console.log(createAssetResult);

        divider();

        const ownerResult = await DkgClient.asset.getOwner(
            createAssetResult.UAL,
            getAssetOwnerOptions,
        );
        console.log('======================== GET ASSET OWNER');
        console.log(ownerResult);

        divider();

        const getAssetResult = await DkgClient.asset.get(createAssetResult.UAL, getOptions);
        console.log('======================== ASSET RESOLVED');
        console.log(JSON.stringify(getAssetResult, null, 2));

        divider();

        const newOwner = '0x2ACa90078563133db78085F66e6B8Cf5531623Ad';
        const transferResult = await DkgClient.asset.transfer(
            createAssetResult.UAL,
            newOwner,
            transferAssetOptions,
        );
        console.log(`======================== ASSET TRANSFERRED TO ${newOwner}`);
        console.log(transferResult);

        divider();
    } catch (e) {
        console.error(e);
        process.exit();
    }
}

main();
