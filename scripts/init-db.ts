import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  goldRates, 
  displaySettings, 
  mediaItems, 
  promoImages, 
  bannerSettings 
} from "@shared/schema";

async function initDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  // Create tables (execute each table creation separately)
  await client`
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
    )
  `;

  await client`
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
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS mediaitems (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      media_type TEXT NOT NULL,
      duration_seconds INTEGER DEFAULT 30,
      order_index INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      file_size INTEGER,
      mime_type TEXT,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS promo_images (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      image_url TEXT NOT NULL,
      duration_seconds INTEGER DEFAULT 5,
      transition_effect TEXT DEFAULT 'fade',
      order_index INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      file_size INTEGER,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS banner_settings (
      id SERIAL PRIMARY KEY,
      banner_image_url TEXT,
      banner_height INTEGER DEFAULT 120,
      is_active BOOLEAN DEFAULT true,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Insert default data if tables are empty
  const defaultRates = await db.select().from(goldRates).limit(1);
  if (defaultRates.length === 0) {
    await db.insert(goldRates).values({
      gold_24k_sale: 74850,
      gold_24k_purchase: 73200,
      gold_22k_sale: 68620,
      gold_22k_purchase: 67100,
      gold_18k_sale: 56140,
      gold_18k_purchase: 54900,
      silver_per_kg_sale: 92500,
      silver_per_kg_purchase: 90800,
      is_active: true
    });
  }

  const defaultSettings = await db.select().from(displaySettings).limit(1);
  if (defaultSettings.length === 0) {
    await db.insert(displaySettings).values({});
  }

  console.log("Database initialized successfully");
  await client.end();
}

initDatabase().catch(console.error);
