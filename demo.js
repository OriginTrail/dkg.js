const DKG = require("./index.js");

const OT_NODE_HOSTNAME = "https://v6-pegasus-node-12.origin-trail.network";
const OT_NODE_PORT = "8900";
const PUBLIC_KEY = "0x3Fb245acB60987BE46E4AfF0Cb03cd29E7C5a4a7";
const PRIVATE_KEY =
  "c1d623e05eb1d4dd243a24a2a78a6bd96d1fd2950c3fa433eaa00cde7614703a";

const blockchain = {
  name: "otp::testnet",
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

    return;
    divider();

    let ownerResult = await DkgClient.asset.getOwner(
      createAssetResult.UAL,
      getAssetOwnerOptions
    );
    console.log("======================== GET ASSET OWNER");
    console.log(ownerResult);

    divider();

    let getAssetResult = await DkgClient.asset.get(
      createAssetResult.UAL,
      getOptions
    );
    console.log("======================== ASSET RESOLVED");
    console.log(JSON.stringify(getAssetResult, null, 2));

    divider();

    const newOwner = "0x2ACa90078563133db78085F66e6B8Cf5531623Ad";
    let transferResult = await DkgClient.asset.transfer(
      createAssetResult.UAL,
      newOwner,
      transferAssetOptions
    );
    console.log(`======================== ASSET TRANSFERRED TO ${newOwner}`);
    console.log(transferResult);

    divider();
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
