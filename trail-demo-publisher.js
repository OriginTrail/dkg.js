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

let publishOptions = {
    visibility: "public",
    holdingTimeInYears: 1,
    tokenAmount: 10,
    maxNumberOfRetries: 5,
    blockchain,
};

let datasetsForPublish = [
    {
        "@context": [
            "http://schema.org/"
        ],
        "@id" : "urn:ot:1",
        "name" : "Product 1 - New user",
        "description" : "Good product 1"
    },
    {
        "@context": [
            "http://schema.org/"
        ],
        "@id" : "urn:ot:2",
        "name" : "Product 2",
        "description" : "Good product 2"
    },
    {
        "@context": [
            "http://schema.org/"
        ],
        "@id" : "urn:ot:3",
        "name" : "Product 3",
        "description" : "Good product 3"
    }
];

let datasetsForUpdate = [
    {
        UAL: "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/0",
        dataset: {
            "@context": [
                "http://schema.org/"
            ],
            "@id" : "urn:ot:1",
            "https://dkg.io/sameAs" : {
                "@id" : "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/0"
            },
            "name" : "Product 1",
            "description" : "Good product 1"
        }
    },
    {
        UAL: "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/1",
        dataset: {
            "@context": [
                "http://schema.org/"
            ],
            "@id" : "urn:ot:2",
            "https://dkg.io/sameAs" : {
                "@id" : "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/1"
            },
            "name" : "Product 2",
            "description" : "Good product 2"
        },
    },
    {
        UAL: "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/2",
        dataset: {
            "@context": [
                "http://schema.org/"
            ],
            "@id" : "urn:ot:3",
            "https://dkg.io/sameAs" : {
                "@id" : "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/2"
            },
            "name" : "Product 3",
            "description" : "Good product 3"
        }
    },
];

let connector = {
    "@context": [
        "http://schema.org/",
        "https://gs1.github.io/EPCIS/epcis-context.jsonld"
    ],
    "id": "https://id.example.org/document1",
    "type": "EPCISDocument",
    "schemaVersion": "2.0",
    "creationDate": "2021-11-30T12:48:47+00:00",
    "epcisBody" : {
        "eventList" : [
            {
                "@id": "urn:uuid:event:1",
                "epcList": [
                    {
                        "@id" : "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/0"
                    }
                ]
            },
            {
                "@id": "urn:uuid:event:2",
                "inputEPCList": [
                    {
                        "@id" : "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/0"
                    }
                ],
                "outputEPCList": [
                    {
                        "@id" : "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/1"
                    }
                ]
            },
            {
                "@id": "urn:uuid:event:3",
                "inputEPCList": [
                    {
                        "@id" : "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/1"
                    }
                ],
                "outputEPCList": [
                    {
                        "@id" : "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/2"
                    }
                ]
            }
        ]
    }
};

let connectorWithInternalIDs = {
    "@context": [
        "http://schema.org/",
        "https://gs1.github.io/EPCIS/epcis-context.jsonld"
    ],
    "@id" : "urn:uuid:1111111111",
    "type": "EPCISDocument",
    "schemaVersion": "2.0",
    "creationDate": "2021-11-30T12:48:47+00:00",
    "epcisBody" : {
        "eventList" : [
            {
                "@id": "urn:uuid:event:101",
                "epcList": [
                    {
                        "@id" : "urn:ot:101"
                    }
                ]
            },
            {
                "@id": "urn:uuid:event:201",
                "inputEPCList": [
                    {
                        "@id" : "urn:ot:101"
                    }
                ],
                "outputEPCList": [
                    {
                        "@id" : "urn:ot:201"
                    }
                ]
            },
            {
                "@id": "urn:uuid:event:301",
                "inputEPCList": [
                    {
                        "@id" : "urn:ot:201"
                    }
                ],
                "outputEPCList": [
                    {
                        "@id" : "urn:ot:301"
                    }
                ]
            }
        ]
    }
};

let connectorInternalIDUpdate = {
    "@context": [
        "http://schema.org/",
        "https://gs1.github.io/EPCIS/epcis-context.jsonld"
    ],
    "https://dkg.io/sameAs" : {
        "@id" : "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/5"
    },
    "@id" : "urn:uuid:1111111111",
    "type": "EPCISDocument",
    "schemaVersion": "2.0",
    "creationDate": "2021-11-30T12:48:47+00:00",
    "epcisBody" : {
        "eventList" : [
            {
                "@id": "urn:uuid:event:101",
                "epcList": [
                    {
                        "@id" : "urn:ot:101"
                    }
                ]
            },
            {
                "@id": "urn:uuid:event:201",
                "inputEPCList": [
                    {
                        "@id" : "urn:ot:101"
                    }
                ],
                "outputEPCList": [
                    {
                        "@id" : "urn:ot:201"
                    }
                ]
            },
            {
                "@id": "urn:uuid:event:301",
                "bizLocation" : {
                    "@id" : "urn:uuid:location:2"
                },
                "inputEPCList": [
                    {
                        "@id" : "urn:ot:200"
                    }
                ],
                "outputEPCList": [
                    {
                        "@id" : "urn:ot:301"
                    }
                ]
            }
        ]
    }
};

let additionalInternal = {
    "@context": [
        "http://schema.org/",
        "https://gs1.github.io/EPCIS/epcis-context.jsonld"
    ],
    "@id" : "urn:uuid:22222222",
    "type": "EPCISDocument",
    "schemaVersion": "2.0",
    "creationDate": "2021-11-30T12:48:47+00:00",
    "epcisBody" : {
        "eventList" : [
            {
                "@id": "urn:uuid:event:302",
                "inputEPCList": [
                    {
                        "@id" : "urn:ot:202"
                    }
                ],
                "outputEPCList": [
                    {
                        "@id" : "urn:ot:301"
                    }
                ]
            }
        ]
    }
};

let additionalInternalUpdate = {
    "@context": [
        "http://schema.org/",
        "https://gs1.github.io/EPCIS/epcis-context.jsonld"
    ],
    "https://dkg.io/sameAs" : {
        "@id" : "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/6"
    },
    "@id" : "urn:uuid:22222222",
    "type": "EPCISDocument",
    "schemaVersion": "2.0",
    "creationDate": "2021-11-30T12:48:47+00:00",
    "epcisBody" : {
        "eventList" : [
            {
                "@id": "urn:uuid:event:302",
                "inputEPCList": [
                    {
                        "@id" : "urn:ot:202"
                    }
                ],
                "outputEPCList": [
                    {
                        "@id" : "urn:ot:301"
                    }
                ]
            }
        ]
    }
};

async function publish() {
    for (let index = 0; index < datasetsForPublish.length; index++){
        const row = datasetsForPublish[index];
        let createAssetResult = await DkgClient.asset.create(row, publishOptions);
        console.log("======================== ASSET CREATED");
        console.log(createAssetResult);
    }
}

async function update() {
    for (let index = 0; index < datasetsForUpdate.length; index++){
        const row = datasetsForUpdate[index];
        let updateAssetResult = await DkgClient.asset.update(
            row.UAL,
          row.dataset,
          publishOptions
        );
        console.log("======================== ASSET UPDATED");
        console.log(updateAssetResult);
    }
}

async function publishConnector() {
    let createAssetResult = await DkgClient.asset.create(connector, publishOptions);
    console.log("======================== ASSET CREATED");
    console.log(createAssetResult);
}
async function publishConnectorWithInternalID() {
    let createAssetResult = await DkgClient.asset.create(connectorWithInternalIDs, publishOptions);
    console.log("======================== ASSET CREATED");
    console.log(createAssetResult);
}

async function updateConnectorWithInternalID() {
    let updateAssetResult = await DkgClient.asset.update(
       "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/5",
        connectorInternalIDUpdate,
        publishOptions
    );
    console.log("======================== ASSET UPDATED");
    console.log(updateAssetResult);
}
async function publishAdditionalForInternal() {
    let createAssetResult = await DkgClient.asset.create(additionalInternal, publishOptions);
    console.log("======================== ASSET CREATED");
    console.log(createAssetResult);
}

async function updateAdditionalForInternal() {
    let updateAssetResult = await DkgClient.asset.update(
        "did:ganache:0xf21dd87cfc5cf5d073398833afe5efc543b78a00/6",
        additionalInternalUpdate,
        publishOptions
    );
    console.log("======================== ASSET UPDATED");
    console.log(updateAssetResult);
}

// publish();
// update();
// publishConnector();
// publishConnectorWithInternalID();
updateConnectorWithInternalID();
// publishAdditionalForInternal();
// updateAdditionalForInternal();
