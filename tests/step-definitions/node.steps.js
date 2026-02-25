import { When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { TEST_PUBLIC_KEY } from '../support/hardhat-setup.js';

When('I request the node info', async function () {
    try {
        this.result = await this.dkgClient.node.info();
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('I should receive node info with a version field', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('version');
});

When('I request the identity ID for a valid operational wallet', async function () {
    try {
        this.result = await this.dkgClient.node.getIdentityId(TEST_PUBLIC_KEY);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('I should receive a numeric identity ID', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.be.a('number');
});
