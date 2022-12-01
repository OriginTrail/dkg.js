const { assertionMetadata } = require("assertion-tools");
const Utilities = require("../utilities");
const constants = require("../../constants");
const ServiceAgreementABI =
  require("dkg-evm-module/build/contracts/ServiceAgreement.json").abi;
const ContentAssetABI =
  require("dkg-evm-module/build/contracts/ContentAsset.json").abi;
const HubABI = require("dkg-evm-module/build/contracts/Hub.json").abi;
const ERC20TokenABI =
  require("dkg-evm-module/build/contracts/ERC20Token.json").abi;
const OPERATIONS_STEP_STATUS =
  require("../../constants.js").OPERATIONS_STEP_STATUS;
const emptyHooks = require("../../util/empty-hooks.js");

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

    if (blockchain.name === "otp") {
      gasPrice = await this.web3.eth.getGasPrice();
    } else {
      gasPrice = this.web3.utils.toWei("100", "Gwei");
    }

    return {
      from: blockchain.publicKey,
      to: contractInstance.options.address,
      data: encodedABI,
      gasPrice,
      gas: gasLimit ?? this.web3.utils.toWei("900", "Kwei"),
    };
  }

  async initializeContracts(hubContract) {
    this.hubContract = new this.web3.eth.Contract(HubABI, hubContract);

    const serviceAgreementContractAddress = await this.callContractFunction(
      this.hubContract,
      "getContractAddress",
      ["ServiceAgreement"]
    );
    this.ServiceAgreementStorageContract = new this.web3.eth.Contract(
      ServiceAgreementABI,
      serviceAgreementContractAddress
    );

    const contentAssetContractAddress = await this.callContractFunction(
      this.hubContract,
      "getAssetContractAddress",
      ["ContentAsset"]
    );

    this.ContentAssetContract = new this.web3.eth.Contract(
      ContentAssetABI,
      contentAssetContractAddress
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
      const assertionSize =
        assertionMetadata.getAssertionSizeInBytes(assertion);
      const triplesNumber =
        assertionMetadata.getAssertionTriplesNumber(assertion);
      const chunksNumber =
        assertionMetadata.getAssertionChunksNumber(assertion);
      const epochsNum = options.epochsNum ?? constants.PUBLISH_EPOCHS_NUM;
      return [
        assertionId,
        assertionSize,
        triplesNumber,
        chunksNumber,
        epochsNum,
      ];
    } catch (e) {
      throw Error("Invalid request parameters.");
    }
  }

  generateUpdateAssetRequest(UAI, assertion, assertionId, options) {
    try {
      const assertionSize =
        assertionMetadata.getAssertionSizeInBytes(assertion);
      const triplesNumber =
        assertionMetadata.getAssertionTriplesNumber(assertion);
      const chunksNumber =
        assertionMetadata.getAssertionChunksNumber(assertion);
      const epochsNum = options.epochsNum ?? constants.PUBLISH_EPOCHS_NUM;
      return [
        UAI,
        assertionId,
        assertionSize,
        triplesNumber,
        chunksNumber,
        epochsNum,
      ];
    } catch (e) {
      throw Error("Invalid request parameters.");
    }
  }

  async createAsset(
    requestData,
    bidSuggestion,
    options,
    stepHooks = emptyHooks
  ) {
    const blockchain = this.getBlockchain(options);
    this.web3 = this.web3 ?? this.initializeWeb3(blockchain.rpc);
    const bid = this.web3.utils.toWei(bidSuggestion.toString(), "ether");
    await this.initializeContracts(blockchain.hubContract);
    await this.executeContractFunction(
      this.TokenContract,
      "increaseAllowance",
      [this.ServiceAgreementContract.options.address, bid],
      blockchain
    );

    stepHooks.afterHook({
      status: OPERATIONS_STEP_STATUS.INCREASE_ALLOWANCE_COMPLETED,
    });

    try {
      let receipt = await this.executeContractFunction(
        this.ContentAssetContract,
        "createAsset",
        [...requestData, bid],
        blockchain
      );

      const { tokenId } = await this.decodeEventLogs(receipt, "AssetCreated");

      stepHooks.afterHook({
        status: OPERATIONS_STEP_STATUS.CREATE_ASSET_COMPLETED,
        data: { tokenId },
      });

      return tokenId;
    } catch (e) {
      await this.executeContractFunction(
        this.TokenContract,
        "decreaseAllowance",
        [this.ServiceAgreementContract.options.address, bid],
        blockchain
      );
      throw e;
    }
  }

  async updateAsset(requestData, bidSuggestion, options) {
    const blockchain = this.getBlockchain(options);
    this.web3 = this.web3 ?? this.initializeWeb3(blockchain.rpc);
    const bid = this.web3.utils.toWei(bidSuggestion.toString(), "ether");
    await this.initializeContracts(blockchain.hubContract);
    await this.executeContractFunction(
      this.TokenContract,
      "increaseAllowance",
      [this.ServiceAgreementContract.options.address, bid],
      blockchain
    );

    try {
      return this.executeContractFunction(
        this.ContentAssetContract,
        "updateAsset",
        [...requestData, bid],
        blockchain
      );
    } catch (e) {
      await this.executeContractFunction(
        this.TokenContract,
        "decreaseAllowance",
        [this.ServiceAgreementContract.options.address, bid],
        blockchain
      );
    }
  }

  async getAssertionIdsLength(UAI, options = null) {
    if (options) {
      const blockchain = this.getBlockchain(options);
      this.web3 = this.web3 ?? this.initializeWeb3(blockchain.rpc);
      await this.initializeContracts(blockchain.hubContract);
    }
    return await this.ContentAssetContract.methods
      .getAssertionIdsLength(UAI)
      .call();
  }

  async getLatestAssertionId(UAI, options = null) {
    if (options) {
      const blockchain = this.getBlockchain(options);
      this.web3 = this.web3 ?? this.initializeWeb3(blockchain.rpc);
      await this.initializeContracts(blockchain.hubContract);
    }

    return await this.ContentAssetContract.methods
      .getLatestAssertionId(UAI)
      .call();
  }

  async getAssetOwner(UAI, options = null) {
    if (options) {
      const blockchain = this.getBlockchain(options);
      this.web3 = this.web3 ?? this.initializeWeb3(blockchain.rpc);
      await this.initializeContracts(blockchain.hubContract);
    }
    return await this.ContentAssetContract.methods.ownerOf(UAI).call();
  }

  deriveUAL(blockchain, contract, UAI) {
    return Utilities.deriveUAL(blockchain, contract, UAI);
  }

  generateUAL(options, UAI) {
    const blockchain = this.getBlockchain(options);

    return this.deriveUAL(blockchain.name, blockchain.assetContract, UAI);
  }
}
module.exports = BlockchainServiceBase;
