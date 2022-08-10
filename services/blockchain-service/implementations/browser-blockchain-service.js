const constants = require("../../../constants.js");
const BlockchainServiceBase = require("../blockchain-service-base.js");

class BrowserBlockchainService extends BlockchainServiceBase {
  constructor(config) {
    super(config);
    this.config = config;
  }

  getBlockchain(options) {
    return {
      name: options.blockchain.name,
      hubContract:
        options.blockchain.hubContract ??
        constants.BLOCKCHAINS[options.blockchain.name].hubContract,
    };
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

  async executeContractFunction(contractInstance, functionName, args) {
    const tx = await this.prepareTransaction(
      contractInstance,
      functionName,
      args,
      { publicKey: await this.getAccount() }
    );

    const result = await contractInstance.methods[functionName](...args).send(
      tx
    );
    return result;
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

  async decodeEventLogs(receipt, eventName) {
    return receipt.events[eventName].returnValues;
  }

  async transferAsset(UAL, UAI, to, options) {
    const blockchain = this.getBlockchain(options);
    this.web3 = this.initializeWeb3(blockchain.rpc);
    await this.initializeContracts(blockchain.hubContract);
    return await this.executeContractFunction(
      this.UAIRegistryContract,
      "transfer",
      [await this.getAccount(), to, UAI]
    );
  }
}
module.exports = BrowserBlockchainService;
