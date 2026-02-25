@smoke
Feature: Knowledge Asset Retrieval
  As a developer using dkg.js
  I want to retrieve Knowledge Assets from the DKG
  So that I can access published data

  Background:
    Given the DKG client is initialized with a valid configuration
    And the blockchain service is mocked
    And the node API is mocked

  Scenario: Successfully retrieve an asset by UAL
    Given a valid UAL for an existing asset
    And the node API get operation returns assertion data
    When I get the Knowledge Asset
    Then the result should contain the assertion data
    And the operation status should be "COMPLETED"

  Scenario: Handle asset not found on the network
    Given a valid UAL for an existing asset
    And the node API get operation returns no assertion
    When I get the Knowledge Asset
    Then the result should contain a failed get operation
    And the error message should contain "Unable to find assertion"

  Scenario: Retrieve asset with metadata included
    Given a valid UAL for an existing asset
    And the node API get operation returns assertion data with metadata
    When I get the Knowledge Asset with metadata included
    Then the result should contain the assertion data
    And the result should contain metadata
