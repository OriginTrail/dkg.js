const BigNumber = require("big-number");
const axios = require("axios");
const DKGContractAbi = require("../../build/contracts/DKGcontract.json").abi;
const UAIRegistryAbi = require("../../build/contracts/UAIRegistry.json").abi;

class AbstractBlockchainService {
  getName() {
    return "BlockchainService";
  }

  constructor(config, logger) {
    this.config = config;
    this.logger = logger;

    this.gasStationLink = "https://gasstation-mainnet.matic.network/v2";
    this.initializeWeb3();
  }

  async initializeWeb3() {}

  async sign(message) {}

  async getUAIRegistryContract() {
    if (!this.UAIRegistryContract) {
      this.UAIRegistryContract = new this.web3.eth.Contract(
        UAIRegistryAbi,
        this.config.hubContractAddress
      );
    }
    return this.UAIRegistryContract;
  }

  async getDKGContract() {
    if (!this.DKGContract) {
      const UAIRegistryContract = await this.getUAIRegistryContract();
      const DKGContractAddress = await UAIRegistryContract.methods
        .getAssertionRegistry()
        .call();
      this.DKGContract = new this.web3.eth.Contract(
        DKGContractAbi,
        DKGContractAddress
      );
    }
    return this.DKGContract;
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

  async executeContractFunction(
    contractInstance,
    functionName,
    args,
    options
  ) {}

  async createAssertionRecord(stateCommitHash, rootHash, issuer, options) {
    const result = await this.executeContractFunction(
      await this.getDKGContract(),
      "createAssertionRecord",
      [
        `0x${stateCommitHash}`,
        `0x${rootHash}`,
        issuer,
        new BigNumber(1),
        new BigNumber(1),
      ],
      options
    );
    return {
      transactionHash: result.transactionHash,
      blockchain: this.config.networkId,
    };
  }

  async registerAsset(
    uai,
    type,
    alsoKnownAs,
    stateCommitHash,
    rootHash,
    tokenAmount,
    options
  ) {
    const result = await this.executeContractFunction(
      await this.getUAIRegistryContract(),
      "registerAsset",
      [`0x${uai}`, 0, `0x${uai}`, `0x${stateCommitHash}`, `0x${rootHash}`, 1],
      options
    );
    return {
      transactionHash: result.transactionHash,
      blockchain: this.config.networkId,
    };
  }

  async updateAsset(UAI, newStateCommitHash, rootHash, options) {
    const result = await this.executeContractFunction(
      await this.getUAIRegistryContract(),
      "updateAssetState",
      [`0x${UAI}`, `0x${newStateCommitHash}`, `0x${rootHash}`],
      options
    );
    return {
      transactionHash: result.transactionHash,
      blockchain: this.config.networkId,
    };
  }

  async handleError(error, functionName) {}

  async restartService() {}
}

module.exports = AbstractBlockchainService;
