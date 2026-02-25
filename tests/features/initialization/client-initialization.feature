@smoke
Feature: DKG Client Initialization
  As a developer using dkg.js
  I want the DkgClient to initialize correctly
  So that I can interact with the Decentralized Knowledge Graph

  Scenario: Successfully initialize with a valid Hardhat configuration
    Given I have a valid Hardhat blockchain configuration
    When I initialize the DKG client
    Then the client should be created successfully
    And the client should have an "assertion" manager
    And the client should have an "asset" manager
    And the client should have a "blockchain" manager
    And the client should have a "graph" manager
    And the client should have a "node" manager
    And the client should have a "network" manager
    And the client should have a "paranet" manager

  Scenario: Derive environment from blockchain name
    Given I have a configuration with blockchain name "hardhat1:31337"
    When I initialize the DKG client
    Then the client should be created successfully

  Scenario: Derive public key from private key
    Given I have a configuration with a valid private key
    When I initialize the DKG client
    Then the client should be created successfully

  Scenario: Fail to initialize without blockchain name
    Given I have a configuration without a blockchain name
    When I attempt to initialize the DKG client
    Then initialization should fail with error "Blockchain name is required"

  Scenario: Fail to initialize with unknown blockchain name
    Given I have a configuration with blockchain name "unknown:99999"
    When I attempt to initialize the DKG client
    Then initialization should fail with error "Could not derive environment"

  Scenario: Fail to initialize with invalid private key
    Given I have a configuration with an invalid private key
    When I attempt to initialize the DKG client
    Then initialization should fail with error "Failed to derive public key"

  Scenario: Backwards compatibility - graph.get aliases asset.get
    Given I have a valid Hardhat blockchain configuration
    When I initialize the DKG client
    Then "graph.get" should be the same function as "asset.get"
    And "graph.create" should be the same function as "asset.create"
    And "graph.publishFinality" should be the same function as "asset.publishFinality"
