import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';

const VALID_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const VALID_ADDRESS_2 = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

// --- Paranet creation ---

When('I create a Paranet with name {string} and description {string}', async function (name, desc) {
    try {
        this.result = await this.dkgClient.paranet.create(this.ual, {
            paranetName: name,
            paranetDescription: desc,
            paranetNodesAccessPolicy: 0,
            paranetMinersAccessPolicy: 0,
            paranetKcSubmissionPolicy: 0,
        });
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I create a Paranet with permissioned nodes access policy', async function () {
    try {
        this.result = await this.dkgClient.paranet.create(this.ual, {
            paranetName: 'PermissionedParanet',
            paranetDescription: 'A permissioned paranet',
            paranetNodesAccessPolicy: 1,
            paranetMinersAccessPolicy: 0,
            paranetKcSubmissionPolicy: 0,
        });
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to create a Paranet', async function () {
    try {
        this.result = await this.dkgClient.paranet.create(this.ual, {
            paranetName: 'Test',
            paranetDescription: 'Test',
            paranetNodesAccessPolicy: 0,
            paranetMinersAccessPolicy: 0,
            paranetKcSubmissionPolicy: 0,
        });
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to create a Paranet without a name', async function () {
    try {
        this.result = await this.dkgClient.paranet.create(this.ual, {
            paranetDescription: 'Test',
            paranetNodesAccessPolicy: 0,
            paranetMinersAccessPolicy: 0,
            paranetKcSubmissionPolicy: 0,
        });
        this.error = null;
    } catch (e) {
        this.error = e;
    }
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
    this.kcUAL = 'did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/2';
    this.paranetUAL = 'did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1';
});

When('I check if the KC is registered to the Paranet', async function () {
    try {
        this.result = await this.dkgClient.paranet.isKnowledgeCollectionRegistered(
            this.kcUAL,
            this.paranetUAL,
        );
        this.error = null;
    } catch (e) {
        this.error = e;
    }
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
    this.curatorAddress = VALID_ADDRESS;
});

Given('an invalid curator address {string}', function (address) {
    this.curatorAddress = address;
});

When('I add the curator to the Paranet', async function () {
    try {
        this.result = await this.dkgClient.paranet.addCurator(this.paranetUAL, this.curatorAddress);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I remove the curator from the Paranet', async function () {
    try {
        this.result = await this.dkgClient.paranet.removeCurator(this.paranetUAL, this.curatorAddress);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to add the curator', async function () {
    try {
        this.result = await this.dkgClient.paranet.addCurator(this.paranetUAL, this.curatorAddress);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
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
    this.minerAddresses = [VALID_ADDRESS, VALID_ADDRESS_2];
});

Given('a valid miner address', function () {
    this.minerAddress = VALID_ADDRESS;
});

When('I add permissioned nodes to the Paranet', async function () {
    try {
        await this.dkgClient.paranet.addPermissionedNodes(this.paranetUAL, this.identityIds);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I remove permissioned nodes from the Paranet', async function () {
    try {
        await this.dkgClient.paranet.removePermissionedNodes(this.paranetUAL, this.identityIds);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I request permissioned node access', async function () {
    try {
        await this.dkgClient.paranet.requestParanetPermissionedNodeAccess(this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I approve the permissioned node', async function () {
    try {
        await this.dkgClient.paranet.approvePermissionedNode(this.paranetUAL, this.identityId);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I reject the permissioned node', async function () {
    try {
        await this.dkgClient.paranet.rejectPermissionedNode(this.paranetUAL, this.identityId);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I get the permissioned nodes', async function () {
    try {
        this.result = await this.dkgClient.paranet.getPermissionedNodes(this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('I should receive a list of nodes', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.be.an('array');
});

When('I add permissioned miners to the Paranet', async function () {
    try {
        await this.dkgClient.paranet.addParanetPermissionedMiners(this.paranetUAL, this.minerAddresses);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I remove permissioned miners from the Paranet', async function () {
    try {
        await this.dkgClient.paranet.removeParanetPermissionedMiners(this.paranetUAL, this.minerAddresses);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I request permissioned miner access', async function () {
    try {
        await this.dkgClient.paranet.requestParanetPermissionedMinerAccess(this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I approve the permissioned miner', async function () {
    try {
        await this.dkgClient.paranet.approvePermissionedMiner(this.paranetUAL, this.minerAddress);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I reject the permissioned miner', async function () {
    try {
        await this.dkgClient.paranet.rejectPermissionedMiner(this.paranetUAL, this.minerAddress);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I get the knowledge miners', async function () {
    try {
        this.result = await this.dkgClient.paranet.getKnowledgeMiners(this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
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
    try {
        this.result = await this.dkgClient.paranet.stageKnowledgeCollection(this.kcUAL, this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('the staging should succeed', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('operation');
});

When('I review the Knowledge Collection as accepted', async function () {
    try {
        this.result = await this.dkgClient.paranet.reviewKnowledgeCollection(
            this.kcUAL, this.paranetUAL, true,
        );
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I review the Knowledge Collection as rejected', async function () {
    try {
        this.result = await this.dkgClient.paranet.reviewKnowledgeCollection(
            this.kcUAL, this.paranetUAL, false,
        );
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('the review should succeed', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('operation');
});

When('I check if the KC is staged', async function () {
    try {
        this.result = await this.dkgClient.paranet.isKnowledgeCollectionStaged(this.kcUAL, this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('I should receive a staging status', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('isStagedToParanet');
});

When('I check if the KC is approved', async function () {
    try {
        this.result = await this.dkgClient.paranet.isKnowledgeCollectionApproved(this.kcUAL, this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('I should receive an approval status', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('isApprovedToParanet');
});

When('I get the KC approval status', async function () {
    try {
        this.result = await this.dkgClient.paranet.getKnowledgeCollectionApprovalStatus(this.kcUAL, this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('I should receive a status string', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('kcParanetApprovalStatus');
});

// --- Incentives ---

When('I get all incentives pools', async function () {
    try {
        this.result = await this.dkgClient.paranet.getAllIncentivesPools(this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('I should receive a list of incentives pools', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('incentivesPools');
});

When('I claim a miner reward of {int}', async function (amount) {
    try {
        this.result = await this.dkgClient.paranet.claimMinerReward(this.paranetUAL, amount);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I claim a voter reward', async function () {
    try {
        this.result = await this.dkgClient.paranet.claimVoterReward(this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I claim an operator reward', async function () {
    try {
        this.result = await this.dkgClient.paranet.claimOperatorReward(this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('the reward claim should succeed', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('transactionHash');
});

When('I get the claimable miner reward', async function () {
    try {
        this.result = await this.dkgClient.paranet.getClaimableMinerReward(this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I get the claimable voter reward', async function () {
    try {
        this.result = await this.dkgClient.paranet.getClaimableVoterReward(this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I get the claimable operator reward', async function () {
    try {
        this.result = await this.dkgClient.paranet.getClaimableOperatorReward(this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I get the claimable all miners reward', async function () {
    try {
        this.result = await this.dkgClient.paranet.getClaimableAllMinersReward(this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I get the claimable all voters reward', async function () {
    try {
        this.result = await this.dkgClient.paranet.getClaimableAllVotersReward(this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
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
    try {
        this.result = await this.dkgClient.paranet.createService(this.serviceUAL, {
            paranetServiceName: name,
            paranetServiceDescription: desc,
            paranetServiceAddresses: [],
        });
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('the service creation should succeed', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('operation');
});

Then('the result should contain the service UAL', function () {
    expect(this.result).to.have.property('serviceUAL');
});

Given('service UALs to add', function () {
    this.serviceUALs = [
        'did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/3/1',
    ];
});

When('I add the services to the Paranet', async function () {
    try {
        this.result = await this.dkgClient.paranet.addServices(this.paranetUAL, this.serviceUALs);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('the service addition should succeed', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('operation');
});

// --- Role checks ---

When('I check if I am a knowledge miner', async function () {
    try {
        this.result = await this.dkgClient.paranet.isKnowledgeMiner(this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I check if I am a Paranet operator', async function () {
    try {
        this.result = await this.dkgClient.paranet.isParanetOperator(this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I check if I am a proposal voter', async function () {
    try {
        this.result = await this.dkgClient.paranet.isProposalVoter(this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('I should receive a boolean result', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.be.a('boolean');
});

// --- Submit to paranet ---

When('I submit the KC to the Paranet', async function () {
    try {
        this.result = await this.dkgClient.asset.submitToParanet(this.kcUAL, this.paranetUAL);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('the submission should succeed', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.have.property('operation');
});
