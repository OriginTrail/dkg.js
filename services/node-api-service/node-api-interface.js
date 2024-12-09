import SocketService from './implementations/socket-service.js';
import HttpService from './implementations/http-service.js';

const Sockets = SocketService;
const Https = HttpService;
const Http = HttpService;
const Default = HttpService;

export default {
    Sockets,
    Https,
    Http,
    Default,
};
