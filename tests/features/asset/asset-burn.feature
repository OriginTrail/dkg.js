Feature: Knowledge Asset Burn
  As a developer using dkg.js
  I want to burn Knowledge Assets
  So that assets can be permanently removed from the network

  Background:
    Given the DKG client is initialized with a valid configuration
    And the blockchain service is mocked

  Scenario: Successfully burn an asset
    Given a valid UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1"
    When I burn the asset
    Then the burn should complete successfully
    And the result should contain the UAL

  Scenario: Fail to burn with invalid UAL
    Given an invalid UAL "not-a-ual"
    When I attempt to burn the asset
    Then the operation should fail with a validation error
