@smoke
Feature: Blockchain Information
  As a developer using dkg.js
  I want to query blockchain information
  So that I can monitor chain status and wallet state

  Background:
    Given the DKG client is initialized with a valid configuration
    And the blockchain service is mocked

  Scenario: Get the chain ID
    When I request the chain ID
    Then I should receive the chain ID 31337

  Scenario: Get the current gas price
    When I request the gas price
    Then I should receive a non-empty gas price string

  Scenario: Get wallet balances
    When I request the wallet balances
    Then the result should contain an ETH balance
    And the result should contain a TRAC balance

  Scenario: Get the wallet address
    When I request the wallet address
    Then I should receive a valid Ethereum address
