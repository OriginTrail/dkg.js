Feature: Paranet Services
  As a Paranet operator using dkg.js
  I want to create and manage Paranet services
  So that I can extend my Paranet's functionality

  Background:
    Given the DKG client is initialized with a valid configuration
    And the blockchain service is mocked

  Scenario: Create a Paranet service
    Given a default service UAL
    When I create a Paranet service with name "TestService" and description "A test service"
    Then the service creation should succeed
    And the result should contain the service UAL

  Scenario: Add services to a Paranet
    Given a default Paranet UAL
    And service UALs to add
    When I add the services to the Paranet
    Then the service addition should succeed

  Scenario: Check if address is a knowledge miner
    Given a default Paranet UAL
    When I check if I am a knowledge miner
    Then I should receive a boolean result

  Scenario: Check if address is a Paranet operator
    Given a default Paranet UAL
    When I check if I am a Paranet operator
    Then I should receive a boolean result

  Scenario: Check if address is a proposal voter
    Given a default Paranet UAL
    When I check if I am a proposal voter
    Then I should receive a boolean result

  Scenario: Submit a Knowledge Collection to a Paranet
    Given a KC UAL "did:dkg:hardhat1:31337/0x5fbdb2315678afecb367f032d93f642f64180aa3/2"
    And a default Paranet UAL
    When I submit the KC to the Paranet
    Then the submission should succeed
