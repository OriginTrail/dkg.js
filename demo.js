const DKG = require("./index.js");

const OT_NODE_HOSTNAME = "https://v6-development-node-35.origin-trail.network";
const OT_NODE_PORT = "8900";
const PUBLIC_KEY = "0xEBE0346cd7f309046b854637ECC4edF1bccC23C4";
const PRIVATE_KEY =
  "0x62af5a5b4be6f8e567d21c273eb396525f7521e59ca0381c70015851b28629b2";

const blockchain = {
  name: "otp",
  publicKey: PUBLIC_KEY,
  privateKey: PRIVATE_KEY,
};

// const blockchain = {
//   name: "ganache",
//   publicKey: PUBLIC_KEY,
//   privateKey: PRIVATE_KEY,
// };

let options = {
  endpoint: OT_NODE_HOSTNAME,
  port: OT_NODE_PORT,
  useSSL: true,
  loglevel: "trace",
};
const DkgClient = new DKG(options);

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

  let publishOptions = {
    epochsNum: 2,
    maxNumberOfRetries: 30,
    frequency: 1,
    blockchain,
  };
  let getOptions = {
    validate: true,
    maxNumberOfRetries: 30,
    frequency: 1,
    blockchain,
  };
  let transferAssetOptions = {
    blockchain,
  };
  let getAssetOwnerOptions = {
    blockchain,
  };

  try {
    divider();

    const nodeInfo = await DkgClient.node.info();
    console.log("======================== NODE INFO RECEIVED");
    console.log(nodeInfo);

    divider();

    let createAssetResult = await DkgClient.asset.create(
      assetData,
      publishOptions
    );
    console.log("======================== ASSET CREATED");
    console.log(createAssetResult);

    // divider();
    //
    // let ownerResult = await DkgClient.asset.getOwner(
    //   createAssetResult.UAL,
    //   getAssetOwnerOptions
    // );
    // console.log("======================== GET ASSET OWNER");
    // console.log(ownerResult);
    //
    // divider();
    //
    // let getAssetResult = await DkgClient.asset.get(
    //   createAssetResult.UAL,
    //   getOptions
    // );
    // console.log("======================== ASSET RESOLVED");
    // console.log(JSON.stringify(getAssetResult, null, 2));
    //
    // divider();
    //
    // let updateAssetResult = await DkgClient.asset.update(
    //   createAssetResult.UAL,
    //   updateAssetData,
    //   { ...publishOptions, tokenAmount: 20, epochsNum: 3 }
    // );
    // console.log("======================== ASSET UPDATED");
    // console.log(updateAssetResult);
    //
    // divider();
    //
    // let getAssetResultAfterUpdate = await DkgClient.asset.get(
    //   createAssetResult.UAL,
    //   getOptions
    // );
    // console.log("======================== ASSET AFTER UPDATE");
    // console.log(JSON.stringify(getAssetResultAfterUpdate, null, 2));
    //
    // divider();
    //
    // const newOwner = "0x2ACa90078563133db78085F66e6B8Cf5531623Ad";
    // let transferResult = await DkgClient.asset.transfer(
    //   createAssetResult.UAL,
    //   newOwner,
    //   transferAssetOptions
    // );
    // console.log(`======================== ASSET TRANSFERRED TO ${newOwner}`);
    // console.log(transferResult);
    //
    // divider();
    //
    // try {
    //   await DkgClient.asset.update(
    //     createAssetResult.UAL,
    //     updateAssetData2,
    //     publishOptions
    //   );
    // } catch (e) {
    //   console.error(e);
    // }
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
