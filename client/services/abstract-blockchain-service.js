const BigNumber = require("big-number");
const axios = require("axios");
const Hub = require('../../build/contracts/Hub.json');
const UAIRegistry = require('../../build/contracts/UAIRegistry.json');
const Token = require('../../build/contracts/ERC20Token.json');

class AbstractBlockchainService {
  initialized = false;

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

  async initializeContracts() {
    this.hubContract = new this.web3.eth.Contract(
        Hub.abi,
        this.config.hubContractAddress,
    );

    const UAIRegistryContractAddress = await this.callContractFunction(this.hubContract, 'getContractAddress', ['UAIRegistry']);

    this.UAIRegistryContract = new this.web3.eth.Contract(
        UAIRegistry.abi,
        UAIRegistryContractAddress,
    );

    const TokenAddress = await this.callContractFunction(this.hubContract, 'getContractAddress', ['Token']);

    this.TokenContract = new this.web3.eth.Contract(
        Token.abi,
        TokenAddress,
    );

    this.initialized = true;
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
      await this.handleError(error, functionName);
    }
  }

  async callContractFunction(contractInstance, functionName, args) {
    let result;
    while (!result) {
      try {
        result = await contractInstance.methods[functionName](...args).call();
      } catch (error) {
        await this.handleError(error, functionName);
      }
    }

    return result;
  }

  async createAsset(
      stateCommitHash,
      amount,
      length,
      holdingTimeInSeconds,
      signature,
      options
  ) {
    const transactionReceipt = await this.executeContractFunction(
        this.UAIRegistryContract,
        "createAsset",
        [`0x${stateCommitHash}`, 0, length, 2400, `0x${signature}`],
        options
    );
    const UAI = parseInt(transactionReceipt.logs[4].topics[1], 16);

    return {
      UAI,
      blockchain: this.config.networkId,
    };
  }

  async balanceOf(
      address
  ) {
    const balance = await this.callContractFunction(
        this.TokenContract,
        "balanceOf",
        [address]
    );

    return balance;
  }

  async handleError(error, functionName) {}

  async restartService() {}

  isInitialized() {
    return this.initialized;
  }
}

module.exports = AbstractBlockchainService;
