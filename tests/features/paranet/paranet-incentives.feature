Feature: Paranet Incentives
  As a Paranet operator using dkg.js
  I want to manage incentives contracts and claim rewards
  So that participants are properly incentivized

  Background:
    Given the DKG client is initialized with a valid configuration
    And the blockchain service is mocked

  Scenario: Get all incentives pools for a Paranet
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I get all incentives pools
    Then I should receive a list of incentives pools

  Scenario: Claim miner reward
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I claim a miner reward of 100
    Then the reward claim should succeed

  Scenario: Claim voter reward
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I claim a voter reward
    Then the reward claim should succeed

  Scenario: Claim operator reward
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I claim an operator reward
    Then the reward claim should succeed

  Scenario: Get claimable miner reward
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I get the claimable miner reward
    Then I should receive a reward value

  Scenario: Get claimable voter reward
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I get the claimable voter reward
    Then I should receive a reward value

  Scenario: Get claimable operator reward
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I get the claimable operator reward
    Then I should receive a reward value

  Scenario: Get claimable all miners reward
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I get the claimable all miners reward
    Then I should receive a reward value

  Scenario: Get claimable all voters reward
    Given a Paranet UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/1/1"
    When I get the claimable all voters reward
    Then I should receive a reward value
