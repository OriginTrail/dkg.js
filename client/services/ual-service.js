const jsonld = require("jsonld");

class UALService {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  deriveUAL(UAI, blockchain, contract) {
    return `did:${blockchain.toLowerCase()}:${contract.toLowerCase()}/${UAI}`;
  }
}

module.exports = UALService;
