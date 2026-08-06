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
  // Always round to nearest 10, rounding UP for .5
  const result = Math.ceil(value / 10) * 10;
  if (!Number.isFinite(result)) return value;
  console.log(`Rounding: ${value} -> ${result}`);
  return result;
}

function calculateAllRates(gold24Sale: number, silverSale: number, settings: any) {
  const perc24Purchase = settings?.perc_24k_purchase ?? 0.985;
  const perc22Sale = settings?.perc_22k_sale ?? 0.92;
  const perc22Purchase = settings?.perc_22k_purchase ?? 0.9;
  const perc18Sale = settings?.perc_18k_sale ?? 0.86;
  const perc18Purchase = settings?.perc_18k_purchase ?? 0.75;
  const silverPurchaseOffset = settings?.silver_purchase_offset ?? -5000;

  // Calculate and round all values
  const result = {
    gold_24k_sale: gold24Sale,
    gold_24k_purchase: roundRate(gold24Sale * perc24Purchase),
    gold_22k_sale: roundRate(gold24Sale * perc22Sale),
    gold_22k_purchase: roundRate(gold24Sale * perc22Purchase),
    gold_18k_sale: roundRate(gold24Sale * perc18Sale),
    gold_18k_purchase: roundRate(gold24Sale * perc18Purchase),
    silver_per_kg_sale: silverSale,
    silver_per_kg_purchase: roundRate(silverSale + silverPurchaseOffset),
  };
  
  console.log("Calculated rates:", JSON.stringify(result));
  return result;
}

function ratesAreEqual(ratesA: any, ratesB: any): boolean {
  // Compare all rate values as strings to avoid type issues
  const fields = [
    'gold_24k_sale', 'gold_24k_purchase', 'gold_22k_sale', 'gold_22k_purchase',
    'gold_18k_sale', 'gold_18k_purchase', 'silver_per_kg_sale', 'silver_per_kg_purchase'
  ];
  
  for (const field of fields) {
    const valA = Number(ratesA[field]);
    const valB = Number(ratesB[field]);
    if (valA !== valB) {
      console.log(`Rate difference: ${field} - DB: ${valA}, New: ${valB}`);
      return false;
    }
  }
  return true;
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

  // Get RAW values from API (before any rounding)
  const rawGold24 = payload["24K Gold"];
  const rawSilver = payload["Silver"];

  // Compare source API values - if they're the same as stored, skip
  if (current && !opts.force) {
    // Use the stored gold_24k_sale and silver_per_kg_sale as reference
    // These should match when API hasn't changed
    const storedGold24 = current.gold_24k_sale;
    const storedSilver = current.silver_per_kg_sale;
    
    // Compare after normalizing (divide by 100 if needed for silver)
    const normStoredSilver = storedSilver >= 10000 ? storedSilver / 100 : storedSilver;
    const normRawSilver = rawSilver >= 10000 ? rawSilver / 100 : rawSilver;
    
    if (storedGold24 === rawGold24 && normStoredSilver === normRawSilver) {
      console.log("Rates unchanged (source API values same), skipping database update");
      return current;
    }
  }

  // Calculate all rates from external data
  const newRates = calculateAllRates(gold24Sale, silverSale, settings);

  // Rates are different, create new record and update file
  console.log("Creating gold rate in database:", JSON.stringify(newRates));
  
  const created = await storage.createGoldRate({
    ...newRates,
    is_active: true,
  });

  console.log("Created gold rate with ID:", created.id);
  
  await writeCurrentRatesToFile(created);

  return created;
}
