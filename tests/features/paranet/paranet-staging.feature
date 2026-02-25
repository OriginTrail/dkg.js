Feature: Paranet Knowledge Collection Staging
  As a Paranet curator using dkg.js
  I want to stage and review Knowledge Collections
  So that I can control which collections join my Paranet

  Background:
    Given the DKG client is initialized with a valid configuration
    And the blockchain service is mocked

  Scenario: Stage a Knowledge Collection to a Paranet
    Given a KC UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/2"
    And a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I stage the Knowledge Collection
    Then the staging should succeed

  Scenario: Review and accept a staged Knowledge Collection
    Given a KC UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/2"
    And a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I review the Knowledge Collection as accepted
    Then the review should succeed

  Scenario: Review and reject a staged Knowledge Collection
    Given a KC UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/2"
    And a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I review the Knowledge Collection as rejected
    Then the review should succeed

  Scenario: Check if a Knowledge Collection is staged
    Given a KC UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/2"
    And a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I check if the KC is staged
    Then I should receive a staging status

  Scenario: Check if a Knowledge Collection is approved
    Given a KC UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/2"
    And a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I check if the KC is approved
    Then I should receive an approval status

  Scenario: Get Knowledge Collection approval status
    Given a KC UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/2"
    And a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I get the KC approval status
    Then I should receive a status string
