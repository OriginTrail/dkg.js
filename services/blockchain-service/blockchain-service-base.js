const Utilities = require('../utilities.js')

class BlockchainServiceBase {
    constructor() {
    }

    deriveUAL(blockchain, contract, UAI) {
        return Utilities.deriveUAL(blockchain, contract, UAI);
    }

}
module.exports = BlockchainServiceBase;
