Feature: Paranet Creation
  As a developer using dkg.js
  I want to create and manage Paranets
  So that I can organize knowledge collections into subnetworks

  Background:
    Given the DKG client is initialized with a valid configuration
    And the blockchain service is mocked

  Scenario: Successfully create a Paranet
    Given a valid KA UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I create a Paranet with name "TestParanet" and description "A test paranet"
    Then the Paranet creation should succeed
    And the result should contain the paranet UAL

  Scenario: Create a Paranet with permissioned node access
    Given a valid KA UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I create a Paranet with permissioned nodes access policy
    Then the Paranet creation should succeed

  Scenario: Fail to create Paranet without KA token ID
    Given a valid UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1"
    When I attempt to create a Paranet
    Then the operation should fail with error "Knowledge asset token id is required"

  Scenario: Fail to create Paranet without name
    Given a valid KA UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I attempt to create a Paranet without a name
    Then the operation should fail with error "paranetName is missing"

  Scenario: Check if Knowledge Collection is registered to Paranet
    Given a KC UAL and a Paranet UAL
    When I check if the KC is registered to the Paranet
    Then I should receive a boolean registration status
