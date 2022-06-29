const SHA256 = require("crypto-js/sha256");
const elliptic = require("elliptic");
const MerkleTools = require('merkle-tools');
const sortedStringify = require("json-stable-stringify");
// eslint-disable-next-line new-cap
const secp256k1 = new elliptic.ec("secp256k1");
const BytesUtilities = require("../../utilities/bytes-utilities");
const keccak256 = require('keccak256')
const web3 = require('web3')
const {MerkleTree} = require('merkletreejs')



const _slicedToArray = (function () {
  function sliceIterator(arr, i) {
      const _arr = [];
      let _n = true;
      let _d = false;
      let _e;
      try {
          for (let _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
              _arr.push(_s.value);
              if (i && _arr.length === i) break;
          }
      } catch (err) {
          _d = true;
          _e = err;
      } finally {
          try {
              if (!_n && _i.return) _i.return();
          } finally {
              if (_d) throw _e;
          }
      }
      return _arr;
  }

  return function (arr, i) {
      if (Array.isArray(arr)) {
          return arr;
      }
      if (Symbol.iterator in Object(arr)) {
          return sliceIterator(arr, i);
      }
      throw new TypeError('Invalid attempt to destructure non-iterable instance');
  };
})();

class ValidationService {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }
  
  calculateHash(assertion) {
    let stringifiedAssertion = assertion;
    if (typeof assertion !== "string" && !(assertion instanceof String)) {
      stringifiedAssertion = sortedStringify(assertion);
    }
    const hash = SHA256(stringifiedAssertion);

    return hash.toString();
  }

  calculateRootHash(nquadsArray) {
      nquadsArray.sort();
      const leaves = nquadsArray.map((element, index) => keccak256(web3.utils.encodePacked(
          keccak256(element),
          index
      )))
      const tree = new MerkleTree(leaves, keccak256, {sortPairs: true})
      return tree.getRoot().toString('hex')
  }

  sign(content, privateKey) {
    const signature = secp256k1
      .keyFromPrivate(
        Buffer.from(BytesUtilities.normalizeHex(privateKey).slice(2), "hex")
      )
      .sign(Buffer.from(content, "hex"), { canonical: true });

    const result = this.encodeSignature([
      BytesUtilities.fromString(
        BytesUtilities.fromNumber(27 + signature.recoveryParam)
      ),
      BytesUtilities.pad(
        32,
        BytesUtilities.fromNat(`0x${signature.r.toString(16)}`)
      ),
      BytesUtilities.pad(
        32,
        BytesUtilities.fromNat(`0x${signature.s.toString(16)}`)
      ),
    ]);

    return result.signature;
  }

  encodeSignature(signature) {
    const _ref2 = _slicedToArray(signature);
    const v = _ref2[0];
    const r = BytesUtilities.pad(32, _ref2[1]);
    const s = BytesUtilities.pad(32, _ref2[2]);

    return {
        signature: BytesUtilities.flatten([r, s, v]),
        r,
        s,
        v,
    };
}
}

module.exports = ValidationService;
