import fs from 'fs';
import { Client } from 'pg';
import 'dotenv/config';

const db = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
});

try {
    await db.connect();
    console.log('✅ Connected to PostgreSQL DB');
} catch (err) {
    console.error('❌ Failed to connect to DB:', err.message);
    process.exit(1);
}

const files = process.argv.slice(2);

for (const file of files) {
    console.log(`Processing ${file}`);
    let summary;

    try {
        const raw = fs.readFileSync(file, 'utf8');
        summary = JSON.parse(raw);
    } catch (err) {
        console.error(`❌ Failed to read or parse ${file}:`, err.message);
        continue;
    }

    let tableName = 'publish_testnet_summary';
    if (summary.blockchain_name && summary.blockchain_name.toString().includes('MAINNET')) {
        tableName = 'publish_mainnet_summary';
    }

    try {
        const query = `
            INSERT INTO ${tableName} (
                blockchain_name, node_name,
                publish_success_rate, query_success_rate,
                publisher_get_success_rate, non_publisher_get_success_rate,
                average_publish_time, average_query_time,
                average_publisher_get_time, average_non_publisher_get_time,
                time_stamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;

        await db.query(query, [
            summary.blockchain_name,
            summary.node_name,
            summary.publish_success_rate,
            summary.query_success_rate,
            summary.publisher_get_success_rate,
            summary.non_publisher_get_success_rate,
            summary.average_publish_time,
            summary.average_query_time,
            summary.average_publisher_get_time,
            summary.average_non_publisher_get_time,
            summary.time_stamp,
        ]);

        console.log(`✅ Inserted ${file} into table '${tableName}'`);
    } catch (err) {
        console.error(`❌ Failed to insert ${file} into DB (table '${tableName}'):`, err.message);
        continue;
    }
}

try {
    await db.end();
    console.log('✅ DB connection closed');
} catch (err) {
    console.error('❌ Failed to close DB connection:', err.message);
}