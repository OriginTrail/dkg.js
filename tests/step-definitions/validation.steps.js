import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { deriveUAL, resolveUAL } from '../../services/utilities.js';
import { DEFAULT_EPOCHS_NUM } from '../support/test-constants.js';

When('I attempt to create an asset with null content', async function () {
    await this.run(() => this.dkgClient.asset.create(null, { epochsNum: DEFAULT_EPOCHS_NUM }));
});

When('I attempt to create an asset with the invalid content', async function () {
    await this.run(() => this.dkgClient.asset.create(this.content, { epochsNum: DEFAULT_EPOCHS_NUM }));
});

When('I attempt an operation with endpoint {string}', function (endpoint) {
    this.run(() => { this.validationService.validateEndpoint(endpoint); return true; });
});

When('I attempt an operation with a null port', function () {
    this.run(() => { this.validationService.validatePort(null); return true; });
});

When('I attempt to validate a null epochs number', function () {
    this.run(() => { this.validationService.validateEpochsNum(null); return true; });
});

When('I attempt to get an asset with content type {string}', function (contentType) {
    this.run(() => { this.validationService.validateContentType(contentType); return true; });
});

When('I attempt a graph query with query type {string}', function (queryType) {
    this.run(() => { this.validationService.validateQueryType(queryType); return true; });
});

When('I attempt to transfer an asset to an invalid address', function () {
    this.run(() => { this.validationService.validateAddress('not-a-valid-address'); return true; });
});

When('I attempt to validate a negative state index', function () {
    this.run(() => { this.validationService.validateStateIndex(-1); return true; });
});

When('I attempt to create a paranet with nodes access policy {int}', function (policy) {
    this.run(() => { this.validationService.validateParanetNodesAccessPolicy(policy); return true; });
});

When('I attempt to create a paranet with miners access policy {int}', function (policy) {
    this.run(() => { this.validationService.validateParanetMinersAccessPolicy(policy); return true; });
});

When('I attempt to validate operator reward percentage of {int}', function (pct) {
    this.run(() => { this.validationService.validateOperatorRewardPercentage(pct); return true; });
});

When('I attempt to validate voter reward percentage of {int}', function (pct) {
    this.run(() => { this.validationService.validateIncentivizationProposalVotersRewardPercentage(pct); return true; });
});

// UAL validation steps

Given('a UAL {string}', function (ual) {
    this.ual = ual;
});

When('I validate the UAL', function () {
    this.run(() => { this.validationService.validateUAL(this.ual); return true; });
});

When('I attempt to validate the UAL', function () {
    this.run(() => { this.validationService.validateUAL(this.ual); return true; });
});

When('I attempt to validate a null UAL', function () {
    this.run(() => { this.validationService.validateUAL(null); return true; });
});

When('I attempt to validate a numeric UAL', function () {
    this.run(() => { this.validationService.validateUAL(12345); return true; });
});

Then('the UAL should be valid', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.be.true;
});

Then('the UAL validation should fail with {string}', function (msg) {
    expect(this.error).to.not.be.null;
    expect(this.error.message).to.include(msg);
});

When('I resolve the UAL', function () {
    this.run(() => resolveUAL(this.ual));
});

Then('the blockchain should be {string}', function (blockchain) {
    expect(this.result.blockchain).to.equal(blockchain);
});

Then('the contract should be {string}', function (contract) {
    expect(this.result.contract).to.equal(contract);
});

Then('the KC token ID should be {int}', function (id) {
    expect(this.result.kcTokenId).to.equal(id);
});

Then('the KA token ID should be {int}', function (id) {
    expect(this.result.kaTokenId).to.equal(id);
});

When('I derive a UAL from blockchain {string}, contract {string}, and KC token ID {int}', function (blockchain, contract, kcTokenId) {
    this.run(() => deriveUAL(blockchain, contract, kcTokenId));
});

When('I derive a UAL from blockchain {string}, contract {string}, KC token ID {int}, and KA token ID {int}', function (blockchain, contract, kcTokenId, kaTokenId) {
    this.run(() => deriveUAL(blockchain, contract, kcTokenId, kaTokenId));
});

Then('the derived UAL should be {string}', function (expected) {
    expect(this.result).to.equal(expected);
});
