@smoke
Feature: Input Validation
  As a developer using dkg.js
  I want inputs to be validated before operations execute
  So that I get clear error messages for invalid parameters

  Background:
    Given the DKG client is initialized with a valid configuration

  Scenario: Reject asset creation with missing content
    When I attempt to create an asset with null content
    Then the operation should fail with a validation error containing "content"

  Scenario: Reject asset creation with invalid content format
    Given I have content that is neither JSON-LD nor N-Quads
    When I attempt to create an asset with the invalid content
    Then the operation should fail with error "must be either a valid JSON-LD object or a N-Quads"

  Scenario: Reject endpoint that does not start with http or ws
    When I attempt an operation with endpoint "ftp://invalid"
    Then the operation should fail with error "should start with either"

  Scenario: Reject missing port
    When I attempt an operation with a null port
    Then the operation should fail with error "port is missing"

  Scenario: Reject missing epochs number
    When I attempt to validate a null epochs number
    Then the operation should fail with error "epochsNum is missing"

  Scenario: Reject invalid content type
    When I attempt to get an asset with content type "invalid_type"
    Then the operation should fail with error "Invalid content visibility"

  Scenario: Reject invalid query type
    When I attempt a graph query with query type "INVALID"
    Then the operation should fail with error "Invalid query Type"

  Scenario: Validate address format
    When I attempt to transfer an asset to an invalid address
    Then the operation should fail with error "Wrong address format"

  Scenario: Reject negative state index
    When I attempt to validate a negative state index
    Then the operation should fail with error "Invalid state index"

  Scenario: Reject invalid nodes access policy
    When I attempt to create a paranet with nodes access policy 5
    Then the operation should fail with error "Invalid nodes access policy"

  Scenario: Reject invalid miners access policy
    When I attempt to create a paranet with miners access policy 5
    Then the operation should fail with error "Invalid miners access policy"

  Scenario: Reject operator reward percentage over 10000
    When I attempt to validate operator reward percentage of 15000
    Then the operation should fail with error "Invalid percentage value for operator reward"

  Scenario: Reject incentivization voter reward percentage over 10000
    When I attempt to validate voter reward percentage of 15000
    Then the operation should fail with error "Invalid percentage value for incentivization"
