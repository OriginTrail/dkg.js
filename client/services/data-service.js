const jsonld = require("jsonld");
const { DID_PREFIX } = require("../../constants");

class DataService {
  async initialize(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  async toNQuads(content) {
    const canonized = await jsonld.canonize(content, {
      algorithm: "URDNA2015",
      format: "application/n-quads",
    });

    return canonized.split("\n").filter((x) => x !== "");
  }

  async canonize(content) {
    const nquads = await this.toNQuads(content);
    if (nquads && nquads.length === 0) {
      throw new Error("File format is corrupted, no n-quads extracted.");
    }

    return nquads;
  }

  async appendMetadata(nquads, assertion) {
    const jsonMetadata = {
      "@context": "https://www.schema.org/",
      "@id": `${DID_PREFIX}:${assertion.id}`,
      hasType: assertion.metadata.type,
      hasSignature: assertion.signature,
      hasIssuer: assertion.metadata.issuer,
      hasTimestamp: assertion.metadata.timestamp,
      hasVisibility: assertion.metadata.visibility,
      hasDataHash: assertion.metadata.dataHash,
      hasKeywords: assertion.metadata.keywords,
    };

    if (assertion.metadata.UALs) {
      jsonMetadata.hasUALs = assertion.metadata.UALs;
    }

    const nquadsMetadata = await this.toNQuads(assertion);
    nquads = nquads.concat(nquadsMetadata);
    return nquads;
  }

  async appendBlockchainMetadata(nquads, assertion) {
    const jsonMetadata = {
      "@context": "https://www.schema.org/",
      "@id": `${DID_PREFIX}:${assertion.id}`,
      hasBlockchain: assertion.blockchain.name,
      hasTransactionHash: assertion.blockchain.transactionHash,
    };

    const nquadsMetadata = await this.toNQuads(jsonMetadata);
    nquads = nquads.concat(nquadsMetadata);
    return nquads;
  }
}

module.exports = DataService;
