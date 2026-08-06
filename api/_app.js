var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  bannerSettings: () => bannerSettings,
  displaySettings: () => displaySettings,
  goldRates: () => goldRates,
  insertBannerSettingsSchema: () => insertBannerSettingsSchema,
  insertDisplaySettingsSchema: () => insertDisplaySettingsSchema,
  insertGoldRateSchema: () => insertGoldRateSchema,
  insertMediaItemSchema: () => insertMediaItemSchema,
  insertPromoImageSchema: () => insertPromoImageSchema,
  insertRateSettingsSchema: () => insertRateSettingsSchema,
  mediaItems: () => mediaItems,
  promoImages: () => promoImages,
  rateSettings: () => rateSettings
});
import { pgTable, text, integer, real, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var goldRates, displaySettings, mediaItems, promoImages, bannerSettings, rateSettings, insertGoldRateSchema, insertDisplaySettingsSchema, insertMediaItemSchema, insertPromoImageSchema, insertBannerSettingsSchema, insertRateSettingsSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    goldRates = pgTable("gold_rates", {
      id: serial("id").primaryKey(),
      gold_24k_sale: real("gold_24k_sale").notNull(),
      gold_24k_purchase: real("gold_24k_purchase").notNull(),
      gold_22k_sale: real("gold_22k_sale").notNull(),
      gold_22k_purchase: real("gold_22k_purchase").notNull(),
      gold_18k_sale: real("gold_18k_sale").notNull(),
      gold_18k_purchase: real("gold_18k_purchase").notNull(),
      silver_per_kg_sale: real("silver_per_kg_sale").notNull(),
      silver_per_kg_purchase: real("silver_per_kg_purchase").notNull(),
      is_active: boolean("is_active").default(true),
      created_date: timestamp("created_date").defaultNow()
    });
    displaySettings = pgTable("display_settings", {
      id: serial("id").primaryKey(),
      orientation: text("orientation").default("horizontal"),
      background_color: text("background_color").default("#FFF8E1"),
      text_color: text("text_color").default("#212529"),
      rate_number_font_size: text("rate_number_font_size").default("text-4xl"),
      show_media: boolean("show_media").default(true),
      rates_display_duration_seconds: integer("rates_display_duration_seconds").default(15),
      refresh_interval: integer("refresh_interval").default(30),
      created_date: timestamp("created_date").defaultNow()
    });
    mediaItems = pgTable("media_items", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      file_url: text("file_url"),
      // Keep for backward compatibility
      file_data: text("file_data"),
      // Store base64 encoded data
      media_type: text("media_type").notNull(),
      // 'image' or 'video'
      duration_seconds: integer("duration_seconds").default(30),
      order_index: integer("order_index").default(0),
      is_active: boolean("is_active").default(true),
      file_size: integer("file_size"),
      mime_type: text("mime_type"),
      created_date: timestamp("created_date").defaultNow()
    });
    promoImages = pgTable("promo_images", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      image_url: text("image_url"),
      // Keep for backward compatibility
      image_data: text("image_data"),
      // Store base64 encoded data
      duration_seconds: integer("duration_seconds").default(5),
      transition_effect: text("transition_effect").default("fade"),
      order_index: integer("order_index").default(0),
      is_active: boolean("is_active").default(true),
      file_size: integer("file_size"),
      created_date: timestamp("created_date").defaultNow()
    });
    bannerSettings = pgTable("banner_settings", {
      id: serial("id").primaryKey(),
      banner_image_url: text("banner_image_url"),
      // Keep for backward compatibility
      banner_image_data: text("banner_image_data"),
      // Store base64 encoded data
      banner_height: integer("banner_height").default(120),
      is_active: boolean("is_active").default(true),
      created_date: timestamp("created_date").defaultNow()
    });
    rateSettings = pgTable("rate_settings", {
      id: serial("id").primaryKey(),
      perc_24k_purchase: real("perc_24k_purchase").default(0.985),
      perc_22k_sale: real("perc_22k_sale").default(0.92),
      perc_22k_purchase: real("perc_22k_purchase").default(0.9),
      perc_18k_sale: real("perc_18k_sale").default(0.86),
      perc_18k_purchase: real("perc_18k_purchase").default(0.8),
      silver_purchase_offset: real("silver_purchase_offset").default(-5e3),
      // purchase = sale + offset
      check_interval_minutes: integer("check_interval_minutes").default(5),
      // auto sync interval
      created_date: timestamp("created_date").defaultNow()
    });
    insertGoldRateSchema = createInsertSchema(goldRates).omit({
      id: true,
      created_date: true
    });
    insertDisplaySettingsSchema = createInsertSchema(displaySettings).omit({
      id: true,
      created_date: true
    });
    insertMediaItemSchema = createInsertSchema(mediaItems).omit({
      id: true,
      created_date: true
    });
    insertPromoImageSchema = createInsertSchema(promoImages).omit({
      id: true,
      created_date: true
    });
    insertBannerSettingsSchema = createInsertSchema(bannerSettings).omit({
      id: true,
      created_date: true
    });
    insertRateSettingsSchema = createInsertSchema(rateSettings).omit({
      id: true,
      created_date: true
    });
  }
});

// server/app.ts
import "dotenv/config";
import express from "express";
import postgres from "postgres";

// server/storage.ts
init_schema();
import { eq, desc, asc } from "drizzle-orm";

// server/db.ts
init_schema();
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var { Pool } = pg;
var pool = null;
var db = null;
var initPromise = null;
function getDatabaseUrl2() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
}
async function ensureSchema(client) {
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
  const connectionString = getDatabaseUrl2();
  if (!connectionString) {
    throw new Error("Database URL not set. Set DATABASE_URL (or POSTGRES_URL / POSTGRES_PRISMA_URL).");
  }
  pool = new Pool({ connectionString });
  initPromise = ensureSchema(pool);
  db = drizzle({ client: pool, schema: schema_exports });
}
function getDb() {
  if (db) return db;
  init();
  return db;
}
async function ensureDbReady() {
  init();
  await initPromise;
}

// server/storage.ts
var PostgresStorage = class {
  // Gold Rates
  async getCurrentRates() {
    await ensureDbReady();
    const rates = await getDb().select().from(goldRates).where(eq(goldRates.is_active, true)).orderBy(desc(goldRates.created_date)).limit(1);
    return rates[0];
  }
  async createGoldRate(rate) {
    await ensureDbReady();
    const db2 = getDb();
    await db2.update(goldRates).set({ is_active: false });
    const result = await db2.insert(goldRates).values(rate).returning();
    return result[0];
  }
  async updateGoldRate(id, rate) {
    await ensureDbReady();
    const result = await getDb().update(goldRates).set(rate).where(eq(goldRates.id, id)).returning();
    return result[0];
  }
  // Display Settings
  // In storage.ts - add this method
  // Add to IStorage interface
  // Add to PostgresStorage class
  async createDisplaySettings(settings) {
    await ensureDbReady();
    const result = await getDb().insert(displaySettings).values(settings).returning();
    return result[0];
  }
  async getDisplaySettings() {
    await ensureDbReady();
    const settings = await getDb().select().from(displaySettings).orderBy(desc(displaySettings.created_date)).limit(1);
    return settings[0];
  }
  async updateDisplaySettings(id, settings) {
    await ensureDbReady();
    const result = await getDb().update(displaySettings).set(settings).where(eq(displaySettings.id, id)).returning();
    return result[0];
  }
  // Rate Calculation Settings
  async getRateSettings() {
    await ensureDbReady();
    const settings = await getDb().select().from(rateSettings).orderBy(desc(rateSettings.created_date)).limit(1);
    return settings[0];
  }
  async createRateSettings(settings) {
    await ensureDbReady();
    const result = await getDb().insert(rateSettings).values(settings).returning();
    return result[0];
  }
  async updateRateSettings(id, settings) {
    await ensureDbReady();
    const result = await getDb().update(rateSettings).set(settings).where(eq(rateSettings.id, id)).returning();
    return result[0];
  }
  // Media Items
  async getMediaItems(activeOnly = false) {
    await ensureDbReady();
    const db2 = getDb();
    if (activeOnly) {
      return await db2.select().from(mediaItems).where(eq(mediaItems.is_active, true)).orderBy(asc(mediaItems.order_index));
    }
    return await db2.select().from(mediaItems).orderBy(asc(mediaItems.order_index));
  }
  async createMediaItem(item) {
    await ensureDbReady();
    const result = await getDb().insert(mediaItems).values(item).returning();
    return result[0];
  }
  async updateMediaItem(id, item) {
    await ensureDbReady();
    const result = await getDb().update(mediaItems).set(item).where(eq(mediaItems.id, id)).returning();
    return result[0];
  }
  async deleteMediaItem(id) {
    await ensureDbReady();
    const result = await getDb().delete(mediaItems).where(eq(mediaItems.id, id)).returning();
    return result.length > 0;
  }
  // Promo Images
  async getPromoImages(activeOnly = false) {
    await ensureDbReady();
    const db2 = getDb();
    if (activeOnly) {
      return await db2.select().from(promoImages).where(eq(promoImages.is_active, true)).orderBy(asc(promoImages.order_index));
    }
    return await db2.select().from(promoImages).orderBy(asc(promoImages.order_index));
  }
  async createPromoImage(image) {
    await ensureDbReady();
    const result = await getDb().insert(promoImages).values(image).returning();
    return result[0];
  }
  async updatePromoImage(id, image) {
    await ensureDbReady();
    const result = await getDb().update(promoImages).set(image).where(eq(promoImages.id, id)).returning();
    return result[0];
  }
  async deletePromoImage(id) {
    await ensureDbReady();
    const result = await getDb().delete(promoImages).where(eq(promoImages.id, id)).returning();
    return result.length > 0;
  }
  // Banner Settings
  async getBannerSettings() {
    await ensureDbReady();
    const banner = await getDb().select().from(bannerSettings).where(eq(bannerSettings.is_active, true)).orderBy(desc(bannerSettings.created_date)).limit(1);
    return banner[0];
  }
  async createBannerSettings(banner) {
    await ensureDbReady();
    const result = await getDb().insert(bannerSettings).values(banner).returning();
    return result[0];
  }
  async updateBannerSettings(id, banner) {
    await ensureDbReady();
    const result = await getDb().update(bannerSettings).set(banner).where(eq(bannerSettings.id, id)).returning();
    return result[0];
  }
};
var storage = new PostgresStorage();

// server/routes.ts
init_schema();
import multer from "multer";
import { z as z2 } from "zod";

// server/ratesSync.ts
import { z } from "zod";

// server/currentratesfile.ts
import { writeFile } from "node:fs/promises";
function getCurrentRatesFilePath() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return "/tmp/currentrates.txt";
  }
  return new URL("../currentrates.txt", import.meta.url);
}
async function writeCurrentRatesToFile(rates) {
  const lines = [
    `gold_24k_sale=${rates.gold_24k_sale}`,
    `gold_24k_purchase=${rates.gold_24k_purchase}`,
    `gold_22k_sale=${rates.gold_22k_sale}`,
    `gold_22k_purchase=${rates.gold_22k_purchase}`,
    `gold_18k_sale=${rates.gold_18k_sale}`,
    `gold_18k_purchase=${rates.gold_18k_purchase}`,
    `silver_per_kg_sale=${rates.silver_per_kg_sale}`,
    `silver_per_kg_purchase=${rates.silver_per_kg_purchase}`,
    `is_active=${rates.is_active}`,
    `created_date=${rates.created_date instanceof Date ? rates.created_date.toISOString() : new Date(rates.created_date).toISOString()}`
  ];
  await writeFile(getCurrentRatesFilePath(), `${lines.join("\n")}
`, "utf8");
}

// server/ratesSync.ts
var externalRatesSchema = z.object({
  "24K Gold": z.coerce.number().positive().nullable(),
  "22K Gold": z.coerce.number().positive().nullable(),
  "18K Gold": z.coerce.number().positive().nullable(),
  "Silver": z.coerce.number().positive().nullable()
});
function roundRate(value) {
  const result = Math.ceil(value / 10) * 10;
  if (!Number.isFinite(result)) return value;
  console.log(`Rounding: ${value} -> ${result}`);
  return result;
}
function calculateAllRates(gold24Sale, silverSale, settings) {
  const perc24Purchase = settings?.perc_24k_purchase ?? 0.985;
  const perc22Sale = settings?.perc_22k_sale ?? 0.92;
  const perc22Purchase = settings?.perc_22k_purchase ?? 0.9;
  const perc18Sale = settings?.perc_18k_sale ?? 0.86;
  const perc18Purchase = settings?.perc_18k_purchase ?? 0.8;
  const silverPurchaseOffset = settings?.silver_purchase_offset ?? -5e3;
  return {
    gold_24k_sale: gold24Sale,
    gold_24k_purchase: roundRate(gold24Sale * perc24Purchase),
    gold_22k_sale: roundRate(gold24Sale * perc22Sale),
    gold_22k_purchase: roundRate(gold24Sale * perc22Purchase),
    gold_18k_sale: roundRate(gold24Sale * perc18Sale),
    gold_18k_purchase: roundRate(gold24Sale * perc18Purchase),
    silver_per_kg_sale: silverSale,
    silver_per_kg_purchase: roundRate(silverSale + silverPurchaseOffset)
  };
}
function ratesAreEqual(ratesA, ratesB) {
  return ratesA.gold_24k_sale === ratesB.gold_24k_sale && ratesA.gold_24k_purchase === ratesB.gold_24k_purchase && ratesA.gold_22k_sale === ratesB.gold_22k_sale && ratesA.gold_22k_purchase === ratesB.gold_22k_purchase && ratesA.gold_18k_sale === ratesB.gold_18k_sale && ratesA.gold_18k_purchase === ratesB.gold_18k_purchase && ratesA.silver_per_kg_sale === ratesB.silver_per_kg_sale && ratesA.silver_per_kg_purchase === ratesB.silver_per_kg_purchase;
}
async function syncRatesFromExternal(storage2, opts) {
  const settings = await storage2.getRateSettings();
  const intervalMinutes = settings?.check_interval_minutes ?? 1;
  const current = await storage2.getCurrentRates();
  if (!opts.force && current?.created_date) {
    const last = current.created_date instanceof Date ? current.created_date : new Date(current.created_date);
    const dueAt = last.getTime() + intervalMinutes * 60 * 1e3;
    if (Date.now() < dueAt) return current;
  }
  const url = process.env.EXTERNAL_RATES_URL;
  if (!url) {
    throw new Error("EXTERNAL_RATES_URL is not set");
  }
  const response = await fetch(url, { headers: { "accept": "application/json" } });
  if (!response.ok) {
    throw new Error(`External rates fetch failed (${response.status})`);
  }
  const payload = externalRatesSchema.parse(await response.json());
  const gold24Sale = payload["24K Gold"] ? roundRate(payload["24K Gold"]) : null;
  const gold22Sale = payload["22K Gold"] ? roundRate(payload["22K Gold"]) : null;
  const gold18Sale = payload["18K Gold"] ? roundRate(payload["18K Gold"]) : null;
  const silverSale = payload["Silver"] ? roundRate(payload["Silver"]) : null;
  if (!gold24Sale || !silverSale) {
    throw new Error("Invalid response: missing 24K Gold or Silver values");
  }
  const newRates = calculateAllRates(gold24Sale, silverSale, settings);
  if (current && !opts.force) {
    const currentRates = {
      gold_24k_sale: current.gold_24k_sale,
      gold_24k_purchase: current.gold_24k_purchase,
      gold_22k_sale: current.gold_22k_sale,
      gold_22k_purchase: current.gold_22k_purchase,
      gold_18k_sale: current.gold_18k_sale,
      gold_18k_purchase: current.gold_18k_purchase,
      silver_per_kg_sale: current.silver_per_kg_sale,
      silver_per_kg_purchase: current.silver_per_kg_purchase
    };
    if (ratesAreEqual(currentRates, newRates)) {
      console.log("Rates unchanged, skipping database update");
      return current;
    }
  }
  console.log("Creating gold rate in database:", JSON.stringify(newRates));
  const created = await storage2.createGoldRate({
    ...newRates,
    is_active: true
  });
  console.log("Created gold rate with ID:", created.id);
  await writeCurrentRatesToFile(created);
  return created;
}

// server/routes.ts
var memoryStorage = multer.memoryStorage();
var uploadMedia = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    // 50MB
    files: 10,
    // Maximum 10 files per upload
    fieldSize: 10 * 1024 * 1024,
    // 10MB per field
    fields: 20
    // Maximum fields
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/avi",
      "video/mov"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images and videos are allowed."));
    }
  }
});
var uploadPromo = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    // 10MB
    files: 10,
    // Maximum 10 files per upload
    fieldSize: 5 * 1024 * 1024,
    // 5MB per field
    fields: 15
    // Maximum fields
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  }
});
var uploadBanner = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG and PNG images are allowed."));
    }
  }
});
async function registerRoutes(app) {
  app.get("/api/media/:id/file", async (req, res) => {
    try {
      const media = await storage.getMediaItems(false);
      const item = media.find((m) => m.id === parseInt(req.params.id));
      if (!item || !item.file_data && !item.file_url) {
        return res.status(404).json({ message: "File not found" });
      }
      res.set({
        "Content-Type": item.mime_type || "application/octet-stream",
        "Content-Length": item.file_size?.toString() || "0"
      });
      if (item.file_data) {
        const buffer = Buffer.from(item.file_data, "base64");
        res.send(buffer);
      } else if (item.file_url) {
        res.redirect(item.file_url);
      } else {
        res.status(404).json({ message: "File data not available" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to serve file" });
    }
  });
  app.get("/api/promo/:id/file", async (req, res) => {
    try {
      const promos = await storage.getPromoImages(false);
      const item = promos.find((p) => p.id === parseInt(req.params.id));
      if (!item || !item.image_data && !item.image_url) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.set({
        "Content-Type": item.file_size ? "image/jpeg" : "application/octet-stream"
      });
      if (item.image_data) {
        const buffer = Buffer.from(item.image_data, "base64");
        res.send(buffer);
      } else if (item.image_url) {
        res.redirect(item.image_url);
      } else {
        res.status(404).json({ message: "Image data not available" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to serve image" });
    }
  });
  app.get("/api/banner/:id/file", async (req, res) => {
    try {
      const banner = await storage.getBannerSettings();
      if (!banner || !banner.banner_image_data && !banner.banner_image_url) {
        return res.status(404).json({ message: "Banner image not found" });
      }
      res.set({ "Content-Type": "image/jpeg" });
      if (banner.banner_image_data) {
        const buffer = Buffer.from(banner.banner_image_data, "base64");
        res.send(buffer);
      } else if (banner.banner_image_url) {
        res.redirect(banner.banner_image_url);
      } else {
        res.status(404).json({ message: "Banner image data not available" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to serve banner image" });
    }
  });
  app.get("/api/rates/current", async (req, res) => {
    try {
      const rates = await storage.getCurrentRates();
      res.json(rates || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current rates" });
    }
  });
  app.post("/api/rates", async (req, res) => {
    try {
      const validatedData = insertGoldRateSchema.parse(req.body);
      const newRates = await storage.createGoldRate(validatedData);
      res.status(201).json(newRates);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid rate data", errors: error.errors });
      } else {
        console.error("Create rates error:", error);
        res.status(500).json({ message: "Failed to create rates", error: error.message });
      }
    }
  });
  app.get("/api/settings/rates", async (_req, res) => {
    try {
      const settings = await storage.getRateSettings();
      res.json(settings || {
        perc_24k_purchase: 1,
        perc_22k_sale: 0.92,
        perc_22k_purchase: 0.9,
        perc_18k_sale: 0.86,
        perc_18k_purchase: 0.8,
        silver_purchase_offset: -5e3,
        check_interval_minutes: 1
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rate settings" });
    }
  });
  app.post("/api/settings/rates", async (req, res) => {
    try {
      const { insertRateSettingsSchema: insertRateSettingsSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const validated = insertRateSettingsSchema2.parse(req.body);
      const created = await storage.createRateSettings(validated);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid rate settings", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create rate settings" });
      }
    }
  });
  app.put("/api/settings/rates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { insertRateSettingsSchema: insertRateSettingsSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const validated = insertRateSettingsSchema2.partial().parse(req.body);
      const updated = await storage.updateRateSettings(id, validated);
      if (!updated) return res.status(404).json({ message: "Rate settings not found" });
      res.json(updated);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid rate settings", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update rate settings" });
      }
    }
  });
  app.get("/api/rates/debug", async (req, res) => {
    try {
      const url = process.env.EXTERNAL_RATES_URL;
      if (!url) {
        return res.json({ error: "EXTERNAL_RATES_URL not set" });
      }
      const response = await fetch(url, { headers: { "accept": "application/json" } });
      const data = await response.json();
      const settings = await storage.getRateSettings();
      const currentRates = await storage.getCurrentRates();
      res.json({
        externalApiUrl: url,
        externalApiStatus: response.ok,
        externalApiData: data,
        rateSettings: settings,
        currentRatesInDb: currentRates ? {
          id: currentRates.id,
          gold_24k_sale: currentRates.gold_24k_sale,
          created_date: currentRates.created_date
        } : null
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/rates/sync", async (req, res) => {
    try {
      const force = req.query.force !== "0";
      const newRates = await syncRatesFromExternal(storage, { force });
      res.status(201).json({ message: "Rates synced", rates: newRates });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid computed rate data", errors: error.errors });
      } else {
        console.error("Rates sync error:", error);
        res.status(500).json({ message: "Failed to sync rates", error: error.message });
      }
    }
  });
  app.get("/api/rates/sync-scheduled", async (_req, res) => {
    try {
      const newRates = await syncRatesFromExternal(storage, { force: false });
      res.status(200).json({ message: "Scheduled sync checked", rates: newRates });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid computed rate data", errors: error.errors });
      } else {
        console.error("Rates scheduled sync error:", error);
        res.status(500).json({ message: "Failed to sync rates", error: error.message });
      }
    }
  });
  app.get("/api/db-health", async (_req, res) => {
    try {
      await ensureDbReady();
      const db2 = getDb();
      const result = await db2.select().from(goldRates).limit(100);
      res.json({
        status: "connected",
        table_exists: true,
        row_count: result.length,
        db_url: getDatabaseUrl() ? "configured" : "missing",
        sample_data: result.slice(0, 3)
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        error: error.message
      });
    }
  });
  app.get("/api/test-round", async (_req, res) => {
    const testValues = [146765, 134845, 111750, 23e4];
    const results = testValues.map((v) => {
      const rounded = Math.ceil(v / 10) * 10;
      return { input: v, output: rounded };
    });
    res.json({ results });
  });
  app.get("/api/settings/display", async (req, res) => {
    try {
      const settings = await storage.getDisplaySettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch display settings" });
    }
  });
  app.post("/api/settings/display", async (req, res) => {
    try {
      const validatedData = insertDisplaySettingsSchema.parse(req.body);
      const newSettings = await storage.createDisplaySettings(validatedData);
      res.status(201).json(newSettings);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create settings" });
      }
    }
  });
  app.put("/api/settings/display/:id?", async (req, res) => {
    try {
      const validatedData = insertDisplaySettingsSchema.partial().parse(req.body);
      const existingSettings = await storage.getDisplaySettings();
      if (existingSettings && existingSettings.id) {
        const updatedSettings = await storage.updateDisplaySettings(existingSettings.id, validatedData);
        res.json(updatedSettings);
      } else {
        const newSettings = await storage.createDisplaySettings({
          ...validatedData,
          orientation: validatedData.orientation || "horizontal",
          background_color: validatedData.background_color || "#FFF8E1",
          text_color: validatedData.text_color || "#212529",
          rate_number_font_size: validatedData.rate_number_font_size || "text-4xl",
          show_media: validatedData.show_media !== void 0 ? validatedData.show_media : true,
          rates_display_duration_seconds: validatedData.rates_display_duration_seconds || 15,
          refresh_interval: validatedData.refresh_interval || 30
        });
        res.json(newSettings);
      }
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        console.error("Settings update error:", error);
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });
  app.get("/api/media", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const media = await storage.getMediaItems(activeOnly);
      res.json(media);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch media items" });
    }
  });
  app.post("/api/media/upload", uploadMedia.array("files", 10), async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      console.log(`Processing ${files.length} media files for upload`);
      const createdItems = [];
      const allMedia = await storage.getMediaItems(false);
      const highestOrder = allMedia.reduce((max, item) => Math.max(max, item.order_index || 0), 0);
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        console.log(`Processing file ${index + 1}/${files.length}: ${file.originalname} (${file.size} bytes)`);
        if (file.size > 50 * 1024 * 1024) {
          console.warn(`File ${file.originalname} too large: ${file.size} bytes`);
          continue;
        }
        const mediaType = file.mimetype.startsWith("image/") ? "image" : "video";
        try {
          const fileData = file.buffer.toString("base64");
          console.log(`File ${file.originalname} converted to base64, length: ${fileData.length}`);
          const mediaItem = await storage.createMediaItem({
            name: file.originalname,
            file_url: `/api/media/${Date.now()}/file`,
            // Placeholder URL, will be updated with real ID
            file_data: fileData,
            media_type: mediaType,
            duration_seconds: parseInt(req.body.duration_seconds) || 30,
            order_index: highestOrder + index + 1,
            is_active: req.body.autoActivate === "true",
            file_size: file.size,
            mime_type: file.mimetype
          });
          console.log(`Created media item with ID: ${mediaItem.id}`);
          await storage.updateMediaItem(mediaItem.id, {
            file_url: `/api/media/${mediaItem.id}/file`
          });
          createdItems.push(mediaItem);
        } catch (fileError) {
          console.error(`Error processing file ${file.originalname}:`, fileError);
        }
      }
      console.log(`Successfully created ${createdItems.length} media items`);
      res.status(201).json(createdItems);
    } catch (error) {
      console.error("Media upload error details:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : void 0,
        filesCount: req.files ? req.files.length : 0
      });
      res.status(500).json({
        message: "Failed to upload media files",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app.put("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMediaItemSchema.partial().parse(req.body);
      const updatedItem = await storage.updateMediaItem(id, validatedData);
      if (updatedItem) {
        res.json(updatedItem);
      } else {
        res.status(404).json({ message: "Media item not found" });
      }
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid media data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update media item" });
      }
    }
  });
  app.delete("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMediaItem(id);
      if (deleted) {
        res.json({ message: "Media item deleted successfully" });
      } else {
        res.status(404).json({ message: "Media item not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete media item" });
    }
  });
  app.get("/api/promo", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const promos = await storage.getPromoImages(activeOnly);
      res.json(promos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch promotional images" });
    }
  });
  app.post("/api/promo/upload", uploadPromo.array("files", 10), async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      console.log(`Processing ${files.length} promo images for upload`);
      const createdItems = [];
      for (const file of files) {
        console.log(`Processing promo image: ${file.originalname} (${file.size} bytes)`);
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`Promo image ${file.originalname} too large: ${file.size} bytes`);
          continue;
        }
        try {
          const imageData = file.buffer.toString("base64");
          console.log(`Promo image ${file.originalname} converted to base64, length: ${imageData.length}`);
          const promoImage = await storage.createPromoImage({
            name: file.originalname,
            image_url: `/api/promo/${Date.now()}/file`,
            // Placeholder
            image_data: imageData,
            duration_seconds: parseInt(req.body.duration_seconds) || 5,
            transition_effect: req.body.transition || "fade",
            order_index: 0,
            is_active: req.body.autoActivate === "true",
            file_size: file.size
          });
          console.log(`Created promo image with ID: ${promoImage.id}`);
          await storage.updatePromoImage(promoImage.id, {
            image_url: `/api/promo/${promoImage.id}/file`
          });
          createdItems.push(promoImage);
        } catch (fileError) {
          console.error(`Error processing promo image ${file.originalname}:`, fileError);
        }
      }
      console.log(`Successfully created ${createdItems.length} promo images`);
      res.status(201).json(createdItems);
    } catch (error) {
      console.error("Promo upload error details:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : void 0,
        filesCount: req.files ? req.files.length : 0
      });
      res.status(500).json({
        message: "Failed to upload promotional images",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app.put("/api/promo/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPromoImageSchema.partial().parse(req.body);
      const updatedItem = await storage.updatePromoImage(id, validatedData);
      if (updatedItem) {
        res.json(updatedItem);
      } else {
        res.status(404).json({ message: "Promotional image not found" });
      }
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid promo data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update promotional image" });
      }
    }
  });
  app.delete("/api/promo/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePromoImage(id);
      if (deleted) {
        res.json({ message: "Promotional image deleted successfully" });
      } else {
        res.status(404).json({ message: "Promotional image not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete promotional image" });
    }
  });
  app.get("/api/banner", async (req, res) => {
    try {
      const banner = await storage.getBannerSettings();
      res.json(banner || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch banner settings" });
    }
  });
  app.post("/api/banner/upload", uploadBanner.single("banner"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No banner file uploaded" });
      }
      const imageData = file.buffer.toString("base64");
      const existingBanner = await storage.getBannerSettings();
      if (existingBanner && existingBanner.id) {
        const updatedBanner = await storage.updateBannerSettings(existingBanner.id, {
          banner_image_data: imageData,
          banner_image_url: `/api/banner/${existingBanner.id}/file`,
          is_active: true
        });
        res.status(201).json({
          banner_image_url: updatedBanner?.banner_image_url,
          message: "Banner updated successfully"
        });
      } else {
        res.status(201).json({
          banner_image_url: `/api/banner/1/file`,
          message: "Banner uploaded successfully"
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to upload banner" });
    }
  });
  app.get("/api/system/info", async (req, res) => {
    try {
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();
      const mediaCount = await storage.getMediaItems(false).then((items) => items.length);
      const promoCount = await storage.getPromoImages(false).then((items) => items.length);
      const ratesData = await storage.getCurrentRates();
      const istTime = (/* @__PURE__ */ new Date()).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      res.json({
        status: "online",
        server_time: istTime,
        uptime_hours: Math.floor(uptime / 3600),
        memory_used: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        memory_total: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
        database_status: "connected",
        media_files: mediaCount,
        promo_images: promoCount,
        rates_last_updated: ratesData?.created_date || null,
        node_version: process.version,
        last_sync: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("System info error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to fetch system information"
      });
    }
  });
}

// server/log.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// server/app.ts
async function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "\xE2\u20AC\xA6";
        }
        log(logLine);
      }
    });
    next();
  });
  app.get("/api/health", async (_req, res) => {
    try {
      const connectionString = getDatabaseUrl2();
      if (!connectionString) {
        return res.status(500).json({
          status: "unhealthy",
          database: "disconnected",
          error: "Database URL not set (DATABASE_URL / POSTGRES_URL / POSTGRES_PRISMA_URL)"
        });
      }
      const client = postgres(connectionString);
      await client`SELECT 1`;
      await client.end();
      res.json({ status: "healthy", database: "connected" });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        database: "disconnected",
        error: error.message
      });
    }
  });
  app.get("/api/debug/env", (_req, res) => {
    res.json({
      hasDatabaseUrl: Boolean(getDatabaseUrl2()),
      nodeEnv: process.env.NODE_ENV,
      vercel: Boolean(process.env.VERCEL)
    });
  });
  app.get("/api/version", (_req, res) => {
    res.json({
      vercel: Boolean(process.env.VERCEL),
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
      gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
      buildTime: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.get("/api/debug/db", async (_req, res) => {
    try {
      const connectionString = getDatabaseUrl2();
      if (!connectionString) {
        return res.json({
          error: "No DATABASE_URL set",
          envVars: {
            DATABASE_URL: process.env.DATABASE_URL ? "[SET]" : null,
            POSTGRES_URL: process.env.POSTGRES_URL ? "[SET]" : null,
            POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? "[SET]" : null
          }
        });
      }
      const url = new URL(connectionString);
      const debugInfo = {
        host: url.host,
        port: url.port,
        database: url.pathname.replace("/", ""),
        user: url.username,
        hasPassword: Boolean(url.password),
        ssl: connectionString.includes("sslmode=require")
      };
      const client = postgres(connectionString);
      const result = await client`SELECT version() as version, now() as time`;
      await client.end();
      res.json({
        connection: debugInfo,
        query: {
          success: true,
          version: result[0].version.split(",")[0],
          time: result[0].time
        }
      });
    } catch (error) {
      res.json({
        connection: "failed",
        error: error.message,
        code: error.code,
        errno: error.errno,
        hostname: error.hostname
      });
    }
  });
  await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message, error: err?.message });
  });
  return app;
}
export {
  createApp
};
