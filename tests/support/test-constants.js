export const TEST_CHAIN_ID = 31337;
export const TEST_CHAIN_NAME = 'hardhat1:31337';
export const TEST_ENDPOINT = 'http://localhost';
export const TEST_PORT = 8900;
export const TEST_RPC = 'http://localhost:8545';
export const DEFAULT_EPOCHS_NUM = 2;

export const MOCK_GAS_PRICE = '20000000000';
export const MOCK_BALANCES = {
    ethBalance: '10000000000000000000',
    tracBalance: '5000000000000000000000',
};

export const MOCK_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
export const MOCK_TX_HASH = '0x' + 'a'.repeat(64);

export const TEST_ADDRESSES = {
    owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    curator: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    miner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    secondary: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
};

export const SPARQL_QUERIES = {
    construct: 'CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o } LIMIT 10',
    select: 'SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10',
};

export const MOCK_SIGNATURE = {
    identityId: 1,
    r: '0x' + 'ab'.repeat(32),
    vs: '0x' + 'cd'.repeat(32),
};
