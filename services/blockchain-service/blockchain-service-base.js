const Utilities = require("../utilities");
const constants = require("../../constants");
const AssetRegistryABI = require("dkg-evm-module/build/contracts/AssetRegistry.json").abi;
const AssertionRegistryABI = require("dkg-evm-module/build/contracts/AssertionRegistry.json").abi;
const UAIRegistryABI = require("dkg-evm-module/build/contracts/UAIRegistry.json").abi;
const HubABI = require("dkg-evm-module/build/contracts/Hub.json").abi;
const ERC20TokenABI = require("dkg-evm-module/build/contracts/ERC20Token.json").abi;
const OPERATIONS_STEP_STATUS = require('../../constants.js').OPERATIONS_STEP_STATUS;
const emptyHooks = require('../../util/empty-hooks.js');

class BlockchainServiceBase {
  constructor() {}

  initializeWeb3() {
    // overridden by subclasses
    return {};
  }

  getBlockchain() {
    // overridden by subclasses
    return {};
  }

  async decodeEventLogs() {
    // overridden by subclasses
    return {};
  }

  async callContractFunction(contractInstance, functionName, args) {
    return contractInstance.methods[functionName](...args).call();
  }

  async prepareTransaction(contractInstance, functionName, args, blockchain) {
    const gasLimit = await contractInstance.methods[functionName](
      ...args
    ).estimateGas({
      from: blockchain.publicKey,
    });

    const encodedABI = await contractInstance.methods[functionName](
      ...args
    ).encodeABI();

    let gasPrice;

    if(blockchain.name === "otp") {
      // hotfix: amount needs to be multiplied until getGasPrice on otp is fixed
      gasPrice = (await this.web3.eth.getGasPrice()) * 1_000_000;
    } else {
      gasPrice = this.web3.utils.toWei("100", "Gwei")
    }

    return {
      from: blockchain.publicKey,
      to: contractInstance.options.address,
      data: encodedABI,
      gasPrice,
      gas: gasLimit || this.web3.utils.toWei("900", "Kwei"),
    };
  }

  async initializeContracts(hubContract) {
    this.hubContract = new this.web3.eth.Contract(HubABI, hubContract);

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

  generateCreateAssetRequest(assertion, assertionId, options) {
    try {
      const assertionSize = Utilities.getAssertionSizeInKb(assertion);
      const holdingTimeInYears =
        options.holdingTimeInYears ?? constants.HOLDING_TIME_IN_YEARS;
      const tokenAmount = options.tokenAmount ?? constants.PUBLISH_TOKEN_AMOUNT;
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
      const holdingTimeInYears =
        options.holdingTimeInYears ?? constants.HOLDING_TIME_IN_YEARS;
      const tokenAmount = options.tokenAmount ?? constants.PUBLISH_TOKEN_AMOUNT;
      return [UAI, assertionId, assertionSize, holdingTimeInYears, tokenAmount];
    } catch (e) {
      throw Error("Invalid request parameters.");
    }
  }

  async createAsset(requestData, options, stepHooks = emptyHooks) {
    const blockchain = this.getBlockchain(options);
    this.web3 = this.web3 ?? this.initializeWeb3(blockchain.rpc);
    await this.initializeContracts(blockchain.hubContract);
    await this.executeContractFunction(
      this.TokenContract,
      "increaseAllowance",
      [this.AssetRegistryContract.options.address, options.tokenAmount],
      blockchain
    );

    stepHooks.afterHook({
      status: OPERATIONS_STEP_STATUS.INCREASE_ALLOWANCE_COMPLETED,
    });

    let receipt = await this.executeContractFunction(
      this.AssetRegistryContract,
      "createAsset",
      requestData,
      blockchain
    );
    const { UAI } = await this.decodeEventLogs(receipt, "AssetCreated");

    stepHooks.afterHook({
      status: OPERATIONS_STEP_STATUS.CREATE_ASSET_COMPLETED,
      data: { UAI }
    });

    return UAI;
  }

  async updateAsset(requestData, options) {
    const blockchain = this.getBlockchain(options);
    this.web3 = this.web3 ?? this.initializeWeb3(blockchain.rpc);
    await this.initializeContracts(blockchain.hubContract);
    await this.executeContractFunction(
      this.TokenContract,
      "increaseAllowance",
      [this.AssetRegistryContract.options.address, options.tokenAmount],
      blockchain
    );
    return this.executeContractFunction(
      this.AssetRegistryContract,
      "updateAsset",
      requestData,
      blockchain
    );
  }

  async getAssetCommitHash(UAI, options) {
    const blockchain = this.getBlockchain(options);
    this.web3 = this.web3 ?? this.initializeWeb3(blockchain.rpc);
    await this.initializeContracts(blockchain.hubContract);
    return this.callContractFunction(
      this.AssetRegistryContract,
      "getCommitHash",
      [UAI, this.getCommitOffset(options)]
    );
  }

  async getAssetOwner(UAI, options = null) {
    if(options) {
      const blockchain = this.getBlockchain(options);
      this.web3 = this.web3 ?? this.initializeWeb3(blockchain.rpc);
      await this.initializeContracts(blockchain.hubContract);
    }
    return await this.UAIRegistryContract.methods.ownerOf(UAI).call();
  }

  deriveUAL(blockchain, contract, UAI) {
    return Utilities.deriveUAL(blockchain, contract, UAI);
  }

  generateUAL(options, UAI) {
    const blockchain = this.getBlockchain(options);

    return this.deriveUAL(blockchain.name, blockchain.hubContract, UAI);
  }

  getCommitOffset(options) {
    if (options.commitOffset) {
      return options.commitOffset;
    }
    return constants.DEFAULT_COMMIT_OFFSET;
  }
}
module.exports = BlockchainServiceBase;
