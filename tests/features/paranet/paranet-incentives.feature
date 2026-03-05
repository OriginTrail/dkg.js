Feature: Paranet Incentives
  As a Paranet operator using dkg.js
  I want to manage incentives contracts and claim rewards
  So that participants are properly incentivized

  Background:
    Given the DKG client is initialized with a valid configuration
    And the blockchain service is mocked
    And a default Paranet UAL

  Scenario: Get all incentives pools for a Paranet
    When I get all incentives pools
    Then I should receive a list of incentives pools

  Scenario Outline: Claim a reward
    When I claim <reward_type>
    Then the reward claim should succeed

    Examples:
      | reward_type             |
      | a miner reward of 100  |
      | a voter reward          |
      | an operator reward      |

  Scenario Outline: Get claimable reward
    When I get <reward_query>
    Then I should receive a reward value

    Examples:
      | reward_query                    |
      | the claimable miner reward      |
      | the claimable voter reward      |
      | the claimable operator reward   |
      | the claimable all miners reward |
      | the claimable all voters reward |
