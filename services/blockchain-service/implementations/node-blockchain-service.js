/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
import Web3 from 'web3';
import {
    TRANSACTION_RETRY_ERRORS,
    TRANSIENT_EXECUTION_ERRORS,
    WEBSOCKET_PROVIDER_OPTIONS,
} from '../../../constants/constants.js';
import BlockchainServiceBase from '../blockchain-service-base.js';

export default class NodeBlockchainService extends BlockchainServiceBase {
    constructor(config = {}) {
        super(config);
        this.config = config;
        this.events = {};

        this.abis.KnowledgeCollectionStorage.filter((obj) => obj.type === 'event').forEach(
            (event) => {
                const concatInputs = event.inputs.map((input) => input.internalType);

                this.events[event.name] = {
                    hash: Web3.utils.keccak256(`${event.name}(${concatInputs})`),
                    inputs: event.inputs,
                };
            },
        );

        this.nextNonces = new Map();
    }

    initializeWeb3(blockchainName, blockchainRpc, blockchainOptions) {
        if (blockchainRpc.startsWith('ws')) {
            const provider = new Web3.providers.WebsocketProvider(
                blockchainRpc,
                WEBSOCKET_PROVIDER_OPTIONS,
            );

            this[blockchainName].web3 = new Web3(provider);
        } else {
            this[blockchainName].web3 = new Web3(blockchainRpc);
        }

        if (blockchainOptions.transactionPollingTimeout) {
            this[blockchainName].web3.eth.transactionPollingTimeout =
                blockchainOptions.transactionPollingTimeout;
        }
    }

    async decodeEventLogs(receipt, eventName, blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);
        let result;
        const { hash, inputs } = this.events[eventName];

        for (const log of receipt.logs) {
            if (log.topics && log.topics.length > 0 && log.topics[0] === hash) {
                result = web3Instance.eth.abi.decodeLog(inputs, log.data, log.topics.slice(1));
                break;
            }
        }
        return result;
    }

    async getPublicKey(blockchain) {
        return blockchain?.publicKey;
    }

    async allocateNonce(blockchain) {
        const address = (await this.getPublicKey(blockchain))?.toLowerCase();
        if (!address) throw new Error('Missing public key for nonce allocation');

        if (!this.nextNonces.has(address)) {
            const web3Instance = await this.getWeb3Instance(blockchain);
            // Seed the local nonce tracker from the pending nonce to avoid collisions across sequential txs.
            const startingNonce = await web3Instance.eth.getTransactionCount(address, 'pending');
            this.nextNonces.set(address, startingNonce);
        }

        const nonce = this.nextNonces.get(address);
        // Increment locally so concurrent sends reuse the monotonic nonce without extra RPC calls.
        this.nextNonces.set(address, nonce + 1);
        return nonce;
    }

    async executeContractFunction(contractName, functionName, args, blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);
        let contractInstance = await this.getContractInstance(contractName, blockchain);

        const MAX_TX_RETRIES = 5;
        let retryCount = 0;
        let receipt;
        let lastSentGasPrice;
        let lastTxHash;
        let simulationSucceeded = false;
        let contractRetried = false;

        while (receipt == null) {
            try {
                const tx = await this.prepareTransaction(
                    contractInstance,
                    functionName,
                    args,
                    blockchain,
                );
                const nonce = await this.allocateNonce(blockchain);
                lastSentGasPrice = tx.gasPrice ?? tx.maxFeePerGas;
                simulationSucceeded = true;

                const createdTransaction = await web3Instance.eth.accounts.signTransaction(
                    { ...tx, nonce },
                    blockchain.privateKey,
                );
                lastTxHash = createdTransaction.transactionHash;

                receipt = await web3Instance.eth.sendSignedTransaction(
                    createdTransaction.rawTransaction,
                );

                if (receipt == null) {
                    continue;
                }

                const actualGasPrice =
                    receipt.effectiveGasPrice ?? receipt.gasPrice ?? lastSentGasPrice;
                lastSentGasPrice = actualGasPrice;
                blockchain.previousTxGasPrice = actualGasPrice;

                if (blockchain.name.startsWith('otp') && blockchain.waitNeurowebTxFinalization) {
                    receipt = await this.waitForTransactionFinalization(receipt, blockchain);
                }
            } catch (error) {
                const errorMsg = (error.message || '').toLowerCase();
                const isTimeoutError =
                    errorMsg.includes('timeout exceeded') ||
                    errorMsg.includes('was not mined') ||
                    errorMsg.includes('not finalized') ||
                    errorMsg.includes('transaction finalization');

                if (simulationSucceeded && isTimeoutError && lastTxHash) {
                    try {
                        const existingReceipt =
                            await web3Instance.eth.getTransactionReceipt(lastTxHash);
                        if (existingReceipt) {
                            receipt = existingReceipt;
                            const actualGasPrice =
                                receipt.effectiveGasPrice ?? receipt.gasPrice ?? lastSentGasPrice;
                            blockchain.previousTxGasPrice = actualGasPrice;
                            continue;
                        }
                    } catch (_receiptCheckErr) {
                        // Receipt check failed; fall through to retry logic
                    }
                }

                if (
                    simulationSucceeded &&
                    isTimeoutError &&
                    retryCount < MAX_TX_RETRIES
                ) {
                    retryCount += 1;
                    blockchain.retryTx = true;
                    const previousGas = BigInt(lastSentGasPrice || 0);
                    lastSentGasPrice = (previousGas * 120n / 100n).toString();
                    blockchain.previousTxGasPrice = lastSentGasPrice;
                    blockchain.gasPrice = lastSentGasPrice;
                    continue;
                }

                if (
                    simulationSucceeded &&
                    !contractRetried &&
                    blockchain.handleNotMinedError &&
                    TRANSACTION_RETRY_ERRORS.some((retryErr) =>
                        errorMsg.includes(retryErr),
                    )
                ) {
                    contractRetried = true;
                    blockchain.retryTx = true;
                    blockchain.previousTxGasPrice = lastSentGasPrice;
                    continue;
                }

                const isPermanentRevert = /revert|vm exception/i.test(errorMsg);
                const isTransientError =
                    !isPermanentRevert &&
                    TRANSIENT_EXECUTION_ERRORS.some((te) => errorMsg.includes(te));
                if (isTransientError && retryCount < MAX_TX_RETRIES) {
                    retryCount += 1;
                    const baseDelay = Math.min(2000 * 2 ** (retryCount - 1), 30000);
                    const jitter = Math.floor(baseDelay * 0.3 * Math.random());
                    const delayMs = baseDelay + jitter;
                    // eslint-disable-next-line no-console
                    console.warn(
                        `[dkg.js] Transient error for ${functionName}: ${error.message}. ` +
                            `Retrying in ${delayMs}ms (${retryCount}/${MAX_TX_RETRIES})`,
                    );
                    const addr = (await this.getPublicKey(blockchain))?.toLowerCase();
                    if (addr) {
                        const freshNonce = await web3Instance.eth.getTransactionCount(
                            addr,
                            'pending',
                        );
                        this.nextNonces.set(addr, freshNonce);
                    }
                    await new Promise((r) => setTimeout(r, delayMs));
                    continue;
                }

                if (!contractRetried && /revert|VM Exception/i.test(error.message)) {
                    let status;
                    try {
                        status = await contractInstance.methods.status().call();
                    } catch (_) {
                        status = false;
                    }

                    if (!status && contractName !== 'ParanetIncentivesPool') {
                        await this.updateContractInstance(contractName, blockchain, true);
                        contractInstance = await this.getContractInstance(contractName, blockchain);
                        contractRetried = true;
                        blockchain.retryTx = true;
                        continue;
                    }
                }

                throw error;
            }
        }

        return receipt;
    }

    async transferAsset(tokenId, to, blockchain) {
        return this.executeContractFunction(
            'KnowledgeCollectionStorage',
            'safeTransferFrom',
            [blockchain.publicKey, to, tokenId, 1, '0x'],
            blockchain,
        );
    }
}
