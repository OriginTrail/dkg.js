/**
 * Shared configuration for NeuroWeb network testing
 */

export const NEUROWEB_TESTNET = {
  name: 'NeuroWeb Testnet',
  rpcUrl: process.env.NEUROWEB_TESTNET_RPC || 'https://lofar-testnet.origin-trail.network',
  chainId: 20430,
  symbol: 'MNEURO'
};

export const NEUROWEB_MAINNET = {
  name: 'NeuroWeb',
  rpcUrl: 'https://astrosat-parachain-rpc.origin-trail.network',
  chainId: 2043,
  symbol: 'NEURO'
};

export const STAKING_DAPP_URL = 'https://staking.origintrail.io/';

// Hex chain IDs for assertions
export const TESTNET_CHAIN_ID_HEX = '0x4fce'; // 20430
export const MAINNET_CHAIN_ID_HEX = '0x7fb';  // 2043

