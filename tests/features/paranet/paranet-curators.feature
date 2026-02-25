Feature: Paranet Curator Management
  As a Paranet operator using dkg.js
  I want to manage curators for my Paranet
  So that I can control who can curate knowledge collections

  Background:
    Given the DKG client is initialized with a valid configuration
    And the blockchain service is mocked

  Scenario: Add a curator to a Paranet
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    And a valid curator address
    When I add the curator to the Paranet
    Then the curator addition should succeed

  Scenario: Remove a curator from a Paranet
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    And a valid curator address
    When I remove the curator from the Paranet
    Then the curator removal should succeed

  Scenario: Fail to add curator with invalid address
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    And an invalid curator address "not-an-address"
    When I attempt to add the curator
    Then the operation should fail with error "Wrong address format"

  Scenario: Fail to add curator to UAL without KA token ID
    Given a Paranet UAL without KA token ID "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1"
    And a valid curator address
    When I attempt to add the curator
    Then the operation should fail with error "Knowledge asset token id is required"
