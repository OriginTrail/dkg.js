/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
import Web3 from 'web3';
import { TRANSACTION_RETRY_ERRORS, WEBSOCKET_PROVIDER_OPTIONS } from '../../../constants/constants.js';
import BlockchainServiceBase from '../blockchain-service-base.js';

export default class NodeBlockchainService extends BlockchainServiceBase {
    constructor(config = {}) {
        super(config);
        this.config = config;
        this.events = {};
        this.receiptPollingIntervalMs = config.receiptPollingIntervalMs || 1000;
        this.rpcRateLimitRps = config.rpcRateLimitRps || 200;
        this.nonceLocks = new Map(); // per-address mutex to avoid nonce collisions
        this.nextNonces = new Map(); // per-address pending nonce cache

        this.abis.KnowledgeCollectionStorage.filter((obj) => obj.type === 'event').forEach(
            (event) => {
                const concatInputs = event.inputs.map((input) => input.internalType);

                this.events[event.name] = {
                    hash: Web3.utils.keccak256(`${event.name}(${concatInputs})`),
                    inputs: event.inputs,
                };
            },
        );
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

        this._wrapProviderRateLimit(this[blockchainName].web3);
        this._wrapProviderReceiptThrottle(this[blockchainName].web3);
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

    _wrapProviderReceiptThrottle(web3Instance) {
        const provider = web3Instance?.currentProvider;
        if (!provider || provider._dkgReceiptThrottleWrapped) return;

        const baseInterval = Math.max(0, this.receiptPollingIntervalMs || 1000);
        let lastCallTs = 0;
        const queue = [];
        let processing = false;

        const originalSend =
            provider.send?.bind(provider) ??
            provider.sendAsync?.bind(provider) ??
            provider.request?.bind(provider);

        if (!originalSend) return;

        const schedule = () => {
            if (processing || queue.length === 0) return;
            const now = Date.now();
            const elapsed = now - lastCallTs;
            if (elapsed < baseInterval) {
                const jitter = Math.floor(baseInterval * Math.random() * 0.3); // up to +30% jitter
                setTimeout(schedule, baseInterval - elapsed + jitter);
                return;
            }

            processing = true;
            const { payload, callback } = queue.shift();
            lastCallTs = Date.now();
            originalSend(payload, (err, result) => {
                processing = false;
                callback(err, result);
                const jitter = Math.floor(baseInterval * Math.random() * 0.3);
                setTimeout(schedule, baseInterval + jitter);
            });
        };

        const handler = (payload, callback) => {
            if (payload?.method === 'eth_getTransactionReceipt') {
                queue.push({ payload, callback });
                schedule();
                return;
            }
            originalSend(payload, callback);
        };

        provider.send = handler;
        if (provider.sendAsync) {
            provider.sendAsync = handler;
        }
        provider._dkgReceiptThrottleWrapped = true;
    }

    _wrapProviderRateLimit(web3Instance) {
        const provider = web3Instance?.currentProvider;
        if (!provider || provider._dkgRpcLimitWrapped || !this.rpcRateLimitRps) return;

        const minInterval = Math.max(1, Math.floor(1000 / this.rpcRateLimitRps));
        let lastCallTs = 0;
        let processing = false;
        const queue = [];

        const originalSend =
            provider.send?.bind(provider) ??
            provider.sendAsync?.bind(provider) ??
            provider.request?.bind(provider);

        if (!originalSend) return;

        const schedule = () => {
            if (processing || queue.length === 0) return;
            const now = Date.now();
            const elapsed = now - lastCallTs;
            const jitter = Math.floor(minInterval * Math.random() * 0.3); // up to +30% jitter
            const wait = elapsed >= minInterval ? jitter : minInterval - elapsed + jitter;

            processing = true;
            setTimeout(() => {
                const { payload, callback } = queue.shift();
                originalSend(payload, (err, result) => {
                    lastCallTs = Date.now();
                    processing = false;
                    callback(err, result);
                    schedule();
                });
            }, wait);
        };

        const handler = (payload, callback) => {
            queue.push({ payload, callback });
            schedule();
        };

        provider.send = handler;
        if (provider.sendAsync) {
            provider.sendAsync = handler;
        }
        provider._dkgRpcLimitWrapped = true;
    }

    async _acquireLock(address) {
        const lock = this.nonceLocks.get(address) || Promise.resolve();
        let release;
        const nextLock = new Promise((resolve) => {
            release = resolve;
        });
        this.nonceLocks.set(address, lock.then(() => nextLock));
        await lock;
        return release;
    }

    async _allocateNonce(web3Instance, address) {
        const pending = this.nextNonces.get(address);
        if (pending == null) {
            const current = await web3Instance.eth.getTransactionCount(address, 'pending');
            this.nextNonces.set(address, current + 1);
            return current;
        }
        this.nextNonces.set(address, pending + 1);
        return pending;
    }

    async executeContractFunction(contractName, functionName, args, blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);
        let contractInstance = await this.getContractInstance(contractName, blockchain);

        let receipt;
        let previousTxGasPrice;
        let simulationSucceeded = false;
        let transactionRetried = false;
        const startTime = Date.now();
        const maxWaitTime = 300_000; // 5 minutes total timeout

        const fromAddress = blockchain.publicKey?.toLowerCase?.() ?? blockchain.publicKey;
        const release = await this._acquireLock(fromAddress);

        try {
            while (receipt === undefined) {
                // Check for timeout
                if (Date.now() - startTime >= maxWaitTime) {
                    throw new Error(
                        `Timeout: Blockchain transaction receipt not received within maximum wait time (5 minutes)`
                    );
                }

                try {
                    const tx = await this.prepareTransaction(
                        contractInstance,
                        functionName,
                        args,
                        blockchain,
                    );
                    previousTxGasPrice = tx.gasPrice;
                    simulationSucceeded = true;
                    tx.nonce = await this._allocateNonce(web3Instance, fromAddress);

                    const createdTransaction = await web3Instance.eth.accounts.signTransaction(
                        tx,
                        blockchain.privateKey,
                    );

                    receipt = await web3Instance.eth.sendSignedTransaction(
                        createdTransaction.rawTransaction,
                    );
                    if (blockchain.name.startsWith('otp') && blockchain.waitNeurowebTxFinalization) {
                        receipt = await this.waitForTransactionFinalization(receipt, blockchain);
                    }
                } catch (error) {
                    if (
                        simulationSucceeded &&
                        !transactionRetried &&
                        blockchain.handleNotMinedError &&
                        TRANSACTION_RETRY_ERRORS.some((errorMsg) =>
                            error.message.toLowerCase().includes(errorMsg),
                        )
                    ) {
                        transactionRetried = true;
                        blockchain.retryTx = true;
                        blockchain.previousTxGasPrice = previousTxGasPrice;
                    } else if (!transactionRetried && /revert|VM Exception/i.test(error.message)) {
                        let status;
                        try {
                            status = await contractInstance.methods.status().call();
                        } catch (_) {
                            status = false;
                        }

                        if (!status && contractName !== 'ParanetIncentivesPool') {
                            await this.updateContractInstance(contractName, blockchain, true);
                            contractInstance = await this.getContractInstance(
                                contractName,
                                blockchain,
                            );
                            transactionRetried = true;
                            blockchain.retryTx = true;
                        } else {
                            throw error;
                        }
                    } else {
                        throw error;
                    }
                }
            }
        } finally {
            release();
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
