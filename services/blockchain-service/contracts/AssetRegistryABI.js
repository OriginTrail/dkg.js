export const AssetRegistryABI =  [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "hubAddress",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "UAI",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "stateCommitHash",
                "type": "bytes32"
            }
        ],
        "name": "AssetCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "UAI",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "stateCommitHash",
                "type": "bytes32"
            }
        ],
        "name": "AssetUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "UAI",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "depositor",
                "type": "address"
            }
        ],
        "name": "TokensDepositedToAsset",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "assetRecords",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "holdingTimeInYears",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "assetStake",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "priceLimit",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "assetStake",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [],
        "name": "hub",
        "outputs": [
            {
                "internalType": "contract Hub",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "assertionId",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "size",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "visibility",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "holdingTimeInYears",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "tokenAmount",
                "type": "uint256"
            }
        ],
        "name": "createAsset",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "_UAI",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "UAI",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "assertionId",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "size",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "visibility",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "tokenAmount",
                "type": "uint256"
            }
        ],
        "name": "updateAsset",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "blockNumber",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "numberOfEpochs",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "blockTime",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "holdingTimeInYears",
                "type": "uint256"
            }
        ],
        "name": "generateEpochs",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "pure",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "UAI",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "offset",
                "type": "uint256"
            }
        ],
        "name": "getCommitHash",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "commitHash",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "UAI",
                "type": "uint256"
            }
        ],
        "name": "getAssetOwner",
        "outputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "UAI",
                "type": "uint256"
            }
        ],
        "name": "getAssetTimestamp",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [],
        "name": "getNumberOfEpochs",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "numberOfEpochs",
                "type": "uint256"
            }
        ],
        "name": "setNumberOfEpochs",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getBlockTime",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "blockTime",
                "type": "uint256"
            }
        ],
        "name": "setBlockTime",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getNumberOfHolders",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "numberOfHolders",
                "type": "uint256"
            }
        ],
        "name": "setNumberOfHolders",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getEpochValidityInBlocks",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "epochValidityInBlocks",
                "type": "uint256"
            }
        ],
        "name": "setEpochValidityInBlocks",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

