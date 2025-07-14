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
    
    // Try to get blockchain_id from file content (array or object)
    let blockchainIdFromContent = null;
    if (Array.isArray(errors) && errors.length > 0 && errors[0].blockchain_id) {
        blockchainIdFromContent = errors[0].blockchain_id;
    } else if (!Array.isArray(errors)) {
        // For old object format, try to find a blockchain_id property at the top level
        if (errors.blockchain_id) {
            blockchainIdFromContent = errors.blockchain_id;
        }
    }

    // Determine isMainnet from blockchain_id if present, otherwise fallback to filename
    let isMainnet = false;
    if (blockchainIdFromContent) {
        isMainnet = (
            blockchainIdFromContent === 'base:8453' ||
            blockchainIdFromContent === 'gnosis:100' ||
            blockchainIdFromContent === 'neuroweb:2043'
        );
    } else if (file.toLowerCase().includes('mainnet')) {
        isMainnet = true;
    } else if (file.toLowerCase().includes('testnet')) {
        isMainnet = false;
    }

    const tableName = isMainnet ? 'error_messages_mainnet_js' : 'error_messages_testnet_js';
    const dbHost = isMainnet ? process.env.DB_HOST_PUBLISH_MAINNET : process.env.DB_HOST_PUBLISH_TESTNET;

    // Determine blockchain_id to use
    let blockchainId;
    if (blockchainIdFromContent) {
        blockchainId = blockchainIdFromContent;
    } else if (file.toLowerCase().includes('base')) {
        blockchainId = isMainnet ? 'base:8453' : 'base:84531';
    } else if (file.toLowerCase().includes('gnosis')) {
        blockchainId = isMainnet ? 'gnosis:100' : 'gnosis:10200';
    } else {
        // Default to neuroweb
        blockchainId = isMainnet ? 'neuroweb:2043' : 'neuroweb:20432';
    }

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

    let insertedCount = 0;

    if (Array.isArray(errors)) {
        for (const attempt of errors) {
            const row = {
                node_name: nodeName,
                blockchain_id: blockchainId,
                ka_label: attempt.ka_label || 'Unknown KA',
                publish_error: attempt.publish_error || null,
                query_error: attempt.query_error || null,
                publisher_get_error: attempt.publisher_get_error || null,
                non_publisher_get_error: attempt.non_publisher_get_error || null,
                time_stamp: new Date().toISOString(),
            };

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
                insertedCount++;
            } catch (err) {
                console.error(`❌ Failed to insert KA ${row.ka_label}:`, err.message);
            }
        }
    } else {
        // fallback to old logic if needed
        for (const [errorMsg, count] of Object.entries(errors)) {
            // Extract KA number (e.g., "KA #5") from the error message
            let kaNumber = null;
            const kaMatch = errorMsg.match(/KA\s*#?(\d+)/i);
            if (kaMatch) {
                kaNumber = `KA #${kaMatch[1]}`;
            } else {
                kaNumber = 'Unknown KA';
            }

            for (let i = 0; i < count; i++) {
                const row = {
                    node_name: nodeName,
                    blockchain_id: blockchainId,
                    ka_label: kaNumber, // Only the KA number
                    publish_error: null,
                    query_error: null,
                    publisher_get_error: null,
                    non_publisher_get_error: null,
                    time_stamp: new Date().toISOString(),
                };

                // Put the full error message in the correct error field
                if (errorMsg.toLowerCase().includes('publish')) row.publish_error = errorMsg;
                else if (errorMsg.toLowerCase().includes('query')) row.query_error = errorMsg;
                else if (errorMsg.toLowerCase().includes('local get')) row.publisher_get_error = errorMsg;
                else if (errorMsg.toLowerCase().includes('get')) row.non_publisher_get_error = errorMsg;

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
                    insertedCount++;
                } catch (err) {
                    console.error(`❌ Failed to insert KA ${row.ka_label}:`, err.message);
                }
            }
        }
    }

    console.log(`✅ Inserted ${insertedCount} error records for ${nodeName} into ${tableName}`);

    try {
        await db.end();
        console.log('✅ DB connection closed');
    } catch (err) {
        console.error('❌ Failed to close DB connection:', err.message);
    }
}