import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import ValidationService from '../../services/validation-service.js';
import { deriveUAL, resolveUAL } from '../../services/utilities.js';

When('I attempt to create an asset with null content', async function () {
    try {
        await this.dkgClient.asset.create(null, { epochsNum: 2 });
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to create an asset with the invalid content', async function () {
    try {
        await this.dkgClient.asset.create(this.content, { epochsNum: 2 });
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt an operation with endpoint {string}', function (endpoint) {
    const vs = new ValidationService();
    try {
        vs.validateEndpoint(endpoint);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt an operation with a null port', function () {
    const vs = new ValidationService();
    try {
        vs.validatePort(null);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to validate a null epochs number', function () {
    const vs = new ValidationService();
    try {
        vs.validateEpochsNum(null);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to get an asset with content type {string}', function (contentType) {
    const vs = new ValidationService();
    try {
        vs.validateContentType(contentType);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt a graph query with query type {string}', function (queryType) {
    const vs = new ValidationService();
    try {
        vs.validateQueryType(queryType);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to transfer an asset to an invalid address', function () {
    const vs = new ValidationService();
    try {
        vs.validateAddress('not-a-valid-address');
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to validate a negative state index', function () {
    const vs = new ValidationService();
    try {
        vs.validateStateIndex(-1);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to create a paranet with nodes access policy {int}', function (policy) {
    const vs = new ValidationService();
    try {
        vs.validateParanetNodesAccessPolicy(policy);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to create a paranet with miners access policy {int}', function (policy) {
    const vs = new ValidationService();
    try {
        vs.validateParanetMinersAccessPolicy(policy);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to validate operator reward percentage of {int}', function (pct) {
    const vs = new ValidationService();
    try {
        vs.validateOperatorRewardPercentage(pct);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to validate voter reward percentage of {int}', function (pct) {
    const vs = new ValidationService();
    try {
        vs.validateIncentivizationProposalVotersRewardPercentage(pct);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

// UAL validation steps

Given('a UAL {string}', function (ual) {
    this.ual = ual;
});

When('I validate the UAL', function () {
    const vs = new ValidationService();
    try {
        vs.validateUAL(this.ual);
        this.error = null;
        this.result = true;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to validate the UAL', function () {
    const vs = new ValidationService();
    try {
        vs.validateUAL(this.ual);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to validate a null UAL', function () {
    const vs = new ValidationService();
    try {
        vs.validateUAL(null);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to validate a numeric UAL', function () {
    const vs = new ValidationService();
    try {
        vs.validateUAL(12345);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
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
    try {
        this.result = resolveUAL(this.ual);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
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
    this.result = deriveUAL(blockchain, contract, kcTokenId);
    this.error = null;
});

When('I derive a UAL from blockchain {string}, contract {string}, KC token ID {int}, and KA token ID {int}', function (blockchain, contract, kcTokenId, kaTokenId) {
    this.result = deriveUAL(blockchain, contract, kcTokenId, kaTokenId);
    this.error = null;
});

Then('the derived UAL should be {string}', function (expected) {
    expect(this.result).to.equal(expected);
});
