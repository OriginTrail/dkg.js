const NativeClient = require('./client/native-client')
const AssetsClient = require('./client/assets-client')

class DkgClient extends NativeClient {
  constructor(options, walletInformation) {
    super(options, walletInformation);

    this.assets = new AssetsClient(options, walletInformation)
  }

}
module.exports = DkgClient;