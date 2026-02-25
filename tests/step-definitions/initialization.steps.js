import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import DkgClient from '../../index.js';
import { getTestDkgClientConfig, TEST_PRIVATE_KEY } from '../support/hardhat-setup.js';

Given('I have a configuration with blockchain name {string}', function (name) {
    this.config = {
        ...getTestDkgClientConfig(),
        blockchain: { name, privateKey: TEST_PRIVATE_KEY },
    };
});

Given('I have a configuration with a valid private key', function () {
    this.config = getTestDkgClientConfig();
});

Given('I have a configuration without a blockchain name', function () {
    this.config = { endpoint: 'http://localhost', port: 8900, blockchain: {} };
});

Given('I have a configuration with an invalid private key', function () {
    this.config = {
        endpoint: 'http://localhost',
        port: 8900,
        blockchain: { name: 'hardhat1:31337', privateKey: 'invalid-key' },
    };
});

When('I initialize the DKG client', function () {
    try {
        this.dkgClient = new DkgClient(this.config);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to initialize the DKG client', function () {
    try {
        this.dkgClient = new DkgClient(this.config);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
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
