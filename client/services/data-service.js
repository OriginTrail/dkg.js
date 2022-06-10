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

  async appendMetadata(nquads, metadata) {
    const jsonMetadata = {
      "@context": "https://www.schema.org/",
      "@id": `${DID_PREFIX}:${metadata.assertionId}`,
      hasType: metadata.type,
      hasSignature: metadata.signature,
      hasIssuer: metadata.issuer,
      hasTimestamp: metadata.timestamp,
      hasVisibility: metadata.visibility,
      hasDataHash: metadata.dataHash,
      hasKeywords: metadata.keywords,
    };

    if (metadata.UALs) {
      jsonMetadata.hasUALs = metadata.UALs;
    }

    const nquadsMetadata = await this.toNQuads(jsonMetadata);
    nquads = nquads.concat(nquadsMetadata);
    return nquads;
  }

  async appendBlockchainMetadata(nquads, blockchainMetadata) {
    const jsonMetadata = {
      "@context": "https://www.schema.org/",
      "@id": `${DID_PREFIX}:${blockchainMetadata.assertionId}`,
      hasBlockchain: blockchainMetadata.name,
      hasTransactionHash: blockchainMetadata.transactionHash,
    };

    const nquadsMetadata = await this.toNQuads(jsonMetadata);
    nquads = nquads.concat(nquadsMetadata);
    return nquads;
  }
}

module.exports = DataService;
