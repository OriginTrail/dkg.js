import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import DkgClient from '../../index.js';
import { makeClientConfig, TEST_PRIVATE_KEY } from '../support/config-factory.js';
import { TEST_CHAIN_NAME } from '../support/test-constants.js';

Given('I have a configuration with blockchain name {string}', function (name) {
    this.config = makeClientConfig({ blockchain: { name, privateKey: TEST_PRIVATE_KEY } });
});

Given('I have a configuration with a valid private key', function () {
    this.config = makeClientConfig();
});

Given('I have a configuration without a blockchain name', function () {
    this.config = makeClientConfig({ blockchain: { name: undefined, privateKey: undefined } });
});

Given('I have a configuration with an invalid private key', function () {
    this.config = makeClientConfig({
        blockchain: { name: TEST_CHAIN_NAME, privateKey: 'invalid-key' },
    });
});

When('I initialize the DKG client', async function () {
    await this.run(() => {
        this.dkgClient = new DkgClient(this.config);
        return this.dkgClient;
    });
});

When('I attempt to initialize the DKG client', async function () {
    await this.run(() => {
        this.dkgClient = new DkgClient(this.config);
        return this.dkgClient;
    });
});

Then('the client should be created successfully', function () {
    expect(this.error).to.be.null;
    expect(this.dkgClient).to.not.be.null;
});

Then('the client should have a(n) {string} manager', function (managerName) {
    expect(this.dkgClient[managerName]).to.not.be.undefined;
    expect(this.dkgClient[managerName]).to.be.an('object');
});

Then('initialization should fail with error {string}', function (msg) {
    expect(this.error).to.not.be.null;
    expect(this.error.message).to.include(msg);
});

Then('{string} should be the same function as {string}', function (alias, original) {
    const [aliasNs, aliasMethod] = alias.split('.');
    const [origNs, origMethod] = original.split('.');
    const aliasFn = this.dkgClient[aliasNs][aliasMethod];
    const origFn = this.dkgClient[origNs][origMethod];
    expect(aliasFn).to.be.a('function');
    expect(origFn).to.be.a('function');
    expect(aliasFn.name).to.include(origFn.name.replace('bound ', ''));
});
