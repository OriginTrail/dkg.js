import Utilities from "../../utilities.js";
import {
    HOLDING_TIME_IN_YEARS,
    PUBLISH_TOKEN_AMOUNT,
    DEFAULT_PUBLISH_VISIBILITY,
    VISIBILITY
} from "../../../constants.js";

class BrowserBlockchainService {
    constructor(props) {
        console.log(props);
    }

    createAsset(assertionId, assertionSize, holdingTimeInYears, tokenAmount) {
        // const web3 = new Web3(getRPC(blockchain));
    }

    generateCreateAssetRequest(assertion, assertionId, options) {
        try {
            const assertionSize = Utilities.getAssertionSizeInKb(assertion);
            const holdingTimeInYears = (options.holdingTimeInYears) ? options.holdingTimeInYears : HOLDING_TIME_IN_YEARS;
            const tokenAmount = (options.tokenAmount) ? options.tokenAmount : PUBLISH_TOKEN_AMOUNT;
            const visibility = (options.visibility) ? VISIBILITY[options.visibility] : DEFAULT_PUBLISH_VISIBILITY;
            return [assertionId, assertionSize, visibility, holdingTimeInYears, tokenAmount];
        } catch (e) {
            throw Error("Invalid request parameters.")
        }
    }

    test() {
        return "tu smo u browseru";
    }
}
export {BrowserBlockchainService};
