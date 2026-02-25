import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import DkgClient from '../../index.js';
import { getTestDkgClientConfig, TEST_PUBLIC_KEY } from '../support/hardhat-setup.js';
import { createNodeApiStubs } from '../support/mocks/node-api-mock.js';
import { createBlockchainServiceStubs } from '../support/mocks/blockchain-service-mock.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadFixture(relativePath) {
    return JSON.parse(readFileSync(resolve(__dirname, '..', 'fixtures', relativePath), 'utf-8'));
}

function loadTextFixture(relativePath) {
    return readFileSync(resolve(__dirname, '..', 'fixtures', relativePath), 'utf-8').trim();
}

Given('I have a valid Hardhat blockchain configuration', function () {
    this.config = getTestDkgClientConfig();
});

Given('the DKG client is initialized with a valid configuration', function () {
    this.config = getTestDkgClientConfig();
    this.dkgClient = new DkgClient(this.config);
});

Given('the blockchain service is mocked', function () {
    this.blockchainServiceStubs = createBlockchainServiceStubs(this.dkgClient.asset.blockchainService);
});

Given('the node API is mocked', function () {
    this.nodeApiStubs = createNodeApiStubs(this.dkgClient.node.nodeApiService);
});

Given('I have valid JSON-LD content with public triples', function () {
    this.content = loadFixture('content/valid-jsonld.json');
});

Given('I have JSON-LD content with both public and private triples', function () {
    this.content = loadFixture('content/private-content.json');
});

Given('I have content that is neither JSON-LD nor N-Quads', function () {
    this.content = 'just a plain string that is not nquads';
});

Given('a valid UAL for an existing asset', function () {
    this.ual = 'did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1';
});

Given('a valid UAL {string}', function (ual) {
    this.ual = ual;
});

Given('a valid KA UAL {string}', function (ual) {
    this.ual = ual;
});

Given('an invalid UAL {string}', function (ual) {
    this.ual = ual;
});

Then('the operation should complete successfully', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.not.be.null;
});

Then('the operation should fail with a validation error', function () {
    expect(this.error).to.not.be.null;
});

Then('the operation should fail with a validation error containing {string}', function (msg) {
    expect(this.error).to.not.be.null;
    expect(this.error.message.toLowerCase()).to.include(msg.toLowerCase());
});

Then('the operation should fail with error {string}', function (msg) {
    expect(this.error).to.not.be.null;
    expect(this.error.message).to.include(msg);
});

Then('the operation should succeed', function () {
    expect(this.error).to.be.null;
});

export { loadFixture, loadTextFixture };
