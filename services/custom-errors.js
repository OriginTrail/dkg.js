class BlockchainError extends Error {
    constructor(message, baseObject, blockchain, contractName, contractInstance) {
        super(message);
        this.name = 'BlockchainError';
        this.baseObject = baseObject;
        this.blockchain = blockchain;
        this.contractName = contractName;
        this.contractInstance = contractInstance;
    }
}

module.exports = BlockchainError;
