'use strict';

/**
 * @constant {number} MAX_FILE_SIZE
 * - Max file size for publish
 */

const BLOCKCHAIN_IDS = {
    HARDHAT_1: 'hardhat1:31337',
    HARDHAT_2: 'hardhat2:31337',
    BASE_TESTNET: 'base:84532',
    GNOSIS_TESTNET: 'gnosis:10200',
    NEUROWEB_TESTNET: 'otp:20430',
    BASE_MAINNET: 'base:8453',
    GNOSIS_MAINNET: 'gnosis:100',
    NEUROWEB_MAINNET: 'otp:2043',
};

[
    BLOCKCHAIN_IDS.NEUROWEB_TESTNET,
    BLOCKCHAIN_IDS.NEUROWEB_MAINNET,
    BLOCKCHAIN_IDS.HARDHAT_1,
    BLOCKCHAIN_IDS.HARDHAT_2,
];

exports.BLOCKCHAIN_IDS = BLOCKCHAIN_IDS;
