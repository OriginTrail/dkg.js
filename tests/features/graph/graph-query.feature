Feature: Graph Querying
  As a developer using dkg.js
  I want to execute SPARQL queries against the DKG
  So that I can retrieve and analyze knowledge graph data

  Background:
    Given the DKG client is initialized with a valid configuration
    And the node API is mocked

  Scenario: Execute a CONSTRUCT query
    Given a valid SPARQL CONSTRUCT query
    When I execute the graph query with type "CONSTRUCT"
    Then the query should return results

  Scenario: Execute a SELECT query
    Given a valid SPARQL SELECT query
    When I execute the graph query with type "SELECT"
    Then the query should return results

  Scenario: Reject query with invalid query type
    Given a valid SPARQL SELECT query
    When I attempt to execute the graph query with type "INVALID"
    Then the operation should fail with error "Invalid query Type"

  Scenario: Reject query with missing query string
    When I attempt to execute a graph query with null query string
    Then the operation should fail with error "queryString is missing"

  Scenario: Execute a query with paranet UAL scope
    Given a valid SPARQL SELECT query
    And a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I execute the graph query scoped to the paranet
    Then the query should return results
