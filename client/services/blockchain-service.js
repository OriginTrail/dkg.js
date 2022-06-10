const Web3 = require('web3');
const BigNumber = require('big-number');
const axios = require('axios');
const DKGContractAbi = require('../../build/contracts/DKGcontract.json').abi;
const UAIRegistryAbi = require('../../build/contracts/UAIRegistry.json').abi;

class Web3Service {
    getName() {
        return 'Web3';
    }

    async initialize(config, logger) {
        this.config = config;
        this.logger = logger;

        this.gasStationLink = 'https://gasstation-mumbai.matic.today/v2';
        this.rpcNumber = 0;
        await this.initializeWeb3();
        await this.initializeContracts();
    }

    async initializeWeb3() {
        let tries = 0;
        let isRpcConnected = false;
        while (!isRpcConnected) {
            if (tries >= this.config.rpcEndpoints.length) {
                throw Error('Blockchain initialisation failed');
            }

            try {
                this.web3 = new Web3(this.config.rpcEndpoints[this.rpcNumber]);
                isRpcConnected = await this.web3.eth.net.isListening();
            } catch (e) {
                this.logger.debug(
                    `Unable to connect to blockchain rpc : ${
                        this.config.rpcEndpoints[this.rpcNumber]
                    }.`,
                );
                tries += 1;
                this.rpcNumber = (this.rpcNumber + 1) % this.config.rpcEndpoints.length;
            }
        }
    }

    async initializeContracts() {
        this.UAIRegistryContract = new this.web3.eth.Contract(
            UAIRegistryAbi,
            this.config.hubContractAddress,
        );
        const DKGContractAddress = await this.UAIRegistryContract.methods
            .getAssertionRegistry()
            .call();
        this.DKGContract = new this.web3.eth.Contract(DKGContractAbi, DKGContractAddress);
        this.logger.debug(
            `Connected to blockchain rpc : ${this.config.rpcEndpoints[this.rpcNumber]}.`,
        );
    }

    getPrivateKey() {
        return this.config.privateKey;
    }

    getPublicKey() {
        return this.config.publicKey;
    }

    async getGasStationPrice() {
        const response = await axios.get(this.gasStationLink).catch((err) => {
            this.logger.debug(err);
            return undefined;
        });
        try {
            return Math.round(response.data.standard.maxFee * 1e9);
        } catch (e) {
            return undefined;
        }
    }

    async executeContractFunction(contractInstance, functionName, args) {
        let result;
        while (!result) {
            try {
                const gasPrice = await this.getGasStationPrice();

                const gasLimit = await contractInstance.methods[functionName](...args).estimateGas({
                    from: this.config.publicKey,
                });

                const encodedABI = contractInstance.methods[functionName](...args).encodeABI();
                const tx = {
                    from: this.config.publicKey,
                    to: contractInstance.options.address,
                    data: encodedABI,
                    gasPrice: gasPrice || this.web3.utils.toWei('20', 'Gwei'),
                    gas: gasLimit || this.web3.utils.toWei('900', 'Kwei'),
                };

                const createdTransaction = await this.web3.eth.accounts.signTransaction(
                    tx,
                    this.config.privateKey,
                );
                result = await this.web3.eth.sendSignedTransaction(
                    createdTransaction.rawTransaction,
                );
            } catch (error) {
                await this.handleError(error, functionName);
            }
        }

        return result;
    }

    async createAssertionRecord(stateCommitHash, rootHash, issuer) {
        const result = await this.executeContractFunction(
            this.DKGContract,
            'createAssertionRecord',
            [`0x${stateCommitHash}`, `0x${rootHash}`, issuer, new BigNumber(1), new BigNumber(1)],
        );
        return { transactionHash: result.transactionHash, blockchain: this.config.networkId };
    }

    async registerAsset(uai, type, alsoKnownAs, stateCommitHash, rootHash, tokenAmount) {
        const result = await this.executeContractFunction(
            this.UAIRegistryContract,
            'registerAsset',
            [`0x${uai}`, 0, `0x${uai}`, `0x${stateCommitHash}`, `0x${rootHash}`, 1],
        );
        return { transactionHash: result.transactionHash, blockchain: this.config.networkId };
    }

    async updateAsset(UAI, newStateCommitHash, rootHash) {
        const result = await this.executeContractFunction(
            this.UAIRegistryContract,
            'updateAssetState',
            [`0x${UAI}`, `0x${newStateCommitHash}`, `0x${rootHash}`],
        );
        return { transactionHash: result.transactionHash, blockchain: this.config.networkId };
    }


    async handleError(error, functionName) {
        let isRpcError = false;
        try {
            await this.web3.eth.net.isListening();
        } catch (rpcError) {
            isRpcError = true;
            this.logger.debug(
                `Unable to execute smart contract function ${functionName} using blockchain rpc : ${
                    this.config.rpcEndpoints[this.rpcNumber]
                }.`,
            );
            await this.restartService();
        }
        if (!isRpcError) throw error;
    }

    async restartService() {
        this.rpcNumber = (this.rpcNumber + 1) % this.config.rpcEndpoints.length;
        this.logger.debug(
            `There was an issue with current blockchain rpc. Connecting to ${
                this.config.rpcEndpoints[this.rpcNumber]
            }`,
        );
        await this.initializeWeb3();
        await this.initializeContracts();
    }
}

module.exports = Web3Service;
