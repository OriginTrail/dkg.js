import fs from 'fs';
import { Client } from 'pg';
import 'dotenv/config';

const files = process.argv.slice(2);

const networkConfig = {
    'base:true':     { blockchainId: 'base:8453',   tableName: 'error_messages_mainnet_js', dbHost: process.env.DB_HOST_PUBLISH_MAINNET },
    'base:false':    { blockchainId: 'base:84531',  tableName: 'error_messages_testnet_js', dbHost: process.env.DB_HOST_PUBLISH_TESTNET },
    'gnosis:true':   { blockchainId: 'gnosis:100',  tableName: 'error_messages_mainnet_js', dbHost: process.env.DB_HOST_PUBLISH_MAINNET },
    'gnosis:false':  { blockchainId: 'gnosis:10200',tableName: 'error_messages_testnet_js', dbHost: process.env.DB_HOST_PUBLISH_TESTNET },
    'neuroweb:true': { blockchainId: 'neuroweb:2043', tableName: 'error_messages_mainnet_js', dbHost: process.env.DB_HOST_PUBLISH_MAINNET },
    'neuroweb:false':{ blockchainId: 'neuroweb:20432',tableName: 'error_messages_testnet_js', dbHost: process.env.DB_HOST_PUBLISH_TESTNET },
};

for (const file of files) {
    console.log(`📁 Processing error file: ${file}`);
    let errors;

    try {
        const raw = fs.readFileSync(file, 'utf8');
        errors = JSON.parse(raw);
    } catch (err) {
        console.error(`❌ Failed to read or parse ${file}:`, err.message);
        continue;
    }

    const match = file.match(/errors_(Node_\d+)\.json/);
    if (!match) {
        console.error(`❌ Filename format incorrect for ${file}. Expected: errors_Node_XX.json`);
        continue;
    }

    const nodeName = match[1].replace('_', ' ');
    
    // Determine network from content like summary script does
    let isMainnet = false;
    
    // Look for blockchain_name in the error data structure
    // Since errors don't have blockchain_name, we'll need to infer from context
    // For now, let's assume testnet unless we can determine otherwise
    isMainnet = false; // Default to testnet
    
    // Try to determine from filename if it contains network info
    if (file.toLowerCase().includes('mainnet')) {
        isMainnet = true;
    } else if (file.toLowerCase().includes('testnet')) {
        isMainnet = false;
    }
    
    // Determine blockchain based on filename or default to neuroweb
    let blockchainId;
    if (file.toLowerCase().includes('base')) {
        blockchainId = isMainnet ? 'base:8453' : 'base:84531';
    } else if (file.toLowerCase().includes('gnosis')) {
        blockchainId = isMainnet ? 'gnosis:100' : 'gnosis:10200';
    } else {
        // Default to neuroweb
        blockchainId = isMainnet ? 'neuroweb:2043' : 'neuroweb:20432';
    }
    
    const tableName = isMainnet ? 'error_messages_mainnet_js' : 'error_messages_testnet_js';
    const dbHost = isMainnet ? process.env.DB_HOST_PUBLISH_MAINNET : process.env.DB_HOST_PUBLISH_TESTNET;

    const db = new Client({
        host: dbHost,
        user: process.env.DB_USER_PUBLISH,
        password: process.env.DB_PASSWORD_PUBLISH,
        database: process.env.DB_NAME_PUBLISH,
        port: 5432,
    });

    try {
        await db.connect();
        console.log(`✅ Connected to DB (${tableName})`);
    } catch (err) {
        console.error('❌ Failed to connect to DB:', err.message);
        continue;
    }

    for (const [kaLabel, details] of Object.entries(errors)) {
        const row = {
            node_name: nodeName,
            blockchain_id: blockchainId,
            ka_label: kaLabel,
            publish_error: null,
            query_error: null,
            publisher_get_error: null,
            non_publisher_get_error: null,
            time_stamp: new Date().toISOString(),
        };

        if (kaLabel.toLowerCase().includes('publish')) row.publish_error = kaLabel;
        else if (kaLabel.toLowerCase().includes('query')) row.query_error = kaLabel;
        else if (kaLabel.toLowerCase().includes('local get')) row.publisher_get_error = kaLabel;
        else if (kaLabel.toLowerCase().includes('get')) row.non_publisher_get_error = kaLabel;

        const insertQuery = `
            INSERT INTO ${tableName} (
                node_name, blockchain_id, ka_label,
                publish_error, query_error,
                publisher_get_error, non_publisher_get_error,
                time_stamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        try {
            await db.query(insertQuery, [
                row.node_name,
                row.blockchain_id,
                row.ka_label,
                row.publish_error,
                row.query_error,
                row.publisher_get_error,
                row.non_publisher_get_error,
                row.time_stamp
            ]);
            console.log(`✅ Inserted KA ${row.ka_label} for ${row.node_name}`);
        } catch (err) {
            console.error(`❌ Failed to insert KA ${row.ka_label}:`, err.message);
        }
    }

    try {
        await db.end();
        console.log('✅ DB connection closed');
    } catch (err) {
        console.error('❌ Failed to close DB connection:', err.message);
    }
}