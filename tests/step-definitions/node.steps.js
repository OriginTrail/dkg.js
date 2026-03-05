import { When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { TEST_PUBLIC_KEY } from '../support/hardhat-setup.js';

When('I request the node info', async function () {
    await this.run(() => this.dkgClient.node.info());
});

Then('I should receive node info with a version field', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('version');
});

When('I request the identity ID for a valid operational wallet', async function () {
    await this.run(() => this.dkgClient.node.getIdentityId(TEST_PUBLIC_KEY));
});

Then('I should receive a numeric identity ID', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.be.a('number');
});
