export default {
    getAssertionSizeInKb(content) {
        return Buffer.byteLength(JSON.stringify(content), "utf-8");
    },
    nodeSupported() {
        return typeof window === "undefined";
    }
}
