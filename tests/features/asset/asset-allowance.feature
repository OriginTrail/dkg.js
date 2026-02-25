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

  Scenario: Set allowance higher than current
    Given the current allowance is 100
    And a target allowance of 500
    When I set the allowance
    Then the allowance operation should complete successfully

  Scenario: Set allowance lower than current
    Given the current allowance is 500
    And a target allowance of 100
    When I set the allowance
    Then the allowance operation should complete successfully

  Scenario: Set allowance equal to current skips transaction
    Given the current allowance is 500
    And a target allowance of 500
    When I set the allowance
    Then the result status should indicate "Skipped"

  Scenario: Get current allowance
    Given the current allowance is 1000
    When I get the current allowance
    Then I should receive the allowance value
