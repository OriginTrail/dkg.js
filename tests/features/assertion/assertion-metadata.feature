@smoke
Feature: Assertion Metadata Computation
  As a developer using dkg.js
  I want to compute metadata about assertions
  So that I can inspect assertion properties before publishing

  Background:
    Given the DKG client is initialized with a valid configuration

  Scenario: Compute the public assertion ID (Merkle root)
    Given I have valid JSON-LD content with public triples
    When I compute the public assertion ID
    Then I should receive a non-empty hex string

  Scenario: Compute the assertion size in bytes
    Given I have valid JSON-LD content with public triples
    When I compute the assertion size in bytes
    Then the size should be a positive number

  Scenario: Count the number of triples
    Given I have valid JSON-LD content with public triples
    When I count the triples
    Then the count should be a positive number

  Scenario: Count the number of chunks
    Given I have valid JSON-LD content with public triples
    When I count the chunks
    Then the count should be a positive number
