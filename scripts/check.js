import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function checkData() {
  const res = await pool.query('SELECT * FROM gold_rates ORDER BY created_date DESC LIMIT 5');
  console.log(res.rows);
  await pool.end();
}
checkData();
