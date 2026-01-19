const { Client } = require('pg');
require('dotenv').config();

async function checkStructure() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log(`Connected to database: ${client.database}`);
        
        const res = await client.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
            ORDER BY table_schema, table_name;
        `);

        console.log('\n--- Tables found ---');
        if (res.rows.length === 0) {
            console.log('No tables found in user schemas.');
        } else {
            res.rows.forEach(row => {
                console.log(`${row.table_schema}.${row.table_name}`);
            });
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkStructure();
