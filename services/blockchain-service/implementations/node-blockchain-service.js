const Web3 = require("web3");
const Utilities = require("../../utilities.js");
const constants = require("../../../constants.js");
const BlockchainServiceBase = require("../blockchain-service-base.js");

const AssetRegistryABI = require("../contracts/AssetRegistryABI.json");
const AssertionRegistryABI = require("../contracts/AssertionRegistryABI.json");
const UAIRegistryABI = require("../contracts/UAIRegistryABI.json");
const HubABI = require("../contracts/HubABI.json");
const ERC20TokenABI = require("../contracts/ERC20TokenABI.json");

const events = {};
AssetRegistryABI.filter((obj) => obj.type === "event").forEach((event) => {
  const concatInputs = event.inputs.reduce((i1, i2) => i1.type + "," + i2.type);

  events[event.name] = {
    hash: Web3.utils.keccak256(event.name + "(" + concatInputs + ")"),
    inputs: event.inputs,
  };
});

class NodeBlockchainService extends BlockchainServiceBase {
  constructor(config) {
    super(config);
    this.config = config;
  }

  async createAsset(requestData, options) {
    this.getBlockchain(options);
    this.web3 = new Web3(this.blockchain.rpc);
    await this.initializeContracts();
    await this.executeContractFunction(
      this.TokenContract,
      "increaseAllowance",
      [this.AssetRegistryContract.options.address, options.tokenAmount]
    );
    let receipt = await this.executeContractFunction(
      this.AssetRegistryContract,
      "createAsset",
      requestData
    );
    let { UAI } = await this.decodeEventLogs(receipt, "AssetCreated");
    return UAI;
  }

  async updateAsset(requestData, options) {
    this.getBlockchain(options);
    this.web3 = new Web3(this.blockchain.rpc);
    await this.initializeContracts();
    await this.executeContractFunction(
      this.TokenContract,
      "increaseAllowance",
      [this.AssetRegistryContract.options.address, options.tokenAmount]
    );
    return await this.executeContractFunction(
      this.AssetRegistryContract,
      "updateAsset",
      requestData
    );
  }

  async transferAsset(UAL, UAI, to, options) {
    this.getBlockchain(options);
    this.web3 = new Web3(this.blockchain.rpc);
    await this.initializeContracts();
    const from = this.blockchain.wallet;
    return await this.executeContractFunction(
      this.UAIRegistryContract,
      "transfer",
      [from, to, UAI]
    );
  }

  async getAssetOwner(UAI) {
    return await this.UAIRegistryContract.methods.ownerOf(UAI).call();
  }

  async createAssertion(requestData, options) {
    this.getBlockchain(options);
    this.web3 = new Web3(this.blockchain.rpc);
    await this.initializeContracts();
    await this.executeContractFunction(
      this.TokenContract,
      "increaseAllowance",
      [this.AssetRegistryContract.options.address, options.tokenAmount]
    );
    return await this.executeContractFunction(
      this.AssetRegistryContract,
      "createAsset",
      requestData
    );
  }

  async getAssetCommitHash(UAI, options) {
    this.getBlockchain(options);
    this.web3 = new Web3(this.blockchain.rpc);
    await this.initializeContracts();
    return await this.callContractFunction(
      this.AssetRegistryContract,
      "getCommitHash",
      [UAI, this.getCommitOffset(options)]
    );
  }

  generateCreateAssetRequest(assertion, assertionId, options) {
    try {
      const assertionSize = Utilities.getAssertionSizeInKb(assertion);
      const holdingTimeInYears = options.holdingTimeInYears
        ? options.holdingTimeInYears
        : constants.HOLDING_TIME_IN_YEARS;
      const tokenAmount = options.tokenAmount
        ? options.tokenAmount
        : constants.PUBLISH_TOKEN_AMOUNT;
      const visibility = options.visibility
        ? constants.VISIBILITY[options.visibility]
        : constants.DEFAULT_PUBLISH_VISIBILITY;
      return [
        assertionId,
        assertionSize,
        visibility,
        holdingTimeInYears,
        tokenAmount,
      ];
    } catch (e) {
      throw Error("Invalid request parameters.");
    }
  }

  generateUpdateAssetRequest(UAI, assertion, assertionId, options) {
    try {
      const assertionSize = Utilities.getAssertionSizeInKb(assertion);
      const holdingTimeInYears = options.holdingTimeInYears
        ? options.holdingTimeInYears
        : constants.HOLDING_TIME_IN_YEARS;
      const tokenAmount = options.tokenAmount
        ? options.tokenAmount
        : constants.PUBLISH_TOKEN_AMOUNT;
      return [UAI, assertionId, assertionSize, holdingTimeInYears, tokenAmount];
    } catch (e) {
      throw Error("Invalid request parameters.");
    }
  }

  async callContractFunction(contractInstance, functionName, args) {
    try {
      return await contractInstance.methods[functionName](...args).call();
    } catch (error) {
      console.error(error, "err");
      return null;
      // await this.handleError(error, functionName);
    }
  }

  async executeContractFunction(contractInstance, functionName, args) {
    try {
      const gasLimit = await contractInstance.methods[functionName](
        ...args
      ).estimateGas({
        from: this.blockchain.wallet,
      });

      const encodedABI = contractInstance.methods[functionName](
        ...args
      ).encodeABI();
      const tx = {
        from: this.blockchain.wallet,
        to: contractInstance.options.address,
        data: encodedABI,
        gasPrice: this.web3.utils.toWei("100", "Gwei"),
        gas: gasLimit || this.web3.utils.toWei("900", "Kwei"),
      };

      const createdTransaction = await this.web3.eth.accounts.signTransaction(
        tx,
        this.blockchain.privateKey
      );
      const transactionReceipt = await this.web3.eth.sendSignedTransaction(
        createdTransaction.rawTransaction
      );
      await new Promise(r => setTimeout(r, 10000));

      return transactionReceipt;
    } catch (error) {
      throw Error(error);
      // await this.handleError(error, functionName);
    }
  }

  getBlockchain(options) {
    if (options.blockchain && this.blockchainIsAvailable(options)) {
      if (this.config.blockchainConfig[options.blockchain]) {
        this.blockchain = this.config.blockchainConfig[options.blockchain];
        this.blockchain.title = options.blockchain;
        return this.blockchain;
      }
      throw Error("Blockchain configuration is missing.");
    } else {
      if (this.config.blockchainConfig[this.config.blockchain]) {
        this.blockchain = this.config.blockchainConfig[this.config.blockchain];
        this.blockchain.title = this.config.blockchain;
        return this.blockchain;
      }
      throw Error("Blockchain configuration is missing.");
    }
  }

  blockchainIsAvailable(options) {
    return constants.AVAILABLE_BLOCKCHAINS.find(
      (b) => b === options.blockchain
    );
  }

  async initializeContracts() {
    this.hubContract = new this.web3.eth.Contract(
      HubABI,
      this.blockchain.hubContract
    );

    const assetRegistryAddress = await this.callContractFunction(
      this.hubContract,
      "getContractAddress",
      ["AssetRegistry"]
    );
    this.AssetRegistryContract = new this.web3.eth.Contract(
      AssetRegistryABI,
      assetRegistryAddress
    );

    const AssertionRegistryAddress = await this.callContractFunction(
      this.hubContract,
      "getContractAddress",
      ["AssertionRegistry"]
    );
    this.AssertionRegistryContract = new this.web3.eth.Contract(
      AssertionRegistryABI,
      AssertionRegistryAddress
    );

    const UAIRegistryAddress = await this.callContractFunction(
      this.hubContract,
      "getContractAddress",
      ["UAIRegistry"]
    );
    this.UAIRegistryContract = new this.web3.eth.Contract(
      UAIRegistryABI,
      UAIRegistryAddress
    );

    const tokenAddress = await this.callContractFunction(
      this.hubContract,
      "getContractAddress",
      ["Token"]
    );
    this.TokenContract = new this.web3.eth.Contract(
      ERC20TokenABI,
      tokenAddress
    );
  }

  generateUAL(options, UAI) {
    this.getBlockchain(options);
    return this.deriveUAL(
      this.blockchain.title,
      this.blockchain.hubContract,
      UAI
    );
  }

  async decodeEventLogs(receipt, eventName) {
    let result;
    const { hash, inputs } = events[eventName];
    receipt.logs.forEach((row) => {
      if (row.topics[0] === hash)
        try {
          result = this.web3.eth.abi.decodeLog(
            inputs,
            row.data,
            row.topics.slice(1)
          );
        } catch (e) {
          console.error(e);
        }
    });
    return result;
  }

  getCommitOffset(options) {
    if (options.commitOffset) {
      return options.commitOffset;
    }
    return constants.DEFAULT_COMMIT_OFFSET;
  }
}

module.exports = NodeBlockchainService;
