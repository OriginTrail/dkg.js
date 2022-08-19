const request = require('sync-request');

class AssetsProxyPath {
    constructor(options) {
        this.nodeBaseUrl = `${options.useSSL ? "https://" : "http://"}${
            options.endpoint
        }:${options.port}`;
    }

    /**
     * Creates a path Proxy with the given settings and internal data fields.
     */


    createPath() {
        let settings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        let data = arguments.length > 1 ? arguments[1] : undefined;
        let id = arguments.length > 2 ? arguments[2] : undefined;
        let loaded = arguments.length > 3 ? arguments[3] : false;

        // The settings parameter is optional
        if (data === undefined) [data, settings] = [settings, {}]; // Create the path's internal data object and the proxy that wraps it

        const {
            apply,
            ...rawData
        } = data;
        let path = apply ? Object.assign(callPathFunction, rawData) : rawData;
        path = {data: path};
        const proxy = new Proxy(path, this);
        path.proxy = proxy;
        path.settings = settings;
        path.id = id;
        path.loaded = loaded;

        function callPathFunction() {
            for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            return apply(args, path, proxy);
        }


        if (!path.extendPath) {
            const pathProxy = this;

            path.extendPath = function extendPath(newData) {
                return pathProxy.createPath(settings, {
                        extendPath,
                        ...newData
                    },
                    id,
                    true);
            };
        } // Return the proxied path


        return proxy;
    }

    /**
     * Handles access to a property
     */
    get(path, property) {
        function helper(path) {
            delete path.data.extendPath;
            if (path.data.property)
                return path.data.property;
            else
                return path.data;
        }

        if (property === 'then')
            return undefined;

        if (!path.loaded) {
            const latestState = this.resolve(path.id)
            path.data = latestState;
        }

        if (property === 'valueOf') {
            return helper(path)
        }

        if (typeof path.data[property] === "function") {
            return function () {
                return helper(path)
            }
        }

        if (path.data[property]) {
            let newData;
            if (typeof path.data[property] === 'string' || path.data[property] instanceof String)
                newData = {property: path.data[property]}
            else
                newData = path.data[property];
            return path.extendPath(newData);
        }

        return undefined;
    }

    resolve(id) {
        let body = {
            status: 'PENDING'
        }
        let response = request('GET', `${this.nodeBaseUrl}/resolve?ids=${id}`);
        const handler = JSON.parse(response.getBody()).handler_id
        while (body.status === 'PENDING') {
            new Date(new Date().getTime() + 1000);
            response = request('GET', `${this.nodeBaseUrl}/resolve/result/${handler}`);
            body = JSON.parse(response.getBody());
        }
        return body.data[0].result;
    }
}

module.exports = AssetsProxyPath;