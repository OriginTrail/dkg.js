import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';

Given('a valid SPARQL CONSTRUCT query', function () {
    this.queryString = 'CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o } LIMIT 10';
    this.queryType = 'CONSTRUCT';
});

Given('a valid SPARQL SELECT query', function () {
    this.queryString = 'SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10';
    this.queryType = 'SELECT';
});

When('I execute the graph query with type {string}', async function (queryType) {
    try {
        this.result = await this.dkgClient.graph.query(this.queryString, queryType);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to execute the graph query with type {string}', async function (queryType) {
    try {
        this.result = await this.dkgClient.graph.query(this.queryString, queryType);
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I attempt to execute a graph query with null query string', async function () {
    try {
        this.result = await this.dkgClient.graph.query(null, 'SELECT');
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

When('I execute the graph query scoped to the paranet', async function () {
    try {
        this.result = await this.dkgClient.graph.query(this.queryString, this.queryType, {
            paranetUAL: this.paranetUAL,
        });
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('the query should return results', function () {
    expect(this.error).to.be.null;
    expect(this.result).to.not.be.null;
});

When('I attempt to store content locally', async function () {
    try {
        this.result = await this.dkgClient.graph.localStore(this.content, { epochsNum: 2 });
        this.error = null;
    } catch (e) {
        this.error = e;
    }
});

Then('the local store operation should fail', function () {
    expect(this.error).to.not.be.null;
});
