const Utilities = require("../utilities");
const constants = require("../../constants");
const ServiceAgreementStorageABI = require('dkg-evm-module/build/contracts/ServiceAgreementStorage.json').abi;
const ContentAssetABI = require("dkg-evm-module/build/contracts/ContentAsset.json").abi;
const AssertionRegistryABI = require("dkg-evm-module/build/contracts/AssertionRegistry.json").abi;
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
      gasPrice = await this.web3.eth.getGasPrice();
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

    const serviceAgreementStorageContract = await this.callContractFunction(
      this.hubContract,
      "getContractAddress",
      ["ServiceAgreementStorage"]
    );
    this.ServiceAgreementStorageContract = new this.web3.eth.Contract(
      ServiceAgreementStorageABI,
      serviceAgreementStorageContract
    );

    const contentAssetContract = await this.callContractFunction(
      this.hubContract,
      "getAssetContractAddress",
      ["ContentAsset"]
    );
    this.ContentAssetContract = new this.web3.eth.Contract(
      ContentAssetABI,
      contentAssetContract
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
      const triplesNumber = options.triplesNumber ?? constants.PUBLISH_TRIPLES_NUMBER;
      const chunksNumber = options.chunksNumber ?? constants.PUBLISH_CHUNKS_NUMBER;
      const epochsNum = options.epochsNum ?? constants.PUBLISH_EPOCHS_NUM;
      const tokenAmount = options.tokenAmount ?? constants.PUBLISH_TOKEN_AMOUNT;
      return [assertionId, assertionSize, triplesNumber, chunksNumber, epochsNum, tokenAmount];
    } catch (e) {
      throw Error("Invalid request parameters.");
    }
  }

  generateUpdateAssetRequest(UAI, assertion, assertionId, options) {
    try {
      const assertionSize = Utilities.getAssertionSizeInKb(assertion);
      const triplesNumber = options.triplesNumber ?? constants.PUBLISH_TRIPLES_NUMBER;
      const chunksNumber = options.chunksNumber ?? constants.PUBLISH_CHUNKS_NUMBER;
      const epochsNum = options.epochsNum ?? constants.PUBLISH_EPOCHS_NUM;
      const tokenAmount = options.tokenAmount ?? constants.PUBLISH_TOKEN_AMOUNT;
      return [UAI, assertionId, assertionSize, triplesNumber, chunksNumber, epochsNum, tokenAmount];
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
      [
        this.ServiceAgreementStorageContract.options.address,
        options.tokenAmount ?? constants.PUBLISH_TOKEN_AMOUNT,
      ],
      blockchain
    );

    stepHooks.afterHook({
      status: OPERATIONS_STEP_STATUS.INCREASE_ALLOWANCE_COMPLETED,
    });

    try {
      let receipt = await this.executeContractFunction(
        this.ContentAssetContract,
        "createAsset",
        requestData,
        blockchain
      );

      const { assetContract, tokenId, stateCommitHash } = await this.decodeEventLogs(receipt, "AssetCreated");

      stepHooks.afterHook({
        status: OPERATIONS_STEP_STATUS.CREATE_ASSET_COMPLETED,
        data: { tokenId }
      });

      return tokenId;
    } catch(e) {
      await this.executeContractFunction(
        this.TokenContract,
        "decreaseAllowance",
        [
          this.ServiceAgreementStorageContract.options.address,
          options.tokenAmount ?? constants.PUBLISH_TOKEN_AMOUNT,
        ],
        blockchain
      );
    }
  }

  async updateAsset(requestData, options) {
    const blockchain = this.getBlockchain(options);
    this.web3 = this.web3 ?? this.initializeWeb3(blockchain.rpc);
    await this.initializeContracts(blockchain.hubContract);
    await this.executeContractFunction(
      this.TokenContract,
      "increaseAllowance",
      [this.ServiceAgreementStorageContract.options.address, options.tokenAmount],
      blockchain
    );

    try {
      return this.executeContractFunction(
        this.ContentAssetContract,
        "updateAsset",
        requestData,
        blockchain
      );
    } catch(e) {
      await this.executeContractFunction(
        this.TokenContract,
        "decreaseAllowance",
        [this.ServiceAgreementStorageContract.options.address, options.tokenAmount],
        blockchain
      );
    }
  }

  async getAssertionsLength(UAI, options = null) {
    if(options) {
      const blockchain = this.getBlockchain(options);
      this.web3 = this.web3 ?? this.initializeWeb3(blockchain.rpc);
      await this.initializeContracts(blockchain.hubContract);
    }
    return await this.ContentAssetContract.methods.getAssertionsLength(UAI).call();
  }

  async getLatestAssertion(UAI, options = null) {
    if(options) {
      const blockchain = this.getBlockchain(options);
      this.web3 = this.web3 ?? this.initializeWeb3(blockchain.rpc);
      await this.initializeContracts(blockchain.hubContract);
    }
    const assertionsLength = await this.ContentAssetContract.methods.getAssertionsLength(UAI).call();
    return await this.ContentAssetContract.methods.getAssertionByIndex(UAI, assertionsLength - 1).call();
  }

  async getAssetOwner(UAI, options = null) {
    if(options) {
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

  getCommitOffset(options) {
    if (options.commitOffset) {
      return options.commitOffset;
    }
    return constants.DEFAULT_COMMIT_OFFSET;
  }
}
module.exports = BlockchainServiceBase;
