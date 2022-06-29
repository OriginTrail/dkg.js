const Web3 = require("web3");
const AbstractBlockchainService = require("./abstract-blockchain-service");

class NodeBlockchainService extends AbstractBlockchainService {
  getName() {
    return "NodeBlockchainService";
  }

  constructor(config, logger) {
    super({ ...config, rpcNumber: 0 }, logger);
  }

  initializeWeb3() {
    this.web3 = new Web3(this.config.rpcEndpoints[this.config.rpcNumber]);
  }

  async sign(message, privateKey) {
    const result = await this.web3.eth.accounts.sign(message, privateKey);
    return result.signature;
  }

  async verify(message, signature, publicKey) {
    let result = await this.web3.eth.accounts.recover(message, signature);
    return publicKey === result;
  }

  async executeContractFunction(contractInstance, functionName, args, options) {
    let result
    while(!result) {
      try {
        const tx = await this.prepareTransaction(
          contractInstance,
          functionName,
          args,
          options
        );
  
        const signedTransaction = await this.web3.eth.accounts.signTransaction(
          tx,
          options.privateKey
        );
  
        result = await this.web3.eth.sendSignedTransaction(
          signedTransaction.rawTransaction
        );
      } catch (error) {
        await this.handleError(error, functionName);
      }
    }
    return result
  }

  async handleError(error, functionName) {
    let isRpcError = false;
    try {
      await this.web3.eth.net.isListening();
    } catch (rpcError) {
      isRpcError = true;
      await this.restartService();
    }
    if (!isRpcError)
      this.logger.error(
        `Unable to execute smart contract function ${functionName}. Error ${error.message}.`
      )
      throw error
  }

  async restartService() {
    this.config.rpcNumber =
      (this.config.rpcNumber + 1) % this.config.rpcEndpoints.length;
    this.logger.info(
      `There was an issue with current blockchain rpc. Connecting to ${
        this.config.rpcEndpoints[this.config.rpcNumber]
      }`
    );
    this.initializeWeb3();
    this.DKGContract = undefined;
    this.UAIRegistryContract = undefined;
  }
}

module.exports = NodeBlockchainService;
