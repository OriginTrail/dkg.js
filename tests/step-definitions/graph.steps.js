import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { SPARQL_QUERIES, DEFAULT_EPOCHS_NUM } from '../support/test-constants.js';

Given('a valid SPARQL CONSTRUCT query', function () {
    this.queryString = SPARQL_QUERIES.construct;
    this.queryType = 'CONSTRUCT';
});

Given('a valid SPARQL SELECT query', function () {
    this.queryString = SPARQL_QUERIES.select;
    this.queryType = 'SELECT';
});

When('I execute the graph query with type {string}', async function (queryType) {
    await this.run(() => this.dkgClient.graph.query(this.queryString, queryType));
});

When('I attempt to execute the graph query with type {string}', async function (queryType) {
    await this.run(() => this.dkgClient.graph.query(this.queryString, queryType));
});

When('I attempt to execute a graph query with null query string', async function () {
    await this.run(() => this.dkgClient.graph.query(null, 'SELECT'));
});

When('I execute the graph query scoped to the paranet', async function () {
    await this.run(() => this.dkgClient.graph.query(this.queryString, this.queryType, {
        paranetUAL: this.paranetUAL,
    }));
});

Then('the query should return results', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.not.be.null;
});

When('I attempt to store content locally', async function () {
    await this.run(() => this.dkgClient.graph.localStore(this.content, { epochsNum: DEFAULT_EPOCHS_NUM }));
});

Then('the local store operation should fail', function () {
    expect(this.error).to.not.be.null;
});
