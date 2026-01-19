const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function listTables() {
  try {
    const res = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_schema, table_name
    `);
    console.log('Tables in database:');
    res.rows.forEach(row => console.log(`${row.table_schema}.${row.table_name}`));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

listTables();
