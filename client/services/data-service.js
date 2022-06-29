const jsonld = require("jsonld");

class DataService {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  async canonize(content) {
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

  async fromNQuads(nquads, type) {
    const Id_operation = uuidv1();
    this.logger.emit({
      msg: "Started measuring execution of fromRDF command",
      Event_name: "fromrdf_start",
      Operation_name: "fromrdf",
      Id_operation,
    });
    let context;
    let frame;
    switch (type.toLowerCase()) {
      case this.constants.GS1EPCIS:
        context = {
          "@context": [
            "https://gs1.github.io/EPCIS/epcis-context.jsonld",
            {
              example: "http://ns.example.com/epcis/",
            },
          ],
        };

        frame = {
          "@context": [
            "https://gs1.github.io/EPCIS/epcis-context.jsonld",
            {
              example: "http://ns.example.com/epcis/",
            },
          ],
          isA: "EPCISDocument",
        };
        break;
      case this.constants.ERC721:
      case this.constants.OTTELEMETRY:
        context = {
          "@context": "https://www.schema.org/",
        };
        frame = {
          "@context": "https://www.schema.org/",
          "@type": type,
        };
        break;
      default:
        context = {
          "@context": "https://www.schema.org/",
        };

        frame = {
          "@context": "https://www.schema.org/",
          "@type": type,
        };
    }
    const json = await this.workerPool.exec("fromNQuads", [
      nquads,
      context,
      frame,
    ]);

    this.logger.emit({
      msg: "Finished measuring execution of fromRDF command",
      Event_name: "fromrdf_end",
      Operation_name: "fromrdf",
      Id_operation,
    });

    return json;
  }
}

module.exports = DataService;
