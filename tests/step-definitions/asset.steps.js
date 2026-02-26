import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { createFailedOperationResult, createGetOperationResultForAssetGet } from '../support/mocks/node-api-mock.js';
import { DEFAULT_EPOCHS_NUM, TEST_ADDRESSES } from '../support/test-constants.js';

// --- Asset creation ---

Given('the node API publish operation will succeed', function () {
    // Default stubs already return success; no-op
});

Given('the node API publish operation will fail', function () {
    this.nodeApiStubs.getOperationResult.resolves(createFailedOperationResult('Publish failed'));
});

When('I create a Knowledge Asset with default options', async function () {
    await this.run(() => this.dkgClient.asset.create(this.content, { epochsNum: DEFAULT_EPOCHS_NUM }));
});

Then('I should receive a valid UAL starting with {string}', function (prefix) {
    expect(this.result).to.have.property('UAL');
    expect(this.result.UAL).to.be.a('string');
    expect(this.result.UAL.startsWith(prefix)).to.be.true;
});

Then('the result should contain a failed publish operation status', function () {
    expect(this.result).to.have.nested.property('operation.publish');
    expect(this.result.operation.publish.status).to.equal('FAILED');
});

// --- Asset retrieval ---

Given('the node API get operation returns assertion data', function () {
    this.nodeApiStubs.getOperationResult.resolves(createGetOperationResultForAssetGet());
});

Given('the node API get operation returns no assertion', function () {
    this.nodeApiStubs.getOperationResult.resolves({
        status: 'COMPLETED',
        data: { assertion: null, metadata: [] },
    });
});

Given('the node API get operation returns assertion data with metadata', function () {
    this.nodeApiStubs.getOperationResult.resolves(createGetOperationResultForAssetGet(
        ['<http://example.org/s> <http://schema.org/name> "Test" .'],
        ['<http://example.org/m> <http://schema.org/dateCreated> "2025-01-01" .'],
    ));
});

When('I get the Knowledge Asset', async function () {
    await this.run(() => this.dkgClient.asset.get(this.ual, { outputFormat: 'n-quads' }));
});

When('I get the Knowledge Asset with metadata included', async function () {
    await this.run(() => this.dkgClient.asset.get(this.ual, {
        outputFormat: 'n-quads',
        includeMetadata: true,
    }));
});

Then('the result should contain the assertion data', function () {
    expect(this.result).to.have.property('assertion');
});

Then('the operation status should be {string}', function (status) {
    expect(this.result.operation.get.status).to.equal(status);
});

Then('the result should contain a failed get operation', function () {
    expect(this.result.operation.get.status).to.equal('FAILED');
});

Then('the error message should contain {string}', function (msg) {
    const errorMsg = this.result.operation.get.errorMessage || '';
    expect(errorMsg).to.include(msg);
});

Then('the result should contain metadata', function () {
    expect(this.result).to.have.property('metadata');
});

// --- Asset transfer ---

Given('a valid new owner address', function () {
    this.newOwner = TEST_ADDRESSES.owner;
});

Given('an invalid new owner address {string}', function (address) {
    this.newOwner = address;
});

Given('no new owner address', function () {
    this.newOwner = null;
});

When('I transfer the asset', async function () {
    await this.run(() => this.dkgClient.asset.transfer(this.ual, this.newOwner));
});

When('I attempt to transfer the asset', async function () {
    await this.run(() => this.dkgClient.asset.transfer(this.ual, this.newOwner));
});

Then('the transfer should complete successfully', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('operation');
});

Then('the result should contain the UAL', function () {
    expect(this.result).to.have.property('UAL');
    expect(this.result.UAL).to.equal(this.ual);
});

// --- Asset burn ---

When('I burn the asset', async function () {
    await this.run(() => this.dkgClient.asset.burn(this.ual));
});

When('I attempt to burn the asset', async function () {
    await this.run(() => this.dkgClient.asset.burn(this.ual));
});

Then('the burn should complete successfully', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('operation');
});

// --- Allowance ---

Given('a token amount of {int}', function (amount) {
    this.tokenAmount = amount;
});

Given('the current allowance is {int}', function (allowance) {
    if (this.blockchainServiceStubs) {
        this.blockchainServiceStubs.callContractFunction.resolves(allowance.toString());
    }
    this.currentAllowance = allowance;
});

Given('a target allowance of {int}', function (target) {
    this.targetAllowance = target;
});

When('I increase the allowance', async function () {
    await this.run(() => this.dkgClient.asset.increaseAllowance(this.tokenAmount));
});

When('I decrease the allowance', async function () {
    await this.run(() => this.dkgClient.asset.decreaseAllowance(this.tokenAmount));
});

When('I set the allowance', async function () {
    await this.run(() => this.dkgClient.asset.setAllowance(BigInt(this.targetAllowance)));
});

When('I get the current allowance', async function () {
    this.blockchainServiceStubs.callContractFunction.resolves(this.currentAllowance.toString());
    await this.run(() => this.dkgClient.asset.getCurrentAllowance());
});

Then('the allowance operation should complete successfully', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.not.be.null;
});

Then('the result should contain a transaction hash', function () {
    expect(this.result).to.have.property('transactionHash');
});

Then('the result status should indicate {string}', function (status) {
    expect(this.result.status).to.include(status);
});

Then('I should receive the allowance value', function () {
    expect(this.error).to.be.null;
    expect(typeof this.result).to.equal('bigint');
});

// --- Finality ---

Given('the node reports {int} finality confirmations', function (count) {
    if (this.nodeApiStubs) {
        this.nodeApiStubs.finalityStatus.resolves(count);
    }
    this.finalityConfirmations = count;
});

Given('the node reports {int} finality confirmation', function (count) {
    if (this.nodeApiStubs) {
        this.nodeApiStubs.finalityStatus.resolves(count);
    }
    this.finalityConfirmations = count;
});

Given('the required confirmations are {int}', function (count) {
    this.requiredConfirmations = count;
});

When('I check the publish finality', async function () {
    const options = {};
    if (this.requiredConfirmations != null) {
        options.minimumNumberOfFinalizationConfirmations = this.requiredConfirmations;
    }
    await this.run(() => this.dkgClient.asset.publishFinality(this.ual, options));
});

Then('the finality status should be {string}', function (status) {
    expect(this.result.status).to.equal(status);
});

Then('the number of confirmations should be {int}', function (count) {
    expect(this.result.numberOfConfirmations).to.equal(count);
});
