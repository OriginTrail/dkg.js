const SocketService = require('./implementations/socket-service.js');
const HttpService = require('./implementations/http-service.js');

module.exports = {
    Sockets: SocketService,
    Https: HttpService,
    Http: HttpService,
    Default: HttpService,
};
