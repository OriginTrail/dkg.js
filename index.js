const NativeClient = require('./client/native-client')
const AssetsClient = require('./client/assets-client')

class DkgClient extends NativeClient {
  constructor(props) {
    super(props);

    this.assets = new AssetsClient(props)
  }

}
module.exports = DkgClient;