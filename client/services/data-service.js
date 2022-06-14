const jsonld = require("jsonld");

class DataService {
  constructor(config, logger) {
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

  async compact(content) {
    return await jsonld.compact(content, {
      "@context": "https://schema.org/",
    });
  }

  async canonize(content) {
    const nquads = await this.toNQuads(content);
    if (nquads && nquads.length === 0) {
      throw new Error("File format is corrupted, no n-quads extracted.");
    }

    return nquads;
  }

  async appendMetadata(nquads, metadata) {
    const compactedMetadata = await this.compact({
      ...metadata,
      "@context": "https://schema.org",
    });
    const canonizedMetadata = await this.canonize(compactedMetadata);
    return nquads.concat(canonizedMetadata);
  }
}

module.exports = DataService;
