import { z } from "zod";
import type { IStorage } from "./storage";
import { writeCurrentRatesToFile } from "./currentratesfile";

// Schema for businessmantra.info API response
// Returns: { "24K Gold": 145000, "22K Gold": 133400, "18K Gold": 116000, "Silver": 2280 }
const externalRatesSchema = z.object({
  "24K Gold": z.coerce.number().positive().nullable(),
  "22K Gold": z.coerce.number().positive().nullable(),
  "18K Gold": z.coerce.number().positive().nullable(),
  "Silver": z.coerce.number().positive().nullable(),
});

function roundRate(value: number): number {
  const rounded = Math.round(value);
  return Number.isFinite(rounded) ? rounded : value;
}

function calculateAllRates(gold24Sale: number, silverSale: number, settings: any) {
  const perc24Purchase = settings?.perc_24k_purchase ?? 0.985;
  const perc22Sale = settings?.perc_22k_sale ?? 0.92;
  const perc22Purchase = settings?.perc_22k_purchase ?? 0.9;
  const perc18Sale = settings?.perc_18k_sale ?? 0.86;
  const perc18Purchase = settings?.perc_18k_purchase ?? 0.8;
  const silverPurchaseOffset = settings?.silver_purchase_offset ?? -5000;

  return {
    gold_24k_sale: gold24Sale,
    gold_24k_purchase: roundRate(gold24Sale * perc24Purchase),
    gold_22k_sale: roundRate(gold24Sale * perc22Sale),
    gold_22k_purchase: roundRate(gold24Sale * perc22Purchase),
    gold_18k_sale: roundRate(gold24Sale * perc18Sale),
    gold_18k_purchase: roundRate(gold24Sale * perc18Purchase),
    silver_per_kg_sale: silverSale,
    silver_per_kg_purchase: roundRate(silverSale + silverPurchaseOffset),
  };
}

function ratesAreEqual(ratesA: any, ratesB: any): boolean {
  return (
    ratesA.gold_24k_sale === ratesB.gold_24k_sale &&
    ratesA.gold_24k_purchase === ratesB.gold_24k_purchase &&
    ratesA.gold_22k_sale === ratesB.gold_22k_sale &&
    ratesA.gold_22k_purchase === ratesB.gold_22k_purchase &&
    ratesA.gold_18k_sale === ratesB.gold_18k_sale &&
    ratesA.gold_18k_purchase === ratesB.gold_18k_purchase &&
    ratesA.silver_per_kg_sale === ratesB.silver_per_kg_sale &&
    ratesA.silver_per_kg_purchase === ratesB.silver_per_kg_purchase
  );
}

export async function syncRatesFromExternal(
  storage: IStorage,
  opts: { force: boolean },
) {
  const settings = await storage.getRateSettings();
  const intervalMinutes = settings?.check_interval_minutes ?? 1;

  const current = await storage.getCurrentRates();
  if (!opts.force && current?.created_date) {
    const last = current.created_date instanceof Date
      ? current.created_date
      : new Date(current.created_date);
    const dueAt = last.getTime() + intervalMinutes * 60 * 1000;
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

  // Get values from the businessmantra API format
  const gold24Sale = payload["24K Gold"] ? roundRate(payload["24K Gold"]) : null;
  const gold22Sale = payload["22K Gold"] ? roundRate(payload["22K Gold"]) : null;
  const gold18Sale = payload["18K Gold"] ? roundRate(payload["18K Gold"]) : null;
  const silverSale = payload["Silver"] ? roundRate(payload["Silver"]) : null;

  // Validate we got the required data
  if (!gold24Sale || !silverSale) {
    throw new Error("Invalid response: missing 24K Gold or Silver values");
  }

  // Calculate all rates from external data
  const newRates = calculateAllRates(gold24Sale, silverSale, settings);

  // Check if rates have changed from current database rates
  if (current && !opts.force) {
    const currentRates = {
      gold_24k_sale: current.gold_24k_sale,
      gold_24k_purchase: current.gold_24k_purchase,
      gold_22k_sale: current.gold_22k_sale,
      gold_22k_purchase: current.gold_22k_purchase,
      gold_18k_sale: current.gold_18k_sale,
      gold_18k_purchase: current.gold_18k_purchase,
      silver_per_kg_sale: current.silver_per_kg_sale,
      silver_per_kg_purchase: current.silver_per_kg_purchase,
    };

    if (ratesAreEqual(currentRates, newRates)) {
      console.log("Rates unchanged, skipping database update");
      return current;
    }
  }

  // Rates are different, create new record and update file
  const created = await storage.createGoldRate({
    ...newRates,
    is_active: true,
  });

  await writeCurrentRatesToFile(created);

  return created;
}
