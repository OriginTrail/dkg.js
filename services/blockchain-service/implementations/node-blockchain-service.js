import Web3 from 'web3';
import axios from 'axios';
import Utilities from "../../utilities.js";
import {
    HOLDING_TIME_IN_YEARS,
    PUBLISH_TOKEN_AMOUNT,
    DEFAULT_PUBLISH_VISIBILITY,
    DEFAULT_BLOCKCHAIN,
    AVAILABLE_BLOCKCHAINS,
    VISIBILITY
} from "../../../constants.js";
import {AssetRegistryABI} from '../contracts/AssetRegistryABI.js';
import {HubABI} from '../contracts/HubABI.js';
import {ERC20TokenABI} from '../contracts/ERC20TokenABI.js';
import {ProfileABI} from '../contracts/ProfileABI.js';

class NodeBlockchainService {
    constructor(config) {
        this.config = config;
    }

    async createAsset(requestData, options) {
        this.blockchain = this.getBlockchain(options);
        this.web3 = new Web3(this.blockchain.rpc);
        await this.initializeContracts();
        await this.executeContractFunction(this.TokenContract, 'increaseAllowance', [
            this.AssetRegistryContract.options.address,
            options.tokenAmount
        ]);
        let receipt = await this.executeContractFunction(this.AssetRegistryContract, 'createAsset', requestData);
        const UAI = await this.getTransactionResponse(receipt);
    }

    generateCreateAssetRequest(assertion, assertionId, options) {
        try {
            const assertionSize = Utilities.getAssertionSizeInKb(assertion);
            const holdingTimeInYears = (options.holdingTimeInYears) ? options.holdingTimeInYears : HOLDING_TIME_IN_YEARS;
            const tokenAmount = (options.tokenAmount) ? options.tokenAmount : PUBLISH_TOKEN_AMOUNT;
            const visibility = (options.visibility) ? VISIBILITY[options.visibility] : DEFAULT_PUBLISH_VISIBILITY;
            return [assertionId, assertionSize, visibility, holdingTimeInYears, tokenAmount];
        } catch (e) {
            throw Error("Invalid request parameters.")
        }
    }

    async executeContractFunction(contractInstance, functionName, args) {
        let result;
        while (!result) {
            try {
                const gasLimit = await contractInstance.methods[functionName](...args).estimateGas({
                    from: this.blockchain.wallet,
                });

                const encodedABI = contractInstance.methods[functionName](...args).encodeABI();
                const tx = {
                    from: this.blockchain.wallet,
                    to: contractInstance.options.address,
                    data: encodedABI,
                    gasPrice: this.web3.utils.toWei('100', 'Gwei'),
                    gas: gasLimit || this.web3.utils.toWei('900', 'Kwei'),
                };

                const createdTransaction = await this.web3.eth.accounts.signTransaction(
                    tx,
                    this.blockchain.privateKey,
                );
                result = await this.web3.eth.sendSignedTransaction(
                    createdTransaction.rawTransaction,
                );
            } catch (error) {
                result = true;
                console.log(error, 'err');
                // await this.handleError(error, functionName);
            }
        }
        return result;
    }

    async callContractFunction(contractInstance, functionName, args) {
        let result;
        while (!result) {
            try {
                result = await contractInstance.methods[functionName](...args).call();
            } catch (error) {
                result = true;
                console.log(error, 'err');
                // await this.handleError(error, functionName);
            }
        }
        return result;
    }

    getBlockchain(options) {
        if (options.blockchain && this.blockchainIsAvailable(options)) {
            if (this.config.blockchainConfig[options.blockchain]) {
                return this.config.blockchainConfig[options.blockchain];
            }
            throw Error("Blockchain configuration is missing.")
        } else {
            if (this.config.blockchainConfig[this.config.blockchain]) {
                return this.config.blockchainConfig[this.config.blockchain];
            }
            throw Error("Blockchain configuration is missing.")
        }
    }

    blockchainIsAvailable(options) {
        return AVAILABLE_BLOCKCHAINS.find((b) => b === options.blockchain);
    }

    async initializeContracts() {
        this.hubContract = new this.web3.eth.Contract(HubABI, this.blockchain.hubContract);

        const assetRegistryAddress = await this.callContractFunction(
            this.hubContract,
            'getContractAddress',
            ['AssetRegistry'],
        );
        this.AssetRegistryContract = new this.web3.eth.Contract(AssetRegistryABI, assetRegistryAddress);

        const tokenAddress = await this.callContractFunction(
            this.hubContract,
            'getContractAddress',
            ['Token'],
        );
        this.TokenContract = new this.web3.eth.Contract(ERC20TokenABI, tokenAddress);
    }

    async getTransactionResponse(receipt) {

        receipt.logs.forEach((row, index) => {

            console.log(row.topics);

            // try {
            //     let item = this.web3.eth.abi.decodeLog([
            //             {
            //                 "internalType": "uint256",
            //                 "name": "_UAI",
            //                 "type": "uint256"
            //             }
            //         ],
            //         row.data,
            //         row.topics
            //     );
            //     console.log(item, 'item')
            // } catch (e) {
            //     console.error(e);
            // }
        })

        // receipt.logs.forEach((row, index) => {
        //     try {
        //         const typesArray = [
        //             {
        //                 "internalType": "uint256",
        //                 "name": "_UAI",
        //                 "type": "uint256"
        //             }
        //         ];
        //         const data = row.data;
        //         const decodedParameters = this.web3.eth.abi.decodeParameters(typesArray, data);
        //         console.log(JSON.stringify(decodedParameters, null, 4));
        //     } catch (e) {
        //         console.error(e)
        //     }
        // })

        return "0x0000000000000000000000000000000000000000000000000000000000000006";
    }
}

export {NodeBlockchainService};
