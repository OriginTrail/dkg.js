const Web3 = require("web3");
const {
  BLOCKCHAINS,
  WEBSOCKET_PROVIDER_OPTIONS,
} = require("../../../constants.js");
const BlockchainServiceBase = require("../blockchain-service-base.js");
const ContentAssetABI = require("dkg-evm-module/build/contracts/ContentAsset.json").abi;

const events = {};
ContentAssetABI.filter((obj) => obj.type === "event").forEach((event) => {
  const concatInputs = event.inputs.map((input) => input.internalType);

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

  initializeWeb3(blockchainRpc) {
    if (blockchainRpc.startsWith("ws")) {
      const provider = new Web3.providers.WebsocketProvider(
        blockchainRpc,
        WEBSOCKET_PROVIDER_OPTIONS
      );
      return new Web3(provider);
    } else {
      return new Web3(blockchainRpc);
    }
  }

  getBlockchain(options) {
    return {
      name: options.blockchain.name,
      rpc: options.blockchain.rpc ?? BLOCKCHAINS[options.blockchain.name].rpc,
      hubContract:
        options.blockchain.hubContract ??
        BLOCKCHAINS[options.blockchain.name].hubContract,
      assetContract:
        options.blockchain.assetContract ??
        BLOCKCHAINS[options.blockchain.name].assetContract,
      publicKey: this.config.blockchain?.publicKey ?? options.blockchain.publicKey,
      privateKey: this.config.blockchain?.privateKey ?? options.blockchain.privateKey,
    };
  }

  async executeContractFunction(
    contractInstance,
    functionName,
    args,
    blockchain
  ) {
    try {
      const tx = await this.prepareTransaction(
        contractInstance,
        functionName,
        args,
        blockchain
      );
      const createdTransaction = await this.web3.eth.accounts.signTransaction(
        tx,
        blockchain.privateKey
      );
      const transactionReceipt = await this.web3.eth.sendSignedTransaction(
        createdTransaction.rawTransaction
      );

      return transactionReceipt;
    } catch (error) {
      throw Error(error);
      // await this.handleError(error, functionName);
    }
  }

  async decodeEventLogs(receipt, eventName) {
    let result;
    const { hash, inputs } = events[eventName];
    receipt.logs.forEach((row) => {
      if (row.topics[0] === hash)
        result = this.web3.eth.abi.decodeLog(
          inputs,
          row.data,
          row.topics.slice(1)
        );
    });
    return result;
  }

  async transferAsset(UAI, to, options) {
    const blockchain = this.getBlockchain(options);
    this.web3 = this.web3 ?? this.initializeWeb3(blockchain.rpc);
    await this.initializeContracts(blockchain.hubContract);
    return await this.executeContractFunction(
      this.ContentAssetContract,
      "transfer",
      [blockchain.publicKey, to, UAI],
      blockchain
    );
  }
}

module.exports = NodeBlockchainService;
