const jsonld = require('jsonld');
const DKG = require('../index.js');

const ENVIRONMENT = 'testnet';
const OT_NODE_HOSTNAME = 'https://v6-pegasus-node-17.origin-trail.network';
const OT_NODE_PORT = '8900';
const PUBLIC_KEY = '0xa2a3aFA0eB2c8AE9FBA11ED197A39099Ce6DFF21';
const PRIVATE_KEY = '0x312800c5b961b49733eca4df79756f6d820e3124642ff5c3d854dae7c345a7d7';

const DkgClient = new DKG({
    environment: ENVIRONMENT,
    endpoint: OT_NODE_HOSTNAME,
    port: OT_NODE_PORT,
    blockchain: {
        name: 'otp:20430',
        publicKey: PUBLIC_KEY,
        privateKey: PRIVATE_KEY,
    },
    maxNumberOfRetries: 30,
    frequency: 2,
    contentType: 'all',
});

const credential = {
    "holder": "did:ethr:0x1:0xcfe5a1b3e995941dcc79cfcdef88c58a52b01880",
    "verifiableCredential": [
        "{\"proof\":{\"verificationMethod\":\"did:ethr:0x1:0x103d62f61a9ea1fcce61f90cbb83209bc4e70308#controller\",\"created\":\"2024-07-22T10:57:37.528Z\",\"proofPurpose\":\"assertionMethod\",\"type\":\"EthereumEip712Signature2021\",\"proofValue\":\"0x9081510e0493a40a98fa79d8c60df7ea8372a9bcb36a479ab33a0dba799979440c6a4e8466452cf0712f74e81c0e8e832e57cf30484e25ea702ae4c74bf891881c\",\"eip712\":{\"domain\":{\"chainId\":1,\"name\":\"VerifiableCredential\",\"version\":\"1\"},\"types\":{\"EIP712Domain\":[{\"name\":\"name\",\"type\":\"string\"},{\"name\":\"version\",\"type\":\"string\"},{\"name\":\"chainId\",\"type\":\"uint256\"}],\"CredentialSchema\":[{\"name\":\"id\",\"type\":\"string\"},{\"name\":\"type\",\"type\":\"string\"}],\"CredentialSubject\":[{\"name\":\"id\",\"type\":\"string\"},{\"name\":\"type\",\"type\":\"string\"}],\"Proof\":[{\"name\":\"created\",\"type\":\"string\"},{\"name\":\"proofPurpose\",\"type\":\"string\"},{\"name\":\"type\",\"type\":\"string\"},{\"name\":\"verificationMethod\",\"type\":\"string\"}],\"VerifiableCredential\":[{\"name\":\"@context\",\"type\":\"string[]\"},{\"name\":\"credentialSchema\",\"type\":\"CredentialSchema\"},{\"name\":\"credentialSubject\",\"type\":\"CredentialSubject\"},{\"name\":\"issuanceDate\",\"type\":\"string\"},{\"name\":\"issuer\",\"type\":\"string\"},{\"name\":\"proof\",\"type\":\"Proof\"},{\"name\":\"type\",\"type\":\"string[]\"}]},\"primaryType\":\"VerifiableCredential\"}},\"type\":[\"VerifiableCredential\",\"MascaUserCredential\"],\"credentialSubject\":{\"id\":\"did:ethr:0x1:0xcFE5A1b3e995941Dcc79CfCDef88C58a52B01880\",\"type\":\"Regular User\"},\"credentialSchema\":{\"id\":\"https://beta.api.schemas.serto.id/v1/public/program-completion-certificate/1.0/json-schema.json\",\"type\":\"JsonSchemaValidator2018\"},\"@context\":[\"https://www.w3.org/2018/credentials/v1\"],\"issuer\":\"did:ethr:0x1:0x103d62f61a9ea1fcce61f90cbb83209bc4e70308\",\"issuanceDate\":\"2024-07-22T10:57:37.528Z\"}"
    ],
    "type": [
        "VerifiablePresentation",
        "Custom"
    ],
    "@context": [
        "https://www.w3.org/2018/credentials/v1"
    ],
    "issuanceDate": "2024-07-22T11:05:48.536Z",
    "proof": {
        "verificationMethod": "did:ethr:0x1:0xcfe5a1b3e995941dcc79cfcdef88c58a52b01880#controller",
        "created": "2024-07-22T11:05:48.536Z",
        "proofPurpose": "assertionMethod",
        "type": "EthereumEip712Signature2021",
        "proofValue": "0xebd501e4094c038a6b5708523367bf5f651eafee69127957d1b57a6d4d53d72553d9c95e210646522ec7d2c51b25579af435cbf525dbac5a394ddb785f2414341c",
        "eip712": {
            "domain": {
                "chainId": 1,
                "name": "VerifiablePresentation",
                "version": "1"
            },
            "types": {
                "EIP712Domain": [
                    {
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "name": "version",
                        "type": "string"
                    },
                    {
                        "name": "chainId",
                        "type": "uint256"
                    }
                ],
                "Proof": [
                    {
                        "name": "created",
                        "type": "string"
                    },
                    {
                        "name": "proofPurpose",
                        "type": "string"
                    },
                    {
                        "name": "type",
                        "type": "string"
                    },
                    {
                        "name": "verificationMethod",
                        "type": "string"
                    }
                ],
                "VerifiablePresentation": [
                    {
                        "name": "@context",
                        "type": "string[]"
                    },
                    {
                        "name": "holder",
                        "type": "string"
                    },
                    {
                        "name": "issuanceDate",
                        "type": "string"
                    },
                    {
                        "name": "proof",
                        "type": "Proof"
                    },
                    {
                        "name": "type",
                        "type": "string[]"
                    },
                    {
                        "name": "verifiableCredential",
                        "type": "string[]"
                    }
                ]
            },
            "primaryType": "VerifiablePresentation"
        }
    }
};

function divider() {
    console.log('==================================================');
    console.log('==================================================');
    console.log('==================================================');
}

divider();

(async function () {

    const content = {
        public: {
            '@context': ['https://schema.org'],
            '@id': 'urn:vc:demo:1',
            company: 'TraceLabs'
        }
    };

    const createAssetResult = await DkgClient.asset.create(content, {
        epochsNum: 2,
        auth: {
            credential
        }
    });
    console.log('======================== ASSET CREATED');
    console.log(createAssetResult);


    // let queryResult = await DkgClient.graph.query(
    //     'SELECT * WHERE { ?subject ?predicate ?object }',
    //     'SELECT',
    //     {
    //         auth: {
    //             credential
    //         }
    //     }
    // );
    // console.log('======================== QUERY LOCAL CURRENT RESULT');
    // console.log(queryResult.data, 'result');
    // // console.log(
    // //     JSON.stringify(
    // //         await jsonld.fromRDF(queryResult.data, {
    // //             algorithm: 'URDNA2015',
    // //             format: 'application/n-quads',
    // //         }),
    // //         null,
    // //         2,
    // //     ),
    // // );
})();


