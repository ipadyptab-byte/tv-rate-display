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
  // Round to nearest 10 (values ending in 5 will round up to 10)
  const result = Math.round(value / 10) * 10;
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
  console.log("Current rates:", current ? `ID ${current.id}` : "none");
  
  if (!opts.force && current?.created_date) {
    const last = current.created_date instanceof Date
      ? current.created_date
      : new Date(current.created_date);
    const dueAt = last.getTime() + intervalMinutes * 60 * 1000;
    const now = Date.now();
    console.log(`Interval check: last=${last.toISOString()}, dueAt=${new Date(dueAt).toISOString()}, now=${new Date(now).toISOString()}, interval=${intervalMinutes}min`);
    
    if (now < dueAt) {
      console.log("Within interval, skipping sync");
      return current;
    }
    console.log("Interval passed, proceeding with sync...");
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
  // Silver API returns per 10 grams, convert to per kg by multiplying by 100
  const gold24Sale = payload["24K Gold"] ? roundRate(payload["24K Gold"]) : null;
  const gold22Sale = payload["22K Gold"] ? roundRate(payload["22K Gold"]) : null;
  const gold18Sale = payload["18K Gold"] ? roundRate(payload["18K Gold"]) : null;
  const silverSale = payload["Silver"] ? roundRate(payload["Silver"] * 100) : null;

  // Validate we got the required data
  if (!gold24Sale || !silverSale) {
    throw new Error("Invalid response: missing 24K Gold or Silver values");
  }

  // Calculate all rates from external data
  const newRates = calculateAllRates(gold24Sale, silverSale, settings);

  // Let storage.createGoldRate handle duplicate prevention
  console.log("Creating gold rate in database:", JSON.stringify(newRates));
  
  const created = await storage.createGoldRate({
    ...newRates,
    is_active: true,
  });

  console.log("Created gold rate with ID:", created.id);
  
  await writeCurrentRatesToFile(created);

  return created;
}
