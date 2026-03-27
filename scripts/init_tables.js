//init_tables.js
import { readFileSync } from "fs";
import { Pool } from "pg";

const sql = readFileSync("./init_tables.sql", "utf-8");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    "postgresql://mangeshdevi:oeUf8PYukLmuygoGeVHPQcmsGf2We611@dpg-d2o3nbh5pdvs739erm4g-a.oregon-postgres.render.com/devijewellersdatabase",
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await pool.query(sql);
    console.log("Tables initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize tables:", err);
  } finally {
    await pool.end();
  }
}

main();
