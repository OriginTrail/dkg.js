@smoke
Feature: Node Information
  As a developer using dkg.js
  I want to query DKG node information
  So that I can verify node connectivity and capabilities

  Background:
    Given the DKG client is initialized with a valid configuration
    And the node API is mocked

  Scenario: Get node info
    When I request the node info
    Then I should receive node info with a version field

  Scenario: Get node identity ID
    Given the blockchain service is mocked
    When I request the identity ID for a valid operational wallet
    Then I should receive a numeric identity ID
