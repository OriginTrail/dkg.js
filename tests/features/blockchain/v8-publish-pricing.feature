@smoke
Feature: V8 publish pricing
  As a developer publishing a V8 knowledge collection
  I want the SDK to use the AskStorage contract that validates the mint
  So that automatic token amount calculation does not use a newer Hub registration

  Scenario Outline: Resolve the pricing contract from KnowledgeCollection
    Given the V8 pricing contracts for "<blockchain>"
    When I request the V8 stake weighted average ask
    Then the KnowledgeCollection AskStorage should provide "<ask>"

    Examples:
      | blockchain | ask              |
      | otp:2043   | 800000000000000  |
      | gnosis:100 | 1591976207508008 |
      | base:8453  | 1228808790793308 |
