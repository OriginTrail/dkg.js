const logger = require('loglevel');


class Logger {

    constructor(level) {
        logger.setLevel(level);
    }

    info (message) {
        logger.info(message);
    }

    debug (message) {
        logger.debug(message);
    }

    error (message) {
        logger.error(message);
    }
}

module.exports = Logger;
