Feature: Paranet Permissioned Access
  As a Paranet operator using dkg.js
  I want to manage permissioned node and miner access
  So that I can control who participates in my Paranet

  Background:
    Given the DKG client is initialized with a valid configuration
    And the blockchain service is mocked

  Scenario: Add permissioned nodes to a Paranet
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    And a list of identity IDs [1, 2, 3]
    When I add permissioned nodes to the Paranet
    Then the operation should succeed

  Scenario: Remove permissioned nodes from a Paranet
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    And a list of identity IDs [1, 2]
    When I remove permissioned nodes from the Paranet
    Then the operation should succeed

  Scenario: Request permissioned node access
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I request permissioned node access
    Then the operation should succeed

  Scenario: Approve a permissioned node
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    And an identity ID of 1
    When I approve the permissioned node
    Then the operation should succeed

  Scenario: Reject a permissioned node
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    And an identity ID of 1
    When I reject the permissioned node
    Then the operation should succeed

  Scenario: Get permissioned nodes
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I get the permissioned nodes
    Then I should receive a list of nodes

  Scenario: Add permissioned miners
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    And a list of miner addresses
    When I add permissioned miners to the Paranet
    Then the operation should succeed

  Scenario: Remove permissioned miners
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    And a list of miner addresses
    When I remove permissioned miners from the Paranet
    Then the operation should succeed

  Scenario: Request permissioned miner access
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I request permissioned miner access
    Then the operation should succeed

  Scenario: Approve a permissioned miner
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    And a valid miner address
    When I approve the permissioned miner
    Then the operation should succeed

  Scenario: Reject a permissioned miner
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    And a valid miner address
    When I reject the permissioned miner
    Then the operation should succeed

  Scenario: Get knowledge miners
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I get the knowledge miners
    Then I should receive a list of miners
