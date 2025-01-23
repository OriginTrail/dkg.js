import BrowserBlockchainService from './implementations/browser-blockchain-service.js';
import NodeBlockchainService from './implementations/node-blockchain-service.js';

const Browser = BrowserBlockchainService;
const Node = NodeBlockchainService;

export default {
    Browser,
    Node,
}
