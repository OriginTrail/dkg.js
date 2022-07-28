const SocketService = require('./implementations/socket-service.js')
const HttpService = require('./implementations/http-service.js')
module.exports = {
    "sockets": SocketService,
    "https": HttpService,
    "http": HttpService,
    "default": SocketService
}
