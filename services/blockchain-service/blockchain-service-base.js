const Web3 = require("web3");
const { BLOCKCHAINS } = require("../../constants");
const OPERATIONS_STEP_STATUS =
  require("../../constants.js").OPERATIONS_STEP_STATUS;
const emptyHooks = require("../../util/empty-hooks.js");

const FIXED_GAS_LIMIT_METHODS = {
  createAsset: 370000,
};

class BlockchainServiceBase {
  constructor() {
    this.abis = {};
    this.abis.Hub = require("dkg-evm-module/build/contracts/Hub.json").abi;
    this.abis.ServiceAgreementV1 =
      require("dkg-evm-module/build/contracts/ServiceAgreementV1.json").abi;
    this.abis.ContentAsset =
      require("dkg-evm-module/build/contracts/ContentAsset.json").abi;
    this.abis.Token =
      require("dkg-evm-module/build/contracts/ERC20Token.json").abi;
    for (const blockchainName of Object.keys(BLOCKCHAINS)) {
      this[blockchainName] = {
        contracts: {},
        contractAddresses: {
          Hub: BLOCKCHAINS[blockchainName].hubContract,
        },
      };
    }
  }

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

  async callContractFunction(contractName, functionName, args, blockchain) {
    const contractInstance = await this.getContractInstance(
      blockchain.name,
      contractName
    );

    return contractInstance.methods[functionName](...args).call();
  }

  async prepareTransaction(contractInstance, functionName, args, blockchain) {
    const web3Instance = await this.getWeb3Instance(
      blockchain.name,
      blockchain.rpc
    );
    let gasLimit;
    if (FIXED_GAS_LIMIT_METHODS[functionName]) {
      gasLimit = FIXED_GAS_LIMIT_METHODS[functionName];
    } else {
      gasLimit = await contractInstance.methods[functionName](
          ...args
      ).estimateGas({
        from: blockchain.publicKey,
      });
    }

    const encodedABI = await contractInstance.methods[functionName](
      ...args
    ).encodeABI();

    let gasPrice;

    if (blockchain.name === "otp") {
      gasPrice = await web3Instance.eth.getGasPrice();
    } else {
      gasPrice = Web3.utils.toWei("100", "Gwei");
    }

    return {
      from: blockchain.publicKey,
      to: contractInstance.options.address,
      data: encodedABI,
      gasPrice,
      gas: gasLimit ?? Web3.utils.toWei("900", "Kwei"),
    };
  }
  async getWeb3Instance(blockchainName, blockchainRpc) {
    if (!this[blockchainName].web3) {
      this.initializeWeb3(blockchainName, blockchainRpc);
    }
    return this[blockchainName].web3;
  }

  async getContractAddress(blockchainName, contractName, blockchainRpc) {
    if (!this[blockchainName].contracts.Hub) {
      const web3Instance = await this.getWeb3Instance(
        blockchainName,
        blockchainRpc
      );
      this[blockchainName].contracts.Hub = new web3Instance.eth.Contract(
        this.abis.Hub,
        this[blockchainName].contractAddresses.Hub
      );
    }

    if (!this[blockchainName].contractAddresses[contractName]) {
      this[blockchainName].contractAddresses[contractName] =
        await this.callContractFunction(
          "Hub",
          contractName.endsWith("Asset")
            ? "getAssetContractAddress"
            : "getContractAddress",
          [contractName],
          {
            name: blockchainName,
            rpc: blockchainRpc,
          }
        );
    }
    return this[blockchainName].contractAddresses[contractName];
  }

  async getContractInstance(blockchainName, contractName, blockchainRpc) {
    if (!this[blockchainName].contractAddresses[contractName]) {
      this[blockchainName].contractAddresses[contractName] =
        await this.getContractAddress(
          blockchainName,
          contractName,
          blockchainRpc
        );
    }
    if (!this[blockchainName].contracts[contractName]) {
      const web3Instance = await this.getWeb3Instance(
        blockchainName,
        blockchainRpc
      );
      this[blockchainName].contracts[contractName] =
        new web3Instance.eth.Contract(
          this.abis[contractName],
          this[blockchainName].contractAddresses[contractName]
        );
    }

    return this[blockchainName].contracts[contractName];
  }

  async createAsset(requestData, options, stepHooks = emptyHooks) {
    const blockchain = this.getBlockchain(options);

    const serviceAgreementV1Address = await this.getContractAddress(
      blockchain.name,
      "ServiceAgreementV1",
      blockchain.rpc
    );
    await this.executeContractFunction(
      "Token",
      "increaseAllowance",
      [serviceAgreementV1Address, requestData.tokenAmount],
      blockchain
    );

    stepHooks.afterHook({
      status: OPERATIONS_STEP_STATUS.INCREASE_ALLOWANCE_COMPLETED,
    });

    try {
      const receipt = await this.executeContractFunction(
        "ContentAsset",
        "createAsset",
        [Object.values(requestData)],
        blockchain
      );

      const { tokenId } = await this.decodeEventLogs(
        receipt,
        "AssetCreated",
        blockchain
      );

      stepHooks.afterHook({
        status: OPERATIONS_STEP_STATUS.CREATE_ASSET_COMPLETED,
        data: { tokenId },
      });

      return tokenId;
    } catch (e) {
      await this.executeContractFunction(
        "Token",
        "decreaseAllowance",
        [serviceAgreementV1Address, requestData.tokenAmount],
        blockchain
      );
      throw e;
    }
  }

  async updateAsset(tokenId, requestData, options) {
    const blockchain = this.getBlockchain(options);

    const serviceAgreementV1Address = await this.getContractAddress(
      blockchain.name,
      "ServiceAgreementV1",
      blockchain.rpc
    );

    await this.executeContractFunction(
      "Token",
      "increaseAllowance",
      [serviceAgreementV1Address, requestData.tokenAmount],
      blockchain
    );

    try {
      return this.executeContractFunction(
        "ContentAsset",
        "updateAsset",
        [tokenId, Object.values(requestData)],
        blockchain
      );
    } catch (e) {
      await this.executeContractFunction(
        "Token",
        "decreaseAllowance",
        [serviceAgreementV1Address, requestData.tokenAmount],
        blockchain
      );
    }
  }

  async getAssertionIdsLength(tokenId, options = {}) {
    const blockchain = this.getBlockchain(options);

    return this.callContractFunction(
      "ContentAsset",
      "getAssertionIdsLength",
      [tokenId],
      blockchain
    );
  }

  async getLatestAssertionId(tokenId, options = {}) {
    const blockchain = this.getBlockchain(options);

    return this.callContractFunction(
      "ContentAsset",
      "getLatestAssertionId",
      [tokenId],
      blockchain
    );
  }

  async getAssetOwner(tokenId, options = {}) {
    const blockchain = this.getBlockchain(options);

    return this.callContractFunction(
      "ContentAsset",
      "ownerOf",
      [tokenId],
      blockchain
    );
  }

  convertToWei(ether) {
    return Web3.utils.toWei(ether.toString(), "ether");
  }
}
module.exports = BlockchainServiceBase;
