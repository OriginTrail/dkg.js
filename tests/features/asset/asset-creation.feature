@smoke
Feature: Knowledge Asset Creation
  As a developer using dkg.js
  I want to create Knowledge Assets on the DKG
  So that I can publish structured data to the decentralized network

  Background:
    Given the DKG client is initialized with a valid configuration
    And the blockchain service is mocked
    And the node API is mocked

  Scenario: Successfully create a Knowledge Asset with JSON-LD content
    Given I have valid JSON-LD content with public triples
    And the node API publish operation will succeed
    When I create a Knowledge Asset with default options
    Then the operation should complete successfully
    And I should receive a valid UAL starting with "did:dkg"

  Scenario: Create a Knowledge Asset with private content
    Given I have JSON-LD content with both public and private triples
    And the node API publish operation will succeed
    When I create a Knowledge Asset with default options
    Then the operation should complete successfully
    And I should receive a valid UAL starting with "did:dkg"

  Scenario: Handle failed publish operation
    Given I have valid JSON-LD content with public triples
    And the node API publish operation will fail
    When I create a Knowledge Asset with default options
    Then the result should contain a failed publish operation status
