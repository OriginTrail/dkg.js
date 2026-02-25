import { When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { isAddress } from 'ethers';

When('I request the chain ID', async function () {
    try {
        this.result = await this.dkgClient.blockchain.getChainId();
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('I should receive the chain ID {int}', function (chainId) {
    expect(this.error).to.be.null;
    expect(this.result).to.equal(chainId);
});

When('I request the gas price', async function () {
    try {
        this.result = await this.dkgClient.blockchain.getGasPrice();
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('I should receive a non-empty gas price string', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.be.a('string').that.is.not.empty;
});

When('I request the wallet balances', async function () {
    try {
        this.result = await this.dkgClient.blockchain.getWalletBalances();
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('the result should contain an ETH balance', function () {
    expect(this.result).to.have.property('ethBalance');
});

Then('the result should contain a TRAC balance', function () {
    expect(this.result).to.have.property('tracBalance');
});

When('I request the wallet address', async function () {
    try {
        this.result = await this.dkgClient.blockchain.getWalletAddress();
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('I should receive a valid Ethereum address', function () {
    expect(this.error).to.be.null;
    expect(isAddress(this.result)).to.be.true;
});
