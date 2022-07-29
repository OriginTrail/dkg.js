const Utilities = require('../../utilities.js')
const constants = require('../../../constants.js')
const BlockchainServiceBase = require('../blockchain-service-base.js');
const HubABI = require("../contracts/HubABI.json");
const AssetRegistryABI = require("../contracts/AssetRegistryABI.json");
const AssertionRegistryABI = require("../contracts/AssertionRegistryABI.json");
const UAIRegistryABI = require("../contracts/UAIRegistryABI.json");
const ERC20TokenABI = require("../contracts/ERC20TokenABI.json");
const axios = require("axios");
const BigNumber = require("big-number");
const Web3 = require("web3");

class BrowserBlockchainService extends BlockchainServiceBase{
    constructor(config) {
        super(config);
        this.config = config;
        this.blockchain = {};
        this.blockchain.title = this.config.blockchain;
        this.blockchain.hubContract = constants.BLOCKCHAINS[this.config.blockchain].hubContract;
        this.gasStationLink = "https://gasstation-mainnet.matic.network/v2";
    }

    async createAsset(requestData, options) {
        this.web3 = this.initializeWeb3();
        await this.initializeContracts();
        await this.executeContractFunction(this.TokenContract, 'increaseAllowance', [
            this.AssetRegistryContract.options.address,
            options.tokenAmount
        ]);
        let receipt = await this.executeContractFunction(this.AssetRegistryContract, 'createAsset', requestData);
        return this.extractUAIFromTxReceipt(receipt);
    }

    async getAssetCommitHash(UAI, options) {
        this.web3 = this.initializeWeb3();
        await this.initializeContracts();
        return await this.callContractFunction(this.AssetRegistryContract, 'getCommitHash', [UAI, this.getCommitOffset(options)]);
    }

    generateCreateAssetRequest(assertion, assertionId, options) {
        try {
            const assertionSize = Utilities.getAssertionSizeInKb(assertion);
            const holdingTimeInYears = (options.holdingTimeInYears) ? options.holdingTimeInYears : constants.HOLDING_TIME_IN_YEARS;
            const tokenAmount = (options.tokenAmount) ? options.tokenAmount : constants.PUBLISH_TOKEN_AMOUNT;
            const visibility = (options.visibility) ? constants.VISIBILITY[options.visibility] : constants.DEFAULT_PUBLISH_VISIBILITY;
            return [assertionId, assertionSize, visibility, holdingTimeInYears, tokenAmount];
        } catch (e) {
            throw Error("Invalid request parameters.")
        }
    }

    test() {
        return "tu smo u browseru";
    }

    initializeWeb3() {
        if (window.Web3) {
            if (
                typeof window.Web3 === "undefined" ||
                !window.Web3 ||
                !window.ethereum
            ) {
                this.logger.error(
                    "No web3 implementation injected, please inject your own Web3 implementation to use metamask"
                );
                return;
            }
            return new window.Web3(window.ethereum);
        } else {
            this.logger.error(
                "Non-Ethereum browser detected. You should consider installing MetaMask."
            );
        }
    }

    async initializeContracts() {
        this.hubContract = new this.web3.eth.Contract(HubABI, this.blockchain.hubContract);

        const assetRegistryAddress = await this.callContractFunction(
            this.hubContract,
            'getContractAddress',
            ['AssetRegistry'],
        );
        this.AssetRegistryContract = new this.web3.eth.Contract(AssetRegistryABI, assetRegistryAddress);

        const AssertionRegistryAddress = await this.callContractFunction(
            this.hubContract,
            'getContractAddress',
            ['AssertionRegistry'],
        );
        this.AssertionRegistryContract = new this.web3.eth.Contract(AssertionRegistryABI, AssertionRegistryAddress);

        const UAIRegistryAddress = await this.callContractFunction(
            this.hubContract,
            'getContractAddress',
            ['UAIRegistry'],
        );
        this.UAIRegistryContract = new this.web3.eth.Contract(UAIRegistryABI, UAIRegistryAddress);

        const tokenAddress = await this.callContractFunction(
            this.hubContract,
            'getContractAddress',
            ['Token'],
        );
        this.TokenContract = new this.web3.eth.Contract(ERC20TokenABI, tokenAddress);
    }

    generateUAL(options, UAI) {
        return this.deriveUAL(this.blockchain.title, this.blockchain.hubContract, UAI);
    }

    async callContractFunction(contractInstance, functionName, args) {
        try {
            return await contractInstance.methods[functionName](...args).call();
        } catch (error) {
            console.log(error, 'err');
            return false;
            // await this.handleError(error, functionName);
        }
    }

    async executeContractFunction(contractInstance, functionName, args) {
        try {
            const tx = await this.prepareTransaction(
                contractInstance,
                functionName,
                args,
                {publicKey: await this.getAccount()}
            );

            const result = await contractInstance.methods[functionName](...args).send(
                tx
            );
            return result;
        } catch (error) {
            console.error(error);
        }
    }

    async prepareTransaction(contractInstance, functionName, args, options) {
        const gasPrice = await this.getGasStationPrice();

        const gasLimit = await contractInstance.methods[functionName](
            ...args
        ).estimateGas({
            from: options.publicKey,
        });

        const encodedABI = await contractInstance.methods[functionName](
            ...args
        ).encodeABI();

        return {
            from: options.publicKey,
            to: contractInstance.options.address,
            data: encodedABI,
            gasPrice: gasPrice || this.web3.utils.toWei("20", "Gwei"),
            gas: gasLimit || this.web3.utils.toWei("900", "Kwei"),
        };
    }

    async getAccount() {
        if (!this.account) {
            const accounts = await window.ethereum
                .request({ method: "eth_requestAccounts" })
                .catch(() => {
                    this.logger.error("There was an error fetching your accounts");
                });
            this.account = accounts[0];
        }
        return this.account;
    }

    async getGasStationPrice() {
        try {
            const response = await axios.get(this.gasStationLink);
            const gasPrice = response?.data?.standard?.maxFee;
            return Math.round(gasPrice * 1e9);
        } catch (e) {
            this.logger.error(
                `There was an error fetching gas price from the gas station: ${e.message}`
            );
            return undefined;
        }
    }

    extractUAIFromTxReceipt(transactionReceipt) {
        return parseInt(transactionReceipt.events.AssetCreated.returnValues.UAI);
    }

    getCommitOffset(options) {
        if(options.commitOffset) {
            return options.commitOffset;
        }
        return constants.DEFAULT_COMMIT_OFFSET;
    }
}
module.exports = BrowserBlockchainService;
