const constants = require("../../../constants.js");
const BlockchainServiceBase = require("../blockchain-service-base.js");
const Web3 = require("web3");
const {WEBSOCKET_PROVIDER_OPTIONS} = require("../../../constants.js");

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
        BLOCKCHAINS[options.blockchain.name].hubContract,
      assetContract:
        options.blockchain.assetContract ??
        constants.BLOCKCHAINS[options.blockchain.name].assetContract,
      rpc: options.blockchain.rpc ?? constants.BLOCKCHAINS[options.blockchain.name].rpc,
    };
  }

  initializeWeb3(blockchainRpc) {
    if (
      typeof window.Web3 === "undefined" ||
      !window.Web3
    ) {
      this.logger.error(
        "No web3 implementation injected, please inject your own Web3 implementation."
      );
      return;
    }
    if(window.ethereum) {
      return new window.Web3(window.ethereum);
    } else {
      if (blockchainRpc.startsWith("ws")) {
        const provider = new window.Web3.providers.WebsocketProvider(
            blockchainRpc,
            WEBSOCKET_PROVIDER_OPTIONS
        );
        return new Web3(provider);
      } else {
        return new window.Web3(blockchainRpc);
      }
    }
  }

  async executeContractFunction(
    contractInstance,
    functionName,
    args,
    blockchain
  ) {
    const tx = await this.prepareTransaction(
      contractInstance,
      functionName,
      args,
      { name: blockchain.name, publicKey: await this.getAccount() }
    );

    const result = await contractInstance.methods[functionName](...args).send(
      tx
    );
    return result;
  }

  async getAccount() {
    if (!this.account) {
      if(!window.ethereum) {
        throw Error("This operation can be performed only by using Metamask accounts.");
      }
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

  async transferAsset(UAI, to, options) {
    const blockchain = this.getBlockchain(options);
    this.web3 = this.web3 ?? this.initializeWeb3(blockchain.rpc);
    await this.initializeContracts(blockchain.hubContract);
    return await this.executeContractFunction(
      this.ContentAssetContract,
      "transfer",
      [await this.getAccount(), to, UAI],
      blockchain
    );
  }
}
module.exports = BrowserBlockchainService;
