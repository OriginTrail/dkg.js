import {MAX_FILE_SIZE} from "../constants.js";

const publishAllowedVisibilityParams = ["public", "private"];

class ValidationService {

    validatePublishRequest(content, options) {
        this.validateJSON(content);
        this.validateSize(content);
        this.validateVisibility(options.visibility);
    }

    validateGetRequest(UAL, options) {
        if(!UAL) throw Error("UAL is missing.");
    }

    validateAssetTransferRequest(UAL, newOwner) {
        if(!UAL || !newOwner) throw Error("Wrong parameters for the transfer.");
    }

    validateJSON(content) {
        try {
            JSON.parse(JSON.stringify(content));
        } catch (e) {
            console.error(e);
            throw Error('Invalid JSON format');
        }
        return true;
    }

    validateSize(content) {
        if (!content) throw Error("No content provided");
        if (Buffer.byteLength(JSON.stringify(content), "utf-8") > MAX_FILE_SIZE)
            throw Error(`File size limit is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
    }

    validateVisibility(visibility) {
        if (!publishAllowedVisibilityParams.includes(visibility))
            throw Error(
                `Please set visibility to one of these values : ${publishAllowedVisibilityParams}`
            );
    }

    validateKeywords(keywords) {
        if (!keywords) throw Error("No keywords provided");
        if (!Array.isArray(keywords)) throw Error("Keywords must be an array");
        if (keywords.length <= 0) throw Error("Keywords array must be non empty");
        if (keywords.length > 10)
            throw Error("Too many keywords provided, limit is 10.");
        if (!keywords.every((i) => typeof i === "string" && i !== ""))
            throw Error("all keywords must be non empty strings");
    }
}

export {ValidationService};
