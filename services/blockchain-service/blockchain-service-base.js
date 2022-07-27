import Utilities from '../utilities.js';

class BlockchainServiceBase {
    constructor() {
    }

    deriveUAL(blockchain, contract, UAI) {
        return Utilities.deriveUAL(blockchain, contract, UAI);
    }

}

export { BlockchainServiceBase }
