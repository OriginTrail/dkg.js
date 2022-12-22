const BrowserBlockchainService = require('./implementations/browser-blockchain-service.js');
const NodeBlockchainService = require('./implementations/node-blockchain-service.js');

module.exports = {
    Browser: BrowserBlockchainService,
    Node: NodeBlockchainService,
};
