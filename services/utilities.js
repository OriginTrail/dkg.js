const { OPERATION_STATUSES } = require("../constants");

module.exports = {
  nodeSupported() {
    return typeof window === "undefined";
  },
  toNumber(hex) {
    return parseInt(hex.slice(2), 16);
  },
  deriveUAL(blockchain, contract, tokenId) {
    return `did:${blockchain.toLowerCase()}:${contract.toLowerCase()}/${tokenId}`;
  },
  async sleepForMilliseconds(milliseconds) {
    await new Promise((r) => setTimeout(r, milliseconds));
  },
  resolveUAL(ual) {
    const segments = ual.split(":");
    const blockchainSegments = segments[2].split("/");

    if (
      segments.length !== 3 ||
      blockchainSegments.length < 2 ||
      isNaN(blockchainSegments[1])
    ) {
      throw new Error(`UAL doesn't have correct format: ${ual}`);
    }

    return {
      blockchain: segments[1],
      contract: blockchainSegments[0],
      UAI: blockchainSegments[1],
      assertionId: blockchainSegments.length > 2 ? blockchainSegments[2] : null,
    };
  },
  capitalizeFirstLetter(str) {
    return str[0].toUpperCase() + str.slice(1);
  },
  getOperationStatusObject(operationResult, operationId) {
    const operationData = operationResult.data?.errorType
      ? { status: operationResult.status, ...operationResult.data }
      : { status: operationResult.status };

    return {
      operationId,
      ...operationData,
    };
  },
};
