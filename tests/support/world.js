import { setWorldConstructor, World } from '@cucumber/cucumber';
import ValidationService from '../../services/validation-service.js';

class DkgWorld extends World {
    constructor(options) {
        super(options);

        this.dkgClient = null;
        this.config = null;

        this.result = null;
        this.error = null;

        this.ual = null;
        this.paranetUAL = null;
        this.content = null;

        this.blockchainServiceStubs = null;
        this.nodeApiStubs = null;

        this.validationService = new ValidationService();
        this.inputService = null;
    }

    async run(fn) {
        try {
            this.result = await fn();
            this.error = null;
        } catch (e) {
            this.error = e;
        }
    }
}

setWorldConstructor(DkgWorld);
