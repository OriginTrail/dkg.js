Feature: Publish Finality
  As a developer using dkg.js
  I want to check the finality status of published assets
  So that I know when my assets are fully confirmed

  Background:
    Given the DKG client is initialized with a valid configuration
    And the node API is mocked
    And a default KC UAL

  Scenario Outline: Asset finality check
    Given the node reports <confirmations> finality confirmations
    And the required confirmations are <required>
    When I check the publish finality
    Then the finality status should be "<status>"
    And the number of confirmations should be <confirmations>

    Examples:
      | confirmations | required | status        |
      | 3             | 3        | FINALIZED     |
      | 1             | 3        | NOT FINALIZED |
