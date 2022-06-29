const AbstractBlockchainService = require("./abstract-blockchain-service");

class BrowserBlockchainService extends AbstractBlockchainService {
  getName() {
    return "BrowserBlockchainService";
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
      this.web3 = new window.Web3(window.ethereum);
    } else {
      this.logger.error(
        "Non-Ethereum browser detected. You should consider installing MetaMask."
      );
    }
  }

  async sign(message) {
    return await this.web3.eth.personal.sign(message, await this.getAccount());
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

  async handleError(error, functionName) {
    this.logger.error(
      `Unable to execute smart contract function ${functionName}. Error ${error.message}.`
    );
  }
}

module.exports = BrowserBlockchainService;
