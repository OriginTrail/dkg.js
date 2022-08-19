const Logger = require("../utilities/logger");

class SocketClient {
    constructor(options) {
        let loglevel = options.loglevel ? options.loglevel : "error";
        this.logger = new Logger(loglevel);
    }
    _socketsPublishRequest(options) {
        this.logger.debug("Sending publish request via socket.");
    }
}
