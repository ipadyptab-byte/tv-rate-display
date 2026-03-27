import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let initPromise: Promise<void> | null = null;

async function ensureSchema(client: Pool) {
  // Keep this idempotent so a brand new DATABASE_URL works without manual migrations.
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
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS display_settings (
      id SERIAL PRIMARY KEY,
      orientation TEXT DEFAULT 'horizontal',
      background_color TEXT DEFAULT '#FFF8E1',
      text_color TEXT DEFAULT '#212529',
      rate_number_font_size TEXT DEFAULT 'text-4xl',
      show_media BOOLEAN DEFAULT true,
      rates_display_duration_seconds INTEGER DEFAULT 15,
      refresh_interval INTEGER DEFAULT 30,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS media_items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      file_url TEXT,
      file_data TEXT,
      media_type TEXT NOT NULL,
      duration_seconds INTEGER DEFAULT 30,
      order_index INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      file_size INTEGER,
      mime_type TEXT,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS promo_images (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      image_url TEXT,
      image_data TEXT,
      duration_seconds INTEGER DEFAULT 5,
      transition_effect TEXT DEFAULT 'fade',
      order_index INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      file_size INTEGER,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS banner_settings (
      id SERIAL PRIMARY KEY,
      banner_image_url TEXT,
      banner_image_data TEXT,
      banner_height INTEGER DEFAULT 120,
      is_active BOOLEAN DEFAULT true,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rate_settings (
      id SERIAL PRIMARY KEY,
      perc_24k_purchase REAL DEFAULT 0.985,
      perc_22k_sale REAL DEFAULT 0.92,
      perc_22k_purchase REAL DEFAULT 0.90,
      perc_18k_sale REAL DEFAULT 0.86,
      perc_18k_purchase REAL DEFAULT 0.80,
      silver_purchase_offset REAL DEFAULT -5000,
      check_interval_minutes INTEGER DEFAULT 5,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function init() {
  if (db && initPromise) return;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }

  pool = new Pool({ connectionString });
  initPromise = ensureSchema(pool);
  db = drizzle({ client: pool, schema });
}

export function getDb() {
  if (db) return db;
  init();
  return db!;
}

export async function ensureDbReady() {
  init();
  await initPromise;
}
