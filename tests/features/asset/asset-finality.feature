Feature: Publish Finality
  As a developer using dkg.js
  I want to check the finality status of published assets
  So that I know when my assets are fully confirmed

  Background:
    Given the DKG client is initialized with a valid configuration
    And the node API is mocked

  Scenario: Asset is finalized with sufficient confirmations
    Given a valid UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1"
    And the node reports 3 finality confirmations
    When I check the publish finality
    Then the finality status should be "FINALIZED"
    And the number of confirmations should be 3

  Scenario: Asset is not yet finalized
    Given a valid UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1"
    And the node reports 1 finality confirmation
    And the required confirmations are 3
    When I check the publish finality
    Then the finality status should be "NOT FINALIZED"
    And the number of confirmations should be 1
