// Run this script to create tables in Supabase
import pg from 'pg';
const { Client } = pg;

async function createTables() {
  const client = new Client({
    connectionString: "postgresql://postgres:devijewellers1981@db.tmdsgjheinmjxqthzmvm.supabase.co:5432/postgres?sslmode=require",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Create gold_rates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gold_rates (
        id SERIAL PRIMARY KEY,
        gold_24k_sale REAL NOT NULL,
        gold_24k_purchase REAL NOT NULL,
        gold_22k_sale REAL NOT NULL,
        gold_22k_purchase REAL NOT NULL,
        gold_18k_sale REAL NOT NULL,
        gold_18k_purchase REAL NOT NULL,
        silver_per_kg_sale REAL NOT NULL,
        silver_per_kg_purchase REAL NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_date TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('gold_rates table created');

    // Create rate_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rate_settings (
        id SERIAL PRIMARY KEY,
        perc_24k_purchase REAL DEFAULT 0.985,
        perc_22k_sale REAL DEFAULT 0.92,
        perc_22k_purchase REAL DEFAULT 0.90,
        perc_18k_sale REAL DEFAULT 0.86,
        perc_18k_purchase REAL DEFAULT 0.80,
        silver_purchase_offset REAL DEFAULT -5000,
        check_interval_minutes INTEGER DEFAULT 1,
        created_date TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('rate_settings table created');

    // Insert default rate settings if not exists
    await client.query(`
      INSERT INTO rate_settings (perc_24k_purchase, perc_22k_sale, perc_22k_purchase, perc_18k_sale, perc_18k_purchase, silver_purchase_offset, check_interval_minutes)
      SELECT 0.985, 0.92, 0.90, 0.86, 0.80, -5000, 1
      WHERE NOT EXISTS (SELECT 1 FROM rate_settings LIMIT 1)
    `);
    console.log('Default rate settings inserted');

    // Verify tables
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Existing tables:', result.rows.map(r => r.table_name).join(', '));

    console.log('\n✅ All tables created successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

createTables();
