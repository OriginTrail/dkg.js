import {SocketService} from './implementations/socket-service.js';
import {HttpService} from './implementations/http-service.js';
export default {
    "sockets": SocketService,
    "https": HttpService,
    "http": HttpService,
    "default": SocketService
}
