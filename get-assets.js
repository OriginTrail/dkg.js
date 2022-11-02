const DKG = require("./index.js");

const OT_NODE_HOSTNAME = "http://localhost";
const OT_NODE_PORT = "8901";
const PUBLIC_KEY = "0xd6879C0A03aDD8cFc43825A42a3F3CF44DB7D2b9";
const PRIVATE_KEY = "02b39cac1532bef9dba3e36ec32d3de1e9a88f1dda597d3ac6e2130aed9adc4e";
const AUTH_TOKEN = "";

const blockchain = {
    name: "ganache",
    publicKey: PUBLIC_KEY,
    privateKey: PRIVATE_KEY,
};

let options = {
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    useSSL: false,
    loglevel: "trace",
    auth: {
        token: AUTH_TOKEN
    }
};
const DkgClient = new DKG(options);

let UALs = ["did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/5", "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/6"];

let getOptions = {
    validate: true,
    commitOffset: 0,
    maxNumberOfRetries: 5,
    blockchain
};

async function getAssets() {
    for (let index = 0; index < UALs.length; index++){
        const row = UALs[index];
        let getAssetResult = await DkgClient.asset.get(row, getOptions);
        console.log("======================== ASSET RESOLVED");
        console.log(JSON.stringify(getAssetResult, null, 2));
    }
}

getAssets();
