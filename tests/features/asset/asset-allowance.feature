Feature: Token Allowance Management
  As a developer using dkg.js
  I want to manage TRAC token allowances
  So that I can control spending permissions for publishing

  Background:
    Given the DKG client is initialized with a valid configuration
    And the blockchain service is mocked

  Scenario: Increase token allowance
    Given a token amount of 1000
    When I increase the allowance
    Then the allowance operation should complete successfully
    And the result should contain a transaction hash

  Scenario: Decrease token allowance
    Given a token amount of 500
    And the current allowance is 1000
    When I decrease the allowance
    Then the allowance operation should complete successfully

  Scenario Outline: Set allowance relative to current
    Given the current allowance is <current>
    And a target allowance of <target>
    When I set the allowance
    Then <assertion>

    Examples:
      | current | target | assertion                                    |
      | 100     | 500    | the allowance operation should complete successfully |
      | 500     | 100    | the allowance operation should complete successfully |
      | 500     | 500    | the result status should indicate "Skipped"          |

  Scenario: Get current allowance
    Given the current allowance is 1000
    When I get the current allowance
    Then I should receive the allowance value
