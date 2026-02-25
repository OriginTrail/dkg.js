import { setWorldConstructor, World } from '@cucumber/cucumber';

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

        this.validationService = null;
        this.inputService = null;
    }
}

setWorldConstructor(DkgWorld);
