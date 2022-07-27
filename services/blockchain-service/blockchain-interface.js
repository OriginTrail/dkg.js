import {BrowserBlockchainService} from './implementations/browser-blockchain-service.js';
import {NodeBlockchainService} from './implementations/node-blockchain-service.js';
export default {
    "browser": BrowserBlockchainService,
    "node": NodeBlockchainService,
}
