/* eslint-disable no-await-in-loop */
import Web3 from 'web3';
import BlockchainServiceBase from '../blockchain-service-base.js';
import { WEBSOCKET_PROVIDER_OPTIONS } from '../../../constants/constants.js';

export default class BrowserBlockchainService extends BlockchainServiceBase {
    constructor(config = {}) {
        super(config);
        this.config = config;
    }

    async initializeWeb3(blockchainName, blockchainRpc) {
        if (typeof window.web3 === 'undefined' || !window.web3) {
            // eslint-disable-next-line no-console
            console.error(
                'No web3 implementation injected, please inject your own Web3 implementation.',
            );
        }
        if (window.ethereum) {
            this[blockchainName].web3 = new Web3(window.ethereum);

            try {
                // Request account access if needed
                await window.ethereum.enable();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
        } else if (blockchainRpc.startsWith('ws')) {
            const provider = new Web3().providers.WebsocketProvider(
                blockchainRpc,
                WEBSOCKET_PROVIDER_OPTIONS,
            );
            this[blockchainName].web3 = new Web3(provider);
        } else {
            this[blockchainName].web3 = new Web3(blockchainRpc);
        }
    }

    async decodeEventLogs(receipt, eventName, blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        const web3Instance = await this.getWeb3Instance(blockchain);
        let result;
        const { hash, inputs } = this.events[eventName];

        const logs = Object.values(receipt.events);
        for (const log of logs) {
            if (log.raw.topics && log.raw.topics.length > 0 && log.raw.topics[0] === hash) {
                result = web3Instance.eth.abi.decodeLog(
                    inputs,
                    log.raw.data,
                    log.raw.topics.slice(1),
                );
                break;
            }
        }
        return result;
    }

    async executeContractFunction(contractName, functionName, args, blockchain) {
        await this.ensureBlockchainInfo(blockchain);
        let contractInstance = await this.getContractInstance(contractName, blockchain);
        let tx;

        try {
            tx = await this.prepareTransaction(contractInstance, functionName, args, blockchain);

            // Log transaction details before sending
            console.log('\n======================== SENDING TRANSACTION ========================');
            console.log('Contract:', contractName);
            console.log('Function:', functionName);
            console.log('Contract Address:', contractInstance.options.address);
            console.log('Blockchain:', blockchain.name);
            console.log('From:', tx.from);
            console.log('To:', tx.to);
            console.log('Gas Limit:', tx.gas);
            console.log(
                'Gas Price:',
                tx.gasPrice,
                `(${Web3.utils.fromWei(tx.gasPrice.toString(), 'Gwei')} Gwei)`,
            );

            // Log function arguments with parameter names
            try {
                const methodAbi = contractInstance.options.jsonInterface.find(
                    (item) => item.name === functionName && item.type === 'function',
                );
                if (methodAbi && methodAbi.inputs) {
                    console.log('Function Arguments:');
                    methodAbi.inputs.forEach((input, index) => {
                        const value = args[index];
                        const displayValue =
                            typeof value === 'bigint'
                                ? value.toString()
                                : Array.isArray(value)
                                ? `[${value.length} items]`
                                : value;
                        console.log(`  ${input.name} (${input.type}):`, displayValue);
                    });
                } else {
                    console.log(
                        'Function Arguments:',
                        JSON.stringify(
                            args,
                            (key, value) => (typeof value === 'bigint' ? value.toString() : value),
                            2,
                        ),
                    );
                }
            } catch (err) {
                console.log(
                    'Function Arguments:',
                    JSON.stringify(
                        args,
                        (key, value) => (typeof value === 'bigint' ? value.toString() : value),
                        2,
                    ),
                );
            }

            console.log('Encoded Data:', tx.data);
            console.log('=====================================================================\n');

            let receipt = await contractInstance.methods[functionName](...args).send(tx);

            // Log transaction receipt
            console.log('\n===================== TRANSACTION SUCCESSFUL ========================');
            console.log('Transaction Hash:', receipt.transactionHash);
            console.log('Block Number:', receipt.blockNumber);
            console.log('Gas Used:', receipt.gasUsed);
            console.log('Status:', receipt.status ? 'Success' : 'Failed');
            console.log('=====================================================================\n');

            if (blockchain.name.startsWith('otp') && blockchain.waitNeurowebTxFinalization) {
                receipt = await this.waitForTransactionFinalization(receipt, blockchain);
            }
            return receipt;
        } catch (error) {
            console.log('\n======================= TRANSACTION ERROR ===========================');
            console.log('Contract:', contractName);
            console.log('Function:', functionName);
            console.log('Error Type:', error.constructor.name);
            console.log('Error Message:', error.message);

            // Log revert reason if available
            if (error.reason) {
                console.log('Revert Reason:', error.reason);
            }

            // Log error code if available
            if (error.code) {
                console.log('Error Code:', error.code);
            }

            // Log transaction hash if it exists (for mined but reverted transactions)
            if (error.receipt?.transactionHash) {
                console.log('Transaction Hash:', error.receipt.transactionHash);
                console.log('Block Number:', error.receipt.blockNumber);
                console.log('Gas Used:', error.receipt.gasUsed);
            }

            // Log inner error if available
            if (error.innerError) {
                console.log('Inner Error:', error.innerError.message || error.innerError);
            }

            // Log error data if available (can contain revert data)
            if (error.data) {
                console.log(
                    'Error Data:',
                    typeof error.data === 'string' ? error.data : JSON.stringify(error.data),
                );
            }

            // Log full stack trace for debugging
            if (error.stack) {
                console.log('\nStack Trace:');
                console.log(error.stack);
            }

            console.log('=====================================================================\n');

            if (/revert|VM Exception/i.test(error.message)) {
                let status;
                try {
                    status = await contractInstance.methods.status().call();
                } catch (_) {
                    status = false;
                }

                if (!status) {
                    console.log(
                        'Contract status check failed. Updating contract instance and retrying...\n',
                    );
                    await this.updateContractInstance(contractName, blockchain, true);
                    contractInstance = await this.getContractInstance(contractName, blockchain);
                    const web3Instance = await this.getWeb3Instance(blockchain);

                    await web3Instance.eth.call({
                        to: contractInstance.options.address,
                        data: tx.data,
                        from: tx.from,
                    });

                    // Log retry transaction
                    console.log(
                        '\n===================== RETRYING TRANSACTION ==========================',
                    );
                    console.log('Contract:', contractName);
                    console.log('Function:', functionName);
                    console.log('New Contract Address:', contractInstance.options.address);
                    console.log(
                        '=====================================================================\n',
                    );

                    const retryReceipt = await contractInstance.methods[functionName](...args).send(
                        tx,
                    );

                    // Log retry transaction receipt
                    console.log(
                        '\n===================== RETRY TRANSACTION SUCCESSFUL ==================',
                    );
                    console.log('Transaction Hash:', retryReceipt.transactionHash);
                    console.log('Block Number:', retryReceipt.blockNumber);
                    console.log('Gas Used:', retryReceipt.gasUsed);
                    console.log('Status:', retryReceipt.status ? 'Success' : 'Failed');
                    console.log(
                        '=====================================================================\n',
                    );

                    return retryReceipt;
                }
            }

            throw error;
        }
    }

    async getPublicKey() {
        return this.getAccount();
    }

    async getAccount() {
        if (!this.account) {
            if (!window.ethereum) {
                throw Error('This operation can be performed only by using Metamask accounts.');
            }
            const accounts = await window.ethereum
                .request({
                    method: 'eth_requestAccounts',
                })
                // eslint-disable-next-line no-console
                .catch(() => console.error('There was an error fetching your accounts'));

            [this.account] = accounts;
        }
        return this.account;
    }

    async transferAsset(tokenId, to, blockchain) {
        return this.executeContractFunction(
            'KnowledgeCollectionStorage',
            'safeTransferFrom',
            [await this.getAccount(), to, tokenId, 1, '0x'],
            blockchain,
        );
    }
}
