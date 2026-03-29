import { z } from "zod";
import type { IStorage } from "./storage";
import { writeCurrentRatesToFile } from "./currentratesfile";

const externalRatesSchema = z.object({
  gold_24k_sale: z.coerce.number().positive(),
  silver_per_kg_sale: z.coerce.number().positive(),
});

function roundRate(value: number): number {
  // Keep as integer rupees unless the upstream has decimals.
  const rounded = Math.round(value);
  return Number.isFinite(rounded) ? rounded : value;
}

export async function syncRatesFromExternal(
  storage: IStorage,
  opts: { force: boolean },
) {
  const settings = await storage.getRateSettings();
  const intervalMinutes = settings?.check_interval_minutes ?? 5;

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

  const gold24Sale = roundRate(payload.gold_24k_sale);
  const silverSale = roundRate(payload.silver_per_kg_sale);

  const perc24Purchase = settings?.perc_24k_purchase ?? 0.985;
  const perc22Sale = settings?.perc_22k_sale ?? 0.92;
  const perc22Purchase = settings?.perc_22k_purchase ?? 0.9;
  const perc18Sale = settings?.perc_18k_sale ?? 0.86;
  const perc18Purchase = settings?.perc_18k_purchase ?? 0.8;
  const silverPurchaseOffset = settings?.silver_purchase_offset ?? -5000;

  const created = await storage.createGoldRate({
    gold_24k_sale: gold24Sale,
    gold_24k_purchase: roundRate(gold24Sale * perc24Purchase),
    gold_22k_sale: roundRate(gold24Sale * perc22Sale),
    gold_22k_purchase: roundRate(gold24Sale * perc22Purchase),
    gold_18k_sale: roundRate(gold24Sale * perc18Sale),
    gold_18k_purchase: roundRate(gold24Sale * perc18Purchase),
    silver_per_kg_sale: silverSale,
    silver_per_kg_purchase: roundRate(silverSale + silverPurchaseOffset),
    is_active: true,
  });

  await writeCurrentRatesToFile(created);

  return created;
}
