import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import sinon from 'sinon';
import BlockchainServiceBase from '../../services/blockchain-service/blockchain-service-base.js';

const V8_PRICING_CONTRACTS = {
    'otp:2043': {
        knowledgeCollectionAskStorage: '0x44e438332dF57983ec3402B0a5F8f462caE268d4',
        hubAskStorage: '0xffc349C8deb8d88Dc8a99d379413359Ca92DEB44',
        ask: '800000000000000',
    },
    'gnosis:100': {
        knowledgeCollectionAskStorage: '0x397441d8480Ab694Ba9f915D7e2Fb6E7206A207c',
        hubAskStorage: '0x80F6D2673689c3B7495942101137F741405A74Ae',
        ask: '1591976207508008',
    },
    'base:8453': {
        knowledgeCollectionAskStorage: '0xDBdfe1628B4700f2D45Cb2292F905e56F06B8802',
        hubAskStorage: '0x80F6D2673689c3B7495942101137F741405A74Ae',
        ask: '1228808790793308',
    },
};

Given('the V8 pricing contracts for {string}', function configureV8Pricing(blockchainName) {
    const contracts = V8_PRICING_CONTRACTS[blockchainName];
    expect(contracts).not.to.equal(undefined);
    expect(contracts.knowledgeCollectionAskStorage).not.to.equal(contracts.hubAskStorage);

    this.v8PricingBlockchain = {
        name: blockchainName,
        hubContract: '0x0000000000000000000000000000000000000001',
        publicKey: '0x0000000000000000000000000000000000000002',
    };
    this.v8PricingService = new BlockchainServiceBase();
    this.v8PricingContractCalls = [];

    sinon.stub(this.v8PricingService, 'callContractFunction').callsFake(
        async (contractName, functionName, args, blockchain) => {
            this.v8PricingContractCalls.push({
                type: 'resolved',
                contractName,
                functionName,
                args,
                blockchain,
            });
            return contracts.knowledgeCollectionAskStorage;
        },
    );
    sinon.stub(this.v8PricingService, 'ensureBlockchainInfo').resolves();

    const world = this;
    class ContractMock {
        constructor(abi, address, options) {
            world.v8PricingContractCalls.push({
                type: 'direct',
                abi,
                address,
                options,
            });
            this.methods = {
                getStakeWeightedAverageAsk: () => ({
                    call: async () => contracts.ask,
                }),
            };
        }
    }

    sinon.stub(this.v8PricingService, 'getWeb3Instance').resolves({
        eth: { Contract: ContractMock },
    });
});

When('I request the V8 stake weighted average ask', async function requestV8Ask() {
    await this.run(() =>
        this.v8PricingService.getStakeWeightedAverageAsk(this.v8PricingBlockchain),
    );
});

Then(
    'the KnowledgeCollection AskStorage should provide {string}',
    function verifyV8Ask(expectedAsk) {
        expect(this.error).to.equal(null);
        expect(this.result).to.equal(expectedAsk);
        expect(this.v8PricingContractCalls).to.have.length(2);

        const [resolutionCall, directCall] = this.v8PricingContractCalls;
        expect(resolutionCall.contractName).to.equal('KnowledgeCollection');
        expect(resolutionCall.functionName).to.equal('askStorage');
        expect(resolutionCall.args).to.deep.equal([]);
        expect(resolutionCall.blockchain).to.equal(this.v8PricingBlockchain);
        expect(directCall.address).to.equal(
            V8_PRICING_CONTRACTS[this.v8PricingBlockchain.name].knowledgeCollectionAskStorage,
        );
        expect(directCall.options).to.deep.equal({ from: this.v8PricingBlockchain.publicKey });
    },
);
