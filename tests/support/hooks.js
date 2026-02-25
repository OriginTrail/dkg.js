import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import sinon from 'sinon';

BeforeAll(async function () {
    // Future: start Hardhat node and deploy contracts here
});

Before(async function () {
    this.error = null;
    this.result = null;
    this.ual = null;
    this.paranetUAL = null;
    this.content = null;
});

After(async function () {
    sinon.restore();
});

AfterAll(async function () {
    // Future: stop Hardhat node here
});
