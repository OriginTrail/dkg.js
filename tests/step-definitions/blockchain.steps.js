import { When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { isAddress } from 'ethers';

When('I request the chain ID', async function () {
    await this.run(() => this.dkgClient.blockchain.getChainId());
});

Then('I should receive the chain ID {int}', function (chainId) {
    expect(this.error).to.be.null;
    expect(this.result).to.equal(chainId);
});

When('I request the gas price', async function () {
    await this.run(() => this.dkgClient.blockchain.getGasPrice());
});

Then('I should receive a non-empty gas price string', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.be.a('string').that.is.not.empty;
});

When('I request the wallet balances', async function () {
    await this.run(() => this.dkgClient.blockchain.getWalletBalances());
});

Then('the result should contain an ETH balance', function () {
    expect(this.result).to.have.property('ethBalance');
});

Then('the result should contain a TRAC balance', function () {
    expect(this.result).to.have.property('tracBalance');
});

When('I request the wallet address', async function () {
    await this.run(() => this.dkgClient.blockchain.getWalletAddress());
});

Then('I should receive a valid Ethereum address', function () {
    expect(this.error).to.be.null;
    expect(isAddress(this.result)).to.be.true;
});
