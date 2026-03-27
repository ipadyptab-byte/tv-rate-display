// checkData.js
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // set your env var or put connection string here
  ssl: { rejectUnauthorized: false }
});

async function checkData() {
  try {
    const res = await pool.query('SELECT * FROM gold_rates ORDER BY created_date DESC LIMIT 5');
    console.log(res.rows);
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await pool.end();
  }
}

checkData();
