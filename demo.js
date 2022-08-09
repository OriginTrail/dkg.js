const DkgClient = require("./index.js");

const OT_NODE_HOSTNAME = "http://localhost";
const OT_NODE_PORT = "8900";
const WALLET = "";
const PRIVATE_KEY = "";
const BLOCKCHAIN = "otp";

let options = {
  endpoint: OT_NODE_HOSTNAME,
  port: OT_NODE_PORT,
  communicationType: "http",
  blockchain: BLOCKCHAIN,
  useSSL: false,
  loglevel: "trace",
  blockchainConfig: {
    otp: {
      rpc: "wss://parachain-tempnet-01.origin-trail.network",
      hubContract: "0x6e002616ADf12D4Cc908976eB16a7646B6cD6596",
      wallet: WALLET,
      privateKey: PRIVATE_KEY,
    },
  },
};
const dkg = new DkgClient(options);

async function main() {
  let assetData = {
    "@context": "https://json-ld.org/contexts/person.jsonld",
    "@id": `http://dbpedia.org/resource/John_Lenno${Math.random()}`,
    name: "John Lennon",
    born: "1940-10-09",
    spouse: "http://dbpedia.org/resource/Cynthia_Lennon",
  };
  let updateAssetData = {
    "@context": "https://json-ld.org/contexts/person.jsonld",
    "@id": `http://dbpedia.org/resource/Michael_Jordan${Math.random()}`,
    name: "Michael Jordan",
    born: "1991-10-04",
  };
  let updateAssetData2 = {
    "@context": "https://json-ld.org/contexts/person.jsonld",
    "@id": `http://dbpedia.org/resource/Kobe_Bryant${Math.random()}`,
    name: "Kobe Bryant",
    born: "1991-10-04",
  };
  let assertionData = {
    "@context": "https://json-ld.org/contexts/person.jsonld",
    "@id": `http://dbpedia.org/resource/Stevan_Nesovic-${Math.random()}`,
    name: "Stevan Nesovic",
    born: "1991-10-04",
  };
  let publishOptions = {
    visibility: "public",
    holdingTimeInYears: 1,
    tokenAmount: 10,
    maxNumberOfRetries: 5,
  };
  let assertionPublishOptions = {
    visibility: "public",
    holdingTimeInYears: 1,
    tokenAmount: 10,
    maxNumberOfRetries: 5,
  };
  let getOptions = {
    validate: true,
    commitOffset: 0,
    maxNumberOfRetries: 5,
  };
  let getAssertionOptions = {
    operation: "get",
  };
  let transferAssetOptions = {
    wallet: PRIVATE_KEY,
  };

  try {
    divider();

    const nodeInfo = await dkg.node.info();
    console.log("======================== NODE INFO RECEIVED");
    console.log(nodeInfo);

    divider();

    let createAssetResult = await dkg.asset.create(assetData, publishOptions);
    console.log("======================== ASSET CREATED");
    console.log(createAssetResult);

    divider();

    let getAssetResult = await dkg.asset.get(createAssetResult.UAL, getOptions);
    const assertion = getAssetResult.assertion;
    console.log("======================== ASSET RESOLVED");
    console.log(JSON.stringify(getAssetResult, null, 2));

    divider();

    let updateAssetResult = await dkg.asset.update(
      createAssetResult.UAL,
      updateAssetData,
      publishOptions
    );
    console.log("======================== ASSET UPDATED");
    console.log(updateAssetResult);

    divider();

    let getAssetResultAfterUpdate = await dkg.asset.get(
      createAssetResult.UAL,
      getOptions
    );
    const assertion1 = getAssetResultAfterUpdate.assertion;
    console.log("======================== ASSET AFTER UPDATE");
    console.log(getAssetResultAfterUpdate);

    divider();

    const newOwner = "0x2ACa90078563133db78085F66e6B8Cf5531623Ad";
    let transferResult = await dkg.asset.transfer(
      createAssetResult.UAL,
      newOwner,
      transferAssetOptions
    );
    console.log(`======================== ASSET TRANSFERRED TO ${newOwner}`);
    console.log(transferResult);

    divider();

    try {
      await dkg.asset.update(
        createAssetResult.UAL,
        updateAssetData2,
        publishOptions
      );
    } catch (e) {
      console.error(e);
    }

    //  ASSERTIONS
    //NOTE: Create assertion is currently blocked
    // const createAssertionResult = await dkg.assertion.create(assertionData, assertionPublishOptions);
    // console.log(createAssertionResult, 'create assertion result');

    // let getAssertionResult = await dkg.assertion.get(assertionId, getAssertionOptions)
    // console.log(getAssertionResult, 'GET ASSERTION');
  } catch (e) {
    console.error(e);
    process.exit();
  }
}

function divider() {
  console.log("==================================================");
  console.log("==================================================");
  console.log("==================================================");
}

main();
