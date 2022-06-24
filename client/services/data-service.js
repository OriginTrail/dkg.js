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

    const nquads = canonized.split("\n").filter((x) => x !== "");

    if (nquads && nquads.length === 0) {
      throw new Error("File format is corrupted, no n-quads extracted.");
    }

    return nquads;
  }

  async compact(content) {
    return await jsonld.compact(content, {
      "@context": "https://schema.org/",
    });
  }
}

module.exports = DataService;
