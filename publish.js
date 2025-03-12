require('dotenv').config();
const { setTimeout } = require('timers/promises');
const OTNode = require('./src/apis/OTNode');
const { getRandomEndpoints, getRandomV8TestnetEndpoints } = require('./src/util/Endpoint');
const walletsV8TestnetBase = require('./walletsV8TestnetBase.json');
const Logger = require('./src/util/logger');
const { randomUUID } = require('crypto');
const DKG = require('dkg.js');

const CONCURRENCY = 25;
const logger = new Logger('trace');
const otnode = new OTNode(logger);
const MAX_PUBLISHINGS = 100000;
const PUBLISH_INTERVAL_V8_TESTNET = 5 * 60 * 1000;
const psychohistory =
    "Psychohistory Psychohistory is a fictional science in Isaac Asimov's Foundation universe which combines history, sociology, and mathematical statistics to make general predictions about the future behavior of very large groups of people, such as the Galactic Empire. It was first introduced in the four short stories (1942–1944) which would later be collected as the 1951 novel Foundation. Psychohistory depends on the idea that, while one cannot foresee the actions of a particular individual, the laws of statistics as applied to large groups of people could predict the general flow of future events. Asimov used the analogy of a gas: An observer has great difficulty in predicting the motion of a single molecule in a gas, but with the kinetic theory can predict the mass action of the gas to a high level of accuracy. Asimov applied this concept to the population of his fictional Galactic Empire, which numbered one quintilli>";
let counter = 0;

(async () => {
    publishParanetV8TestnetBase();
})();

async function runLoadTest(clientOption, index) {
    while (true) {
        const { wallet, endpoint } = clientOption;
        const blockchain = 'blockchainOTP';
        const loadTestId = randomUUID();
        logger.info(`Starting load test ${index} with id: ${loadTestId}...`);

        let identifier = Math.floor(Math.random() * 1e10);
        const publishResult = await otnode.publish(
            {
                public: {
                    '@context': 'https://schema.org',
                    '@id': `uuid:${identifier}`,
                    '@type': 'Person',
                    name: 'John Doe',
                },
                private: {
                    '@context': 'https://schema.org',
                    '@id': `uuid:${identifier}`,
                    bankAccount: `${identifier}`,
                },
            },
            endpoint,
            wallet,
            loadTestId,
            blockchain,
        );
        console.log(publishResult?.operation?.status);
        if (publishResult?.operation?.status === 'COMPLETED') {
            await otnode.get(publishResult.UAL, null, endpoint, wallet, loadTestId, blockchain);
        }

        await setTimeout(1 * 1000);
    }
}

async function publishV8TestnetBase() {
    const blockchain = 'V8TestnetBase';

    const publishPromises = walletsV8TestnetBase.map(async (wallet) => {
        while (true) {
            const v8TestnetEndpoints = getRandomV8TestnetEndpoints(1); // Get a new random endpoint for each wallet
            const endpoint = v8TestnetEndpoints[0];
            const loadTestId = randomUUID();
            logger.info(`Starting V8TestnetBase publishing with id: ${loadTestId}...`);

            let identifier = Math.floor(Math.random() * 1e10);
            const publishResult = await otnode.publish(
                {
                    public: {
                        '@context': 'https://schema.org',
                        '@id': `uuid:${identifier}`,
                        '@type': 'Person',
                        name: 'Jane Doe',
                    },
                    private: {
                        '@context': 'https://schema.org',
                        '@id': `uuid:${identifier}`,
                        bankAccount: `${identifier}`,
                    },
                },
                endpoint,
                wallet,
                loadTestId,
                blockchain,
            );
            if (publishResult?.operation?.publish?.status === 'COMPLETED') {
                await otnode.get(publishResult.UAL, null, endpoint, wallet, loadTestId, blockchain);
            }
        }
    });

    await Promise.all(publishPromises); // Start publishing in parallel for all wallets
    await setTimeout(300 * 1000); // 300 seconds (5 minutes)
}

async function publishParanetV8TestnetBase() {
    logger.info('Starting paranet publishing on V8 Base Testnet');
    const paranetUAL = 'did:dkg:base:84532/0xd5550173b0f7b8766ab2770e4ba86caf714a5af5/10469';

    const publishPromises = walletsV8TestnetBase.map(async (wallet) => {
        while (true) {
            const v8TestnetEndpoints = getRandomEndpoints(1); // Get a new random endpoint for each wallet
            const endpoint = v8TestnetEndpoints[0];
            let identifier = Math.floor(Math.random() * 1e10);

            const content = {
                public: {
                    '@context': 'https://schema.org',
                    '@id': `uuid:${identifier}`,
                    '@type': 'Person',
                    name: 'Jane Doe',
                },
                private: {
                    '@context': 'https://schema.org',
                    '@id': `uuid:${identifier}`,
                    bankAccount: `${identifier}`,
                },
            };

            const dkg = new DKG({
                environment: 'testnet',
                endpoint: endpoint,
                port: '8900',
                blockchain: {
                    name: 'base:84532',
                    publicKey: wallet.publicKey,
                    privateKey: wallet.privateKey,
                },
                maxNumberOfRetries: 30,
                frequency: 2,
                contentType: 'all',
                nodeApiVersion: '/v1',
            });

            const createCollectionResult = await dkg.asset.create(content, { epochsNum: 2 });
            logger.info(`Created collection: ${createCollectionResult.UAL}`);
            //logger.info(JSON.stringify(createCollectionResult, null, 2));
            const submitToParanetResult = await dkg.asset.submitToParanet(
                createCollectionResult.UAL,
                paranetUAL,
            );
            //logger.info(JSON.stringify(submitToParanetResult, null, 2));
            if (createCollectionResult?.operation?.publish?.status === 'COMPLETED') {
                await dkg.asset.get(createCollectionResult.UAL, {
                    paranetUAL,
                    contentType: 'all',
                });
            }
        }
    });

    await Promise.all(publishPromises); // Start publishing in parallel for all wallets
    await setTimeout(300 * 1000); // 300 seconds (5 minutes)
}

async function publishParanetV8TestnetBase() {
    logger.info('Starting paranet publishing on V8 Base Testnet');
    const paranetUAL = 'did:dkg:base:84532/0xd5550173b0f7b8766ab2770e4ba86caf714a5af5/10469';

    // Settings per wallet
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 10000; // 10 seconds initial retry delay

    async function processWalletContinuously(wallet) {
        while (true) {
            // Continuous processing for each wallet
            try {
                const v8TestnetEndpoints = getRandomEndpoints(1);
                const endpoint = v8TestnetEndpoints[0];
                let identifier = Math.floor(Math.random() * 1e10);

                const content = {
                    public: {
                        '@context': 'https://schema.org',
                        '@id': `uuid:${identifier}`,
                        '@type': 'Person',
                        name: 'Jane Doe',
                    },
                    private: {
                        '@context': 'https://schema.org',
                        '@id': `uuid:${identifier}`,
                        bankAccount: `${identifier}`,
                    },
                };

                // Create DKG instance for this wallet
                const dkg = new DKG({
                    environment: 'testnet',
                    endpoint: endpoint,
                    port: '8900',
                    blockchain: {
                        name: 'base:84532',
                        publicKey: wallet.publicKey,
                        privateKey: wallet.privateKey,
                    },
                    maxNumberOfRetries: 30,
                    frequency: 2,
                    contentType: 'all',
                    nodeApiVersion: '/v1',
                });

                let retries = 0;
                while (retries < MAX_RETRIES) {
                    try {
                        const createCollectionResult = await dkg.asset.create(content, {
                            epochsNum: 2,
                        });
                        logger.info(
                            `Wallet ${wallet.publicKey.slice(0, 8)}: Created collection: ${
                                createCollectionResult.UAL
                            }`,
                        );

                        // await setTimeout(2000); // Small delay between operations

                        const submitToParanetResult = await dkg.asset.submitToParanet(
                            createCollectionResult.UAL,
                            paranetUAL,
                        );

                        if (createCollectionResult?.operation?.publish?.status === 'COMPLETED') {
                            await dkg.asset.get(createCollectionResult.UAL, {
                                paranetUAL,
                                contentType: 'all',
                            });
                        }

                        // If successful, wait a bit before next iteration
                        // await setTimeout(5000); // 5 seconds between successful iterations
                        break; // Break retry loop on success
                    } catch (error) {
                        retries++;
                        if (
                            (error.message.includes('over rate limit') ||
                                error.message.includes('execution reverted')) &&
                            retries < MAX_RETRIES
                        ) {
                            logger.warn(
                                `Wallet ${wallet.publicKey.slice(
                                    0,
                                    8,
                                )}: Rate limit/execution error, retrying in ${
                                    RETRY_DELAY / 1000
                                } seconds... (Attempt ${retries}/${MAX_RETRIES})`,
                            );
                            await setTimeout(RETRY_DELAY);
                            continue;
                        }
                        throw error;
                    }
                }
            } catch (error) {
                logger.error(`Wallet ${wallet.publicKey.slice(0, 8)} error: ${error.message}`);
                await setTimeout(RETRY_DELAY); // Wait before retrying the whole process
            }
        }
    }

    // Start processing for all wallets in parallel
    const walletProcesses = walletsV8TestnetBase.map((wallet) => processWalletContinuously(wallet));

    // Wait for all processes (they run indefinitely)
    await Promise.all(walletProcesses);
}
