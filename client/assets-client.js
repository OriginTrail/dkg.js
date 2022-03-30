const AbstractClient = require("./abstract-client");
const AssetsProxyPath = require("../utilities/assets-proxy-path");

class AssetsClient extends AbstractClient {
    constructor(options) {
        super(options);
        this._assetsProxyPath = new AssetsProxyPath(options);
        this.loadMetamask()
    }

    /**
     * @param content
     * @param {object} options
     * @param {string} options.filepath - path to the dataset
     * @param {string[]} options.keywords (optional)
     */
    async create(content, options) {
        content['@context'] = "https://www.schema.org/";
        content.proof = await this.signMessage(content.toString());

        options.content = content;
        options.method = 'provision';
        return new Promise((resolve, reject) => {
            this._publishRequest(options)
                .then((response) =>
                    this._getResult({
                        handler_id: response.data.handler_id,
                        operation: options.method,
                    })
                )
                .then((response) => {
                    resolve(response);
                })
                .catch((error) => reject(error));
        });
    }

    /**
     * @param {object} options
     * @param {string} options.filepath - path to the dataset
     * @param {string[]} options.keywords (optional)
     */
    async update(content, ual, options) {
        content['@context'] = "https://www.schema.org/";
        content.proof = await this.signMessage(content.toString());
        options.content = content;
        options.ual = ual;
        options.method = 'update';
        return new Promise((resolve, reject) => {
            this._publishRequest(options)
                .then((response) =>
                    this._getResult({
                        handler_id: response.data.handler_id,
                        operation: options.method,
                    })
                )
                .then((response) => {
                    resolve(response);
                })
                .catch((error) => reject(error));
        });
    }

    async get(ual, commitHash) {
        //TODO add cache

        let result;
        if (commitHash)
            result = await this.resolve({ids: [commitHash]});
        else
            result = await this.resolve({ids: [ual]});
        if (result.status === this.STATUSES.completed) {
            const data = result.data[0].result;

            return this._assetsProxyPath.createPath(
                Object.assign(Object.create(null), undefined, undefined),
                Object.assign(Object.create(null), undefined, data),
                ual
            );
        }

        return undefined;
    }

    async getStateCommitHashes(ual) {
        //TODO add cache

        let result = await this.resolve({ids: [ual]});
        if (result.status === this.STATUSES.completed) {
            return result.data[0].result.assertions;
        }
        return undefined;
    }


    transfer(options) {
        //TODO
    }

    approve(options) {
        //TODO
    }


    loadMetamask(){
        if (window.ethereum) {
            window.web3 = new Web3(ethereum);
            ethereum.enable()
                .then(() => {
                    console.log("Ethereum enabled");

                    web3.eth.getAccounts(function (err, acc) {
                        if (err != null) {
                            self.setStatus("There was an error fetching your accounts");
                            return;
                        }
                        if (acc.length > 0) {
                            console.log(acc);
                        }
                    });
                })
                .catch(() => {
                    console.warn('User didn\'t allow access to accounts.');
                    waitLogin();
                });
        } else {
            console.log("Non-Ethereum browser detected. You should consider installing MetaMask.");
        }
    }

    async signMessage(message) {
        const web3 = new Web3(window.ethereum);
        var hash = web3.utils.sha3(message)
        var accounts = await web3.eth.getAccounts()
        var signature = await web3.eth.personal.sign(hash, accounts[0])
        return {hash, account: accounts[0], signature}
    }

}

module.exports = AssetsClient;
