import fs from 'fs';
import mysql from 'mysql2/promise';
import 'dotenv/config';

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

console.log('✅ Connected to DB');

const files = process.argv.slice(2);

for (const file of files) {
    console.log(`Processing ${file}`);
    const raw = fs.readFileSync(file, 'utf8');
    const summary = JSON.parse(raw);

    const query = `
        INSERT INTO your_table_name (
            blockchain_name, node_name,
            publish_success_rate, query_success_rate,
            publisher_get_success_rate, non_publisher_get_success_rate,
            average_publish_time, average_query_time,
            average_publisher_get_time, average_non_publisher_get_time,
            time_stamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(query, [
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
        summary.time_stamp
    ]);

    console.log(`✅ Inserted ${file} into DB`);
}

await db.end();
console.log('✅ DB connection closed');