import {DkgClient as DKG} from './index-new.js';

const OT_NODE_HOSTNAME = 'http://localhost';
const OT_NODE_PORT = '8901';

let options = {
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    communicationType: 'http',
    useSSL: false,
    loglevel: 'trace',
    blockchain: 'ethereum',
    blockchainConfig: {
        ethereum: {
            "rpc": "http://localhost:7545",
            "hubContract": "0xF21dD87cFC5cF5D073398833AFe5EFC543b78a00",
            "wallet": "0xd6879C0A03aDD8cFc43825A42a3F3CF44DB7D2b9",
            "privateKey": "02b39cac1532bef9dba3e36ec32d3de1e9a88f1dda597d3ac6e2130aed9adc4e"
        }
    }
};
const dkg = new DKG(options);

async function main() {
    let assetData = {
        "@context": "https://json-ld.org/contexts/person.jsonld",
        "@id": `http://dbpedia.org/resource/John_Lenno${Math.random()}`,
        "name": "John Lennon",
        "born": "1940-10-09",
        "spouse": "http://dbpedia.org/resource/Cynthia_Lennon"
    };
    let publishOptions = {
        keywords: ['stevan', "nesovic"],
        visibility: 'public',
        holdingTimeInYears: 1,
        tokenAmount: 10,
        blockchain: "ethereum",
        wallet: "0xd6879C0A03aDD8cFc43825A42a3F3CF44DB7D2b9",
        maxNumberOfRetries: 5
    };
    let getOptions = {
        validate: true,
        commitOffset: 0,
        blockchain: "ethereum",
        maxNumberOfRetries: 5
    }

    try {
        // let createAssetResult = await dkg.asset.create(assetData, publishOptions);
        // const UAL = createAssetResult.UAL;
        // console.log(UAL);


        const UAL = "did:ethereum:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/2";
        let getAssetResult = await dkg.asset.get(UAL, getOptions);

    } catch (e) {
        console.error(e);
    }
}


main();
