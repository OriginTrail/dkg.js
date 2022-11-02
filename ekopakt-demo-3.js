let data = {
    "head" : {
        "vars" : [
            "eventId",
            "input",
            "output",
            "epc",
            "bizLocation",
            "bizStep",
            "eventUAL",
            "generalId"
        ]
    },
    "results" : {
        "bindings" : [
            {
                "eventId" : {
                    "type" : "uri",
                    "value" : "urn:uuid:event:3"
                },
                "input" : {
                    "type" : "literal",
                    "value" : "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/1"
                },
                "output" : {
                    "type" : "literal",
                    "value" : "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/2"
                },
                "epc" : {
                    "type" : "literal",
                    "value" : ""
                },
                "bizLocation" : {
                    "type" : "literal",
                    "value" : ""
                },
                "bizStep" : {
                    "type" : "literal",
                    "value" : ""
                },
                "eventUAL" : {
                    "type" : "literal",
                    "value" : ""
                },
                "generalId" : {
                    "type" : "literal",
                    "value" : "genid-e317331d70fb4b1abaf3ec7e2655af31-e_c14n016"
                }
            },
            {
                "eventId" : {
                    "type" : "uri",
                    "value" : "urn:uuid:event:2"
                },
                "input" : {
                    "type" : "literal",
                    "value" : "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/0"
                },
                "output" : {
                    "type" : "literal",
                    "value" : "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/1"
                },
                "epc" : {
                    "type" : "literal",
                    "value" : ""
                },
                "bizLocation" : {
                    "type" : "literal",
                    "value" : ""
                },
                "bizStep" : {
                    "type" : "literal",
                    "value" : ""
                },
                "eventUAL" : {
                    "type" : "literal",
                    "value" : ""
                },
                "generalId" : {
                    "type" : "literal",
                    "value" : "genid-e317331d70fb4b1abaf3ec7e2655af31-e_c14n016"
                }
            },
            {
                "eventId" : {
                    "type" : "uri",
                    "value" : "urn:uuid:event:1"
                },
                "input" : {
                    "type" : "literal",
                    "value" : ""
                },
                "output" : {
                    "type" : "literal",
                    "value" : ""
                },
                "epc" : {
                    "type" : "literal",
                    "value" : "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/0"
                },
                "bizLocation" : {
                    "type" : "literal",
                    "value" : ""
                },
                "bizStep" : {
                    "type" : "literal",
                    "value" : ""
                },
                "eventUAL" : {
                    "type" : "literal",
                    "value" : ""
                },
                "generalId" : {
                    "type" : "literal",
                    "value" : "genid-e317331d70fb4b1abaf3ec7e2655af31-e_c14n016"
                }
            }
        ]
    }
};

let fs = require('fs');

let FINAL = {};

const DKG = require('./index.js');

const OT_NODE_HOSTNAME = 'http://localhost';
const OT_NODE_PORT = '8901';
const PUBLIC_KEY = '0xd6879C0A03aDD8cFc43825A42a3F3CF44DB7D2b9';
const PRIVATE_KEY = '02b39cac1532bef9dba3e36ec32d3de1e9a88f1dda597d3ac6e2130aed9adc4e';
const AUTH_TOKEN = '';

const blockchain = {
    name: 'ganache',
    publicKey: PUBLIC_KEY,
    privateKey: PRIVATE_KEY,
};

let options = {
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    useSSL: false,
    loglevel: 'trace',
    auth: {
        token: AUTH_TOKEN,
    },
};
let getOptions = {
    validate: true,
    commitOffset: 0,
    maxNumberOfRetries: 5,
    blockchain,
};
const DkgClient = new DKG(options);
const requests = [];

async function processTriplets(data) {
    let search = 'did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/2';
    rec(data, search);
    const responses = await Promise.all(requests);
    fs.writeFile('resolved-assets.json', JSON.stringify(responses), 'utf8', () => {
        console.log('FINISHED');
    });
}

function rec(data, search) {
    for (const row of data.results.bindings) {
        if (search === row.output.value) {
            if (!FINAL[row.output.value]) {
                FINAL[row.output.value] = {};
                FINAL[row.output.value].outputs = {};
                requests.push(DkgClient.asset.get(row.output.value, getOptions));
            }
            requests.push(DkgClient.asset.get(row.input.value, getOptions));
            rec(data, row.input.value);
        }
        if (search === row.epc.value) {
            if (!FINAL[row.epc.value]) {
                FINAL[row.epc.value] = {};
                FINAL[row.epc.value].outputs = {};
                requests.push(DkgClient.asset.get(row.epc.value, getOptions));
            }
        }
    }
}

processTriplets(data);
