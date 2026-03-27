import { readFileSync } from "fs";
import { resolve } from "path";
import { Pool } from "pg";

// Load the SQL file
const sqlPath = resolve(process.cwd(), "scripts", "init_tables.sql");
const sql = readFileSync(sqlPath, "utf-8");

// Connection string from environment or fallback
const connectionString = process.env.DATABASE_URL ||
  "postgresql://mangeshdevi:oeUf8PYukLmuygoGeVHPQcmsGf2We611@dpg-d2o3nbh5pdvs739erm4g-a.oregon-postgres.render.com/devijewellersdatabase";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function init() {
  try {
    await pool.query(sql);
    console.log("Tables initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize tables:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

init();
