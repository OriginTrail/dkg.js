Feature: Local Store
  As a developer using dkg.js
  I want to store content locally on a DKG node
  So that I can cache data without full network publishing

  Background:
    Given the DKG client is initialized with a valid configuration
    And the blockchain service is mocked
    And the node API is mocked

  Scenario: Reject local store with invalid content format
    Given I have content that is neither JSON-LD nor N-Quads
    When I attempt to store content locally
    Then the local store operation should fail
