import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { TEST_ADDRESSES } from '../support/test-constants.js';
import { makeKCUAL, makeParanetUAL, makeServiceUAL } from '../support/ual-factory.js';

function makeParanetPayload(overrides = {}) {
    return {
        paranetName: 'Test',
        paranetDescription: 'Test',
        paranetNodesAccessPolicy: 0,
        paranetMinersAccessPolicy: 0,
        paranetKcSubmissionPolicy: 0,
        ...overrides,
    };
}

// --- Paranet creation ---

When('I create a Paranet with name {string} and description {string}', async function (name, desc) {
    await this.run(() => this.dkgClient.paranet.create(this.ual, makeParanetPayload({
        paranetName: name,
        paranetDescription: desc,
    })));
});

When('I create a Paranet with permissioned nodes access policy', async function () {
    await this.run(() => this.dkgClient.paranet.create(this.ual, makeParanetPayload({
        paranetName: 'PermissionedParanet',
        paranetDescription: 'A permissioned paranet',
        paranetNodesAccessPolicy: 1,
    })));
});

When('I attempt to create a Paranet', async function () {
    await this.run(() => this.dkgClient.paranet.create(this.ual, makeParanetPayload()));
});

When('I attempt to create a Paranet without a name', async function () {
    const payload = makeParanetPayload();
    delete payload.paranetName;
    await this.run(() => this.dkgClient.paranet.create(this.ual, payload));
});

Then('the Paranet creation should succeed', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('operation');
});

Then('the result should contain the paranet UAL', function () {
    expect(this.result).to.have.property('paranetUAL');
});

// --- KC registration check ---

Given('a KC UAL and a Paranet UAL', function () {
    this.kcUAL = makeKCUAL({ kcTokenId: 2 });
    this.paranetUAL = makeParanetUAL();
});

When('I check if the KC is registered to the Paranet', async function () {
    await this.run(() => this.dkgClient.paranet.isKnowledgeCollectionRegistered(
        this.kcUAL,
        this.paranetUAL,
    ));
});

Then('I should receive a boolean registration status', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('isKcRegisteredToParanet');
    expect(this.result.isKcRegisteredToParanet).to.be.a('boolean');
});

// --- Curators ---

Given('a Paranet UAL {string}', function (ual) {
    this.paranetUAL = ual;
});

Given('a Paranet UAL without KA token ID {string}', function (ual) {
    this.paranetUAL = ual;
});

Given('a valid curator address', function () {
    this.curatorAddress = TEST_ADDRESSES.owner;
});

Given('an invalid curator address {string}', function (address) {
    this.curatorAddress = address;
});

When('I add the curator to the Paranet', async function () {
    await this.run(() => this.dkgClient.paranet.addCurator(this.paranetUAL, this.curatorAddress));
});

When('I remove the curator from the Paranet', async function () {
    await this.run(() => this.dkgClient.paranet.removeCurator(this.paranetUAL, this.curatorAddress));
});

When('I attempt to add the curator', async function () {
    await this.run(() => this.dkgClient.paranet.addCurator(this.paranetUAL, this.curatorAddress));
});

Then('the curator addition should succeed', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('operation');
});

Then('the curator removal should succeed', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('operation');
});

// --- Permissions ---

Given('a list of identity IDs [{int}, {int}, {int}]', function (a, b, c) {
    this.identityIds = [a, b, c];
});

Given('a list of identity IDs [{int}, {int}]', function (a, b) {
    this.identityIds = [a, b];
});

Given('an identity ID of {int}', function (id) {
    this.identityId = id;
});

Given('a list of miner addresses', function () {
    this.minerAddresses = [TEST_ADDRESSES.owner, TEST_ADDRESSES.secondary];
});

Given('a valid miner address', function () {
    this.minerAddress = TEST_ADDRESSES.owner;
});

When('I add permissioned nodes to the Paranet', async function () {
    await this.run(async () => {
        await this.dkgClient.paranet.addPermissionedNodes(this.paranetUAL, this.identityIds);
    });
});

When('I remove permissioned nodes from the Paranet', async function () {
    await this.run(async () => {
        await this.dkgClient.paranet.removePermissionedNodes(this.paranetUAL, this.identityIds);
    });
});

When('I request permissioned node access', async function () {
    await this.run(async () => {
        await this.dkgClient.paranet.requestParanetPermissionedNodeAccess(this.paranetUAL);
    });
});

When('I approve the permissioned node', async function () {
    await this.run(async () => {
        await this.dkgClient.paranet.approvePermissionedNode(this.paranetUAL, this.identityId);
    });
});

When('I reject the permissioned node', async function () {
    await this.run(async () => {
        await this.dkgClient.paranet.rejectPermissionedNode(this.paranetUAL, this.identityId);
    });
});

When('I get the permissioned nodes', async function () {
    await this.run(() => this.dkgClient.paranet.getPermissionedNodes(this.paranetUAL));
});

Then('I should receive a list of nodes', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.be.an('array');
});

When('I add permissioned miners to the Paranet', async function () {
    await this.run(async () => {
        await this.dkgClient.paranet.addParanetPermissionedMiners(this.paranetUAL, this.minerAddresses);
    });
});

When('I remove permissioned miners from the Paranet', async function () {
    await this.run(async () => {
        await this.dkgClient.paranet.removeParanetPermissionedMiners(this.paranetUAL, this.minerAddresses);
    });
});

When('I request permissioned miner access', async function () {
    await this.run(async () => {
        await this.dkgClient.paranet.requestParanetPermissionedMinerAccess(this.paranetUAL);
    });
});

When('I approve the permissioned miner', async function () {
    await this.run(async () => {
        await this.dkgClient.paranet.approvePermissionedMiner(this.paranetUAL, this.minerAddress);
    });
});

When('I reject the permissioned miner', async function () {
    await this.run(async () => {
        await this.dkgClient.paranet.rejectPermissionedMiner(this.paranetUAL, this.minerAddress);
    });
});

When('I get the knowledge miners', async function () {
    await this.run(() => this.dkgClient.paranet.getKnowledgeMiners(this.paranetUAL));
});

Then('I should receive a list of miners', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.be.an('array');
});

// --- Staging ---

Given('a KC UAL {string}', function (ual) {
    this.kcUAL = ual;
});

When('I stage the Knowledge Collection', async function () {
    await this.run(() => this.dkgClient.paranet.stageKnowledgeCollection(this.kcUAL, this.paranetUAL));
});

Then('the staging should succeed', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('operation');
});

When('I review the Knowledge Collection as accepted', async function () {
    await this.run(() => this.dkgClient.paranet.reviewKnowledgeCollection(
        this.kcUAL, this.paranetUAL, true,
    ));
});

When('I review the Knowledge Collection as rejected', async function () {
    await this.run(() => this.dkgClient.paranet.reviewKnowledgeCollection(
        this.kcUAL, this.paranetUAL, false,
    ));
});

Then('the review should succeed', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('operation');
});

When('I check if the KC is staged', async function () {
    await this.run(() => this.dkgClient.paranet.isKnowledgeCollectionStaged(this.kcUAL, this.paranetUAL));
});

Then('I should receive a staging status', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('isStagedToParanet');
});

When('I check if the KC is approved', async function () {
    await this.run(() => this.dkgClient.paranet.isKnowledgeCollectionApproved(this.kcUAL, this.paranetUAL));
});

Then('I should receive an approval status', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('isApprovedToParanet');
});

When('I get the KC approval status', async function () {
    await this.run(() => this.dkgClient.paranet.getKnowledgeCollectionApprovalStatus(this.kcUAL, this.paranetUAL));
});

Then('I should receive a status string', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('kcParanetApprovalStatus');
});

// --- Incentives ---

When('I get all incentives pools', async function () {
    await this.run(() => this.dkgClient.paranet.getAllIncentivesPools(this.paranetUAL));
});

Then('I should receive a list of incentives pools', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('incentivesPools');
});

When('I claim a miner reward of {int}', async function (amount) {
    await this.run(() => this.dkgClient.paranet.claimMinerReward(this.paranetUAL, amount));
});

When('I claim a voter reward', async function () {
    await this.run(() => this.dkgClient.paranet.claimVoterReward(this.paranetUAL));
});

When('I claim an operator reward', async function () {
    await this.run(() => this.dkgClient.paranet.claimOperatorReward(this.paranetUAL));
});

Then('the reward claim should succeed', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('transactionHash');
});

When('I get the claimable miner reward', async function () {
    await this.run(() => this.dkgClient.paranet.getClaimableMinerReward(this.paranetUAL));
});

When('I get the claimable voter reward', async function () {
    await this.run(() => this.dkgClient.paranet.getClaimableVoterReward(this.paranetUAL));
});

When('I get the claimable operator reward', async function () {
    await this.run(() => this.dkgClient.paranet.getClaimableOperatorReward(this.paranetUAL));
});

When('I get the claimable all miners reward', async function () {
    await this.run(() => this.dkgClient.paranet.getClaimableAllMinersReward(this.paranetUAL));
});

When('I get the claimable all voters reward', async function () {
    await this.run(() => this.dkgClient.paranet.getClaimableAllVotersReward(this.paranetUAL));
});

Then('I should receive a reward value', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.not.be.undefined;
});

// --- Services ---

Given('a service UAL {string}', function (ual) {
    this.serviceUAL = ual;
});

When('I create a Paranet service with name {string} and description {string}', async function (name, desc) {
    await this.run(() => this.dkgClient.paranet.createService(this.serviceUAL, {
        paranetServiceName: name,
        paranetServiceDescription: desc,
        paranetServiceAddresses: [],
    }));
});

Then('the service creation should succeed', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('operation');
});

Then('the result should contain the service UAL', function () {
    expect(this.result).to.have.property('serviceUAL');
});

Given('service UALs to add', function () {
    this.serviceUALs = [makeServiceUAL()];
});

When('I add the services to the Paranet', async function () {
    await this.run(() => this.dkgClient.paranet.addServices(this.paranetUAL, this.serviceUALs));
});

Then('the service addition should succeed', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('operation');
});

// --- Role checks ---

When('I check if I am a knowledge miner', async function () {
    await this.run(() => this.dkgClient.paranet.isKnowledgeMiner(this.paranetUAL));
});

When('I check if I am a Paranet operator', async function () {
    await this.run(() => this.dkgClient.paranet.isParanetOperator(this.paranetUAL));
});

When('I check if I am a proposal voter', async function () {
    await this.run(() => this.dkgClient.paranet.isProposalVoter(this.paranetUAL));
});

Then('I should receive a boolean result', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.be.a('boolean');
});

// --- Submit to paranet ---

When('I submit the KC to the Paranet', async function () {
    await this.run(() => this.dkgClient.asset.submitToParanet(this.kcUAL, this.paranetUAL));
});

Then('the submission should succeed', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('operation');
});
