const { OPERATION_STATUSES } = require("../constants");

module.exports = {
  nodeSupported() {
    return typeof window === "undefined";
  },
  toNumber(hex) {
    return parseInt(hex.slice(2), 16);
  },
  deriveUAL(blockchain, contract, tokenId) {
    return `did:dkg:${blockchain.startsWith("otp") ? "otp" : blockchain.toLowerCase()}/${contract.toLowerCase()}/${tokenId}`;
  },
  resolveUAL(ual) {
    const segments = ual.split(":");
    const argsString =
      segments.length === 3 ? segments[2] : segments[2] + segments[3];
    const args = argsString.split("/");

    if (args.length !== 3) {
      throw new Error(`UAL doesn't have correct format: ${ual}`);
    }

    return {
      blockchain: args[0],
      contract: args[1],
      tokenId: args[2],
    };
  },
  async sleepForMilliseconds(milliseconds) {
    await new Promise((r) => setTimeout(r, milliseconds));
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
