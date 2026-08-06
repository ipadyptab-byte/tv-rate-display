import {
  goldRates,
  displaySettings,
  mediaItems,
  promoImages,
  bannerSettings,
  rateSettings,
  type GoldRate,
  type InsertGoldRate,
  type DisplaySettings,
  type InsertDisplaySettings,
  type MediaItem,
  type InsertMediaItem,
  type PromoImage,
  type InsertPromoImage,
  type BannerSettings,
  type InsertBannerSettings,
  type RateSettings,
  type InsertRateSettings
} from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";
import { ensureDbReady, getDb } from "./db";
import { writeCurrentRatesFile } from "./currentrates-file";

export interface IStorage {
  // Gold Rates
  getCurrentRates(): Promise<GoldRate | undefined>;
  createGoldRate(rate: InsertGoldRate): Promise<GoldRate>;
  updateGoldRate(id: number, rate: Partial<InsertGoldRate>): Promise<GoldRate | undefined>;
  
  // Display Settings
  getDisplaySettings(): Promise<DisplaySettings | undefined>;
  createDisplaySettings(settings: InsertDisplaySettings): Promise<DisplaySettings>;
  updateDisplaySettings(id: number, settings: Partial<InsertDisplaySettings>): Promise<DisplaySettings | undefined>;
  
  // Rate Calculation Settings
  getRateSettings(): Promise<import("@shared/schema").RateSettings | undefined>;
  createRateSettings(settings: import("@shared/schema").InsertRateSettings): Promise<import("@shared/schema").RateSettings>;
  updateRateSettings(id: number, settings: Partial<import("@shared/schema").InsertRateSettings>): Promise<import("@shared/schema").RateSettings | undefined>;
  
  // Media Items
  getMediaItems(activeOnly?: boolean): Promise<MediaItem[]>;
  createMediaItem(item: InsertMediaItem): Promise<MediaItem>;
  updateMediaItem(id: number, item: Partial<InsertMediaItem>): Promise<MediaItem | undefined>;
  deleteMediaItem(id: number): Promise<boolean>;
  
  // Promo Images
  getPromoImages(activeOnly?: boolean): Promise<PromoImage[]>;
  createPromoImage(image: InsertPromoImage): Promise<PromoImage>;
  updatePromoImage(id: number, image: Partial<InsertPromoImage>): Promise<PromoImage | undefined>;
  deletePromoImage(id: number): Promise<boolean>;
  
  // Banner Settings
  getBannerSettings(): Promise<BannerSettings | undefined>;
  createBannerSettings(banner: InsertBannerSettings): Promise<BannerSettings>;
  updateBannerSettings(id: number, banner: Partial<InsertBannerSettings>): Promise<BannerSettings | undefined>;
}

export class PostgresStorage implements IStorage {
  // Gold Rates
  async getCurrentRates(): Promise<GoldRate | undefined> {
    await ensureDbReady();
    const rates = await getDb().select().from(goldRates)
      .where(eq(goldRates.is_active, true))
      .orderBy(desc(goldRates.created_date))
      .limit(1);
    return rates[0];
  }

  async createGoldRate(rate: InsertGoldRate): Promise<GoldRate> {
    await ensureDbReady();
    const db = getDb();

    // Deactivate all existing rates
    await db.update(goldRates).set({ is_active: false });

    const result = await db.insert(goldRates).values(rate).returning();
    await writeCurrentRatesFile(result[0]);
    return result[0];
  }

  async updateGoldRate(id: number, rate: Partial<InsertGoldRate>): Promise<GoldRate | undefined> {
    await ensureDbReady();
    const result = await getDb().update(goldRates)
      .set(rate)
      .where(eq(goldRates.id, id))
      .returning();
    return result[0];
  }

  // Display Settings
  // In storage.ts - add this method
// Add to IStorage interface

// Add to PostgresStorage class
async createDisplaySettings(settings: InsertDisplaySettings): Promise<DisplaySettings> {
  await ensureDbReady();
  const result = await getDb().insert(displaySettings).values(settings).returning();
  return result[0];
} 
  async getDisplaySettings(): Promise<DisplaySettings | undefined> {
    await ensureDbReady();
    const settings = await getDb().select().from(displaySettings)
      .orderBy(desc(displaySettings.created_date))
      .limit(1);
    return settings[0];
  }

  async updateDisplaySettings(id: number, settings: Partial<InsertDisplaySettings>): Promise<DisplaySettings | undefined> {
    await ensureDbReady();
    const result = await getDb().update(displaySettings)
      .set(settings)
      .where(eq(displaySettings.id, id))
      .returning();
    return result[0];
  }

  // Rate Calculation Settings
  async getRateSettings(): Promise<RateSettings | undefined> {
    await ensureDbReady();
    const settings = await getDb().select().from(rateSettings)
      .orderBy(desc(rateSettings.created_date))
      .limit(1);
    return settings[0];
  }

  async createRateSettings(settings: InsertRateSettings): Promise<RateSettings> {
    await ensureDbReady();
    const result = await getDb().insert(rateSettings).values(settings).returning();
    return result[0];
  }

  async updateRateSettings(id: number, settings: Partial<InsertRateSettings>): Promise<RateSettings | undefined> {
    await ensureDbReady();
    const result = await getDb().update(rateSettings)
      .set(settings)
      .where(eq(rateSettings.id, id))
      .returning();
    return result[0];
  }

  // Media Items
  async getMediaItems(activeOnly = false): Promise<MediaItem[]> {
    await ensureDbReady();
    const db = getDb();

    if (activeOnly) {
      return await db.select().from(mediaItems)
        .where(eq(mediaItems.is_active, true))
        .orderBy(asc(mediaItems.order_index));
    }

    return await db.select().from(mediaItems)
      .orderBy(asc(mediaItems.order_index));
  }

  async createMediaItem(item: InsertMediaItem): Promise<MediaItem> {
    await ensureDbReady();
    const result = await getDb().insert(mediaItems).values(item).returning();
    return result[0];
  }

  async updateMediaItem(id: number, item: Partial<InsertMediaItem>): Promise<MediaItem | undefined> {
    await ensureDbReady();
    const result = await getDb().update(mediaItems)
      .set(item)
      .where(eq(mediaItems.id, id))
      .returning();
    return result[0];
  }

  async deleteMediaItem(id: number): Promise<boolean> {
    await ensureDbReady();
    const result = await getDb().delete(mediaItems).where(eq(mediaItems.id, id)).returning();
    return result.length > 0;
  }

  // Promo Images
  async getPromoImages(activeOnly = false): Promise<PromoImage[]> {
    await ensureDbReady();
    const db = getDb();

    if (activeOnly) {
      return await db.select().from(promoImages)
        .where(eq(promoImages.is_active, true))
        .orderBy(asc(promoImages.order_index));
    }

    return await db.select().from(promoImages)
      .orderBy(asc(promoImages.order_index));
  }

  async createPromoImage(image: InsertPromoImage): Promise<PromoImage> {
    await ensureDbReady();
    const result = await getDb().insert(promoImages).values(image).returning();
    return result[0];
  }

  async updatePromoImage(id: number, image: Partial<InsertPromoImage>): Promise<PromoImage | undefined> {
    await ensureDbReady();
    const result = await getDb().update(promoImages)
      .set(image)
      .where(eq(promoImages.id, id))
      .returning();
    return result[0];
  }

  async deletePromoImage(id: number): Promise<boolean> {
    await ensureDbReady();
    const result = await getDb().delete(promoImages).where(eq(promoImages.id, id)).returning();
    return result.length > 0;
  }

  // Banner Settings
  async getBannerSettings(): Promise<BannerSettings | undefined> {
    await ensureDbReady();
    const banner = await getDb().select().from(bannerSettings)
      .where(eq(bannerSettings.is_active, true))
      .orderBy(desc(bannerSettings.created_date))
      .limit(1);
    return banner[0];
  }

  async createBannerSettings(banner: InsertBannerSettings): Promise<BannerSettings> {
    await ensureDbReady();
    const result = await getDb().insert(bannerSettings).values(banner).returning();
    return result[0];
  }

  async updateBannerSettings(id: number, banner: Partial<InsertBannerSettings>): Promise<BannerSettings | undefined> {
    await ensureDbReady();
    const result = await getDb().update(bannerSettings)
      .set(banner)
      .where(eq(bannerSettings.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new PostgresStorage();
