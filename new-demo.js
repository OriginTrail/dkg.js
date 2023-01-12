const DKG = require("./index.js");

const OT_NODE_HOSTNAME = "http://localhost";
const OT_NODE_PORT = "8900";
const PUBLIC_KEY = "0xBaF76aC0d0ef9a2FFF76884d54C9D3e270290a43";
const PRIVATE_KEY =
  "0x9b9af041edc816692276ac3c8f1d5565e3c01ddff80ec982943a29bd8d1d8863";

// const blockchain = {
//   name: "otp",
//   publicKey: PUBLIC_KEY,
//   privateKey: PRIVATE_KEY,
// };

const blockchain = {
  name: "ganache",
  publicKey: PUBLIC_KEY,
  privateKey: PRIVATE_KEY,
};

let options = {
  endpoint: OT_NODE_HOSTNAME,
  port: OT_NODE_PORT,
  useSSL: true,
  loglevel: "trace",
};
const DkgClient = new DKG(options);

let publishOptions = {
  epochsNum: 2,
  maxNumberOfRetries: 30,
  frequency: 1,
  blockchain,
};

(async () => {
  const res = await DkgClient.asset.create(
    undefined,
    { "@context": "http://schema.org", "@id": "http://Veljko", name: "Veljko" },
    publishOptions
  );

  console.log("asset create res: ", res);
})();
