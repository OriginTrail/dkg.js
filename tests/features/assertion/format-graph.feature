@smoke
Feature: Assertion Graph Formatting
  As a developer using dkg.js
  I want to format content into assertions
  So that I can prepare data for publishing to the DKG

  Background:
    Given the DKG client is initialized with a valid configuration

  Scenario: Format JSON-LD content with public data only
    Given I have valid JSON-LD content with public triples
    When I format the graph
    Then the result should contain a "public" assertion
    And the public assertion should be a non-empty array

  Scenario: Format JSON-LD content with public and private data
    Given I have JSON-LD content with both public and private triples
    When I format the graph
    Then the result should contain a "public" assertion
    And the result should contain a "private" assertion
    And the private assertion should be a non-empty array

