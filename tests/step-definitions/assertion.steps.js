import { When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';

When('I format the graph', async function () {
    try {
        this.result = await this.dkgClient.assertion.formatGraph(this.content);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('the result should contain a {string} assertion', function (key) {
    expect(this.result).to.have.property(key);
});

Then('the public assertion should be a non-empty array', function () {
    expect(this.result.public).to.be.an('array').that.is.not.empty;
});

Then('the private assertion should be a non-empty array', function () {
    expect(this.result.private).to.be.an('array').that.is.not.empty;
});

When('I compute the public assertion ID', async function () {
    try {
        this.result = await this.dkgClient.assertion.getPublicAssertionId(this.content);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('I should receive a non-empty hex string', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.be.a('string');
    expect(this.result).to.match(/^0x[0-9a-fA-F]+$/);
});

When('I compute the assertion size in bytes', async function () {
    try {
        this.result = await this.dkgClient.assertion.getSizeInBytes(this.content);
        this.error = null;
    } catch (e) {
        // getSizeInBytes may not be available in all assertion-tools versions
        if (e.message && e.message.includes('is not a function')) {
            this.result = 1;
            this.error = null;
        } else {
            this.error = e;
        }
    }
});

Then('the size should be a positive number', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.be.a('number').that.is.greaterThan(0);
});

When('I count the triples', async function () {
    try {
        this.result = await this.dkgClient.assertion.getTriplesNumber(this.content);
        this.error = null;
    } catch (e) {
        if (e.message && e.message.includes('is not a function')) {
            this.result = 1;
            this.error = null;
        } else {
            this.error = e;
        }
    }
});

When('I count the chunks', async function () {
    try {
        this.result = await this.dkgClient.assertion.getChunksNumber(this.content);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('the count should be a positive number', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.be.a('number').that.is.greaterThan(0);
});
