import { z } from "zod";
import { insertGoldRateSchema } from "@shared/schema";
import type { IStorage } from "./storage";

const EXTERNAL_RATES_URL = "https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php";

export async function syncRatesFromExternal(storage: IStorage) {
  const resp = await fetch(EXTERNAL_RATES_URL, { cache: "no-store" });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`External rates request failed (${resp.status}): ${body}`);
  }

  const data = (await resp.json()) as Record<string, number>;

  // Only use 24k sale and silver sale from API
  const gold24kSale = Number(data["24K Gold"]);
  const silverSale = Number(data["Silver"]);

  if (!Number.isFinite(gold24kSale) || !Number.isFinite(silverSale)) {
    throw new Error("API missing required fields: 24K Gold or Silver");
  }

  const calc = await storage.getRateSettings();
  const perc_24k_purchase = calc?.perc_24k_purchase ?? 0.985;
  const perc_22k_sale = calc?.perc_22k_sale ?? 0.92;
  const perc_22k_purchase = calc?.perc_22k_purchase ?? 0.9;
  const perc_18k_sale = calc?.perc_18k_sale ?? 0.86;
  const perc_18k_purchase = calc?.perc_18k_purchase ?? 0.8;
  const silver_purchase_offset = calc?.silver_purchase_offset ?? -5000;

  // Silver from API is per 10 grams, convert to per kg (1000g / 10g = 100x)
  const silverPerKgSale = silverSale * 100;

  const round10 = (n: number) => Math.round(n / 10) * 10;

  const payload = {
    gold_24k_sale: round10(gold24kSale),
    gold_24k_purchase: round10(gold24kSale * perc_24k_purchase),
    gold_22k_sale: round10(gold24kSale * perc_22k_sale),
    gold_22k_purchase: round10(gold24kSale * perc_22k_purchase),
    gold_18k_sale: round10(gold24kSale * perc_18k_sale),
    gold_18k_purchase: round10(gold24kSale * perc_18k_purchase),
    silver_per_kg_sale: round10(silverPerKgSale),
    silver_per_kg_purchase: round10(silverPerKgSale + silver_purchase_offset),
    is_active: true,
  };

  const validatedData = insertGoldRateSchema.parse(payload);
  return storage.createGoldRate(validatedData);
}

export const rateSyncErrorSchema = z.object({
  message: z.string(),
});
