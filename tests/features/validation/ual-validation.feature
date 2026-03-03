@smoke
Feature: UAL Validation and Resolution
  As a developer using dkg.js
  I want UALs to be properly validated and resolved
  So that asset operations target the correct resources

  Scenario: Validate a well-formed KC UAL
    Given a UAL "did:dkg:hardhat1:31337/0x1234567890abcdef1234567890abcdef12345678/1"
    When I validate the UAL
    Then the UAL should be valid

  Scenario: Validate a well-formed KA UAL
    Given a UAL "did:dkg:hardhat1:31337/0x1234567890abcdef1234567890abcdef12345678/1/2"
    When I validate the UAL
    Then the UAL should be valid

  Scenario: Reject a UAL with too few segments
    Given a UAL "did:dkg:hardhat1:31337/0x1234"
    When I attempt to validate the UAL
    Then the UAL validation should fail with "Invalid UAL"

  Scenario: Reject a null UAL
    When I attempt to validate a null UAL
    Then the UAL validation should fail with "UAL is missing"

  Scenario: Reject a numeric UAL
    When I attempt to validate a numeric UAL
    Then the UAL validation should fail with "must be of type"

  Scenario: Resolve a KC UAL into components
    Given a UAL "did:dkg:hardhat1:31337/0xabcdef1234567890abcdef1234567890abcdef12/42"
    When I resolve the UAL
    Then the blockchain should be "hardhat1:31337"
    And the contract should be "0xabcdef1234567890abcdef1234567890abcdef12"
    And the KC token ID should be 42

  Scenario: Resolve a KA UAL into components
    Given a UAL "did:dkg:hardhat1:31337/0xabcdef1234567890abcdef1234567890abcdef12/42/7"
    When I resolve the UAL
    Then the KC token ID should be 42
    And the KA token ID should be 7

  Scenario: Derive a UAL from components
    When I derive a UAL from blockchain "hardhat1:31337", contract "0xAbCdEf", and KC token ID 10
    Then the derived UAL should be "did:dkg:hardhat1:31337/0xabcdef/10"

  Scenario: Derive a KA UAL from components
    When I derive a UAL from blockchain "hardhat1:31337", contract "0xAbCdEf", KC token ID 10, and KA token ID 3
    Then the derived UAL should be "did:dkg:hardhat1:31337/0xabcdef/10/3"
