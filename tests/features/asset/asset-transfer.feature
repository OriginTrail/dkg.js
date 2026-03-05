Feature: Knowledge Asset Transfer
  As a developer using dkg.js
  I want to transfer ownership of Knowledge Assets
  So that assets can change hands on the blockchain

  Background:
    Given the DKG client is initialized with a valid configuration
    And the blockchain service is mocked
    And the node API is mocked

  Scenario: Successfully transfer an asset to a new owner
    Given a default KA UAL
    And a valid new owner address
    When I transfer the asset
    Then the transfer should complete successfully
    And the result should contain the UAL

  Scenario: Fail to transfer with invalid UAL
    Given an invalid UAL "not-a-ual"
    And a valid new owner address
    When I attempt to transfer the asset
    Then the operation should fail with a validation error

  Scenario: Fail to transfer with missing new owner
    Given a default KA UAL
    And no new owner address
    When I attempt to transfer the asset
    Then the operation should fail with error "newOwner is missing"
