import { sql } from "drizzle-orm";
import { pgTable, text, integer, real, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Gold and Silver Rates
export const goldRates = pgTable("gold_rates", {
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

// Display Settings
export const displaySettings = pgTable("display_settings", {
  id: serial("id").primaryKey(),
  orientation: text("orientation").default("horizontal"),
  background_color: text("background_color").default("#FFF8E1"),
  text_color: text("text_color").default("#212529"),
  rate_number_font_size: integer("rate_number_font_size").default(36),
  rate_number_color: text("rate_number_color").default("#1e40af"),
  gold_rate_label_font_size: integer("gold_rate_label_font_size").default(18),
  gold_rate_label_color: text("gold_rate_label_color").default("#1f2937"),
  silver_rate_label_font_size: integer("silver_rate_label_font_size").default(18),
  silver_rate_label_color: text("silver_rate_label_color").default("#1f2937"),
  header_font_size: integer("header_font_size").default(28),
  header_color: text("header_color").default("#000000"),
  show_media: boolean("show_media").default(true),
  rates_display_duration_seconds: integer("rates_display_duration_seconds").default(15),
  refresh_interval: integer("refresh_interval").default(30),
created_date: timestamp("created_date").defaultNow()});

// Media Items (for ads between rates)
export const mediaItems = pgTable("media_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  file_url: text("file_url"), // Keep for backward compatibility
  file_data: text("file_data"), // Store base64 encoded data
  media_type: text("media_type").notNull(), // 'image' or 'video'
  duration_seconds: integer("duration_seconds").default(30),
  order_index: integer("order_index").default(0),
  is_active: boolean("is_active").default(true),
  file_size: integer("file_size"),
  mime_type: text("mime_type"),
  created_date: timestamp("created_date").defaultNow()
 });

// Promotional Images (slideshow below silver rates)
export const promoImages = pgTable("promo_images", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  image_url: text("image_url"), // Keep for backward compatibility
  image_data: text("image_data"), // Store base64 encoded data
  duration_seconds: integer("duration_seconds").default(5),
  transition_effect: text("transition_effect").default("fade"),
  order_index: integer("order_index").default(0),
  is_active: boolean("is_active").default(true),
  file_size: integer("file_size"),
  created_date: timestamp("created_date").defaultNow()
 });

// Banner Settings
export const bannerSettings = pgTable("banner_settings", {
  id: serial("id").primaryKey(),
  banner_image_url: text("banner_image_url"), // Keep for backward compatibility
  banner_image_data: text("banner_image_data"), // Store base64 encoded data
  banner_height: integer("banner_height").default(120),
  is_active: boolean("is_active").default(true),
  created_date: timestamp("created_date").defaultNow()
});

// Rate Calculation Settings
export const rateSettings = pgTable("rate_settings", {
  id: serial("id").primaryKey(),
  perc_24k_purchase: real("perc_24k_purchase").default(0.985),
  perc_22k_sale: real("perc_22k_sale").default(0.92),
  perc_22k_purchase: real("perc_22k_purchase").default(0.90),
  perc_18k_sale: real("perc_18k_sale").default(0.86),
  perc_18k_purchase: real("perc_18k_purchase").default(0.80),
  silver_purchase_offset: real("silver_purchase_offset").default(-5000), // purchase = sale + offset
  check_interval_minutes: integer("check_interval_minutes").default(5), // auto sync interval
  created_date: timestamp("created_date").defaultNow()
});

// Insert schemas
export const insertGoldRateSchema = createInsertSchema(goldRates).omit({
  id: true,
  created_date: true
});

export const insertDisplaySettingsSchema = createInsertSchema(displaySettings).omit({
  id: true,
  created_date: true
});

export const insertMediaItemSchema = createInsertSchema(mediaItems).omit({
  id: true,
  created_date: true
});

export const insertPromoImageSchema = createInsertSchema(promoImages).omit({
  id: true,
  created_date: true
});

export const insertBannerSettingsSchema = createInsertSchema(bannerSettings).omit({
  id: true,
  created_date: true
});

export const insertRateSettingsSchema = createInsertSchema(rateSettings).omit({
  id: true,
  created_date: true
});

// Types
export type GoldRate = typeof goldRates.$inferSelect;
export type InsertGoldRate = z.infer<typeof insertGoldRateSchema>;

export type DisplaySettings = typeof displaySettings.$inferSelect;
export type InsertDisplaySettings = z.infer<typeof insertDisplaySettingsSchema>;

export type MediaItem = typeof mediaItems.$inferSelect;
export type InsertMediaItem = z.infer<typeof insertMediaItemSchema>;

export type PromoImage = typeof promoImages.$inferSelect;
export type InsertPromoImage = z.infer<typeof insertPromoImageSchema>;

export type BannerSettings = typeof bannerSettings.$inferSelect;
export type InsertBannerSettings = z.infer<typeof insertBannerSettingsSchema>;

export type RateSettings = typeof rateSettings.$inferSelect;
export type InsertRateSettings = z.infer<typeof insertRateSettingsSchema>;
