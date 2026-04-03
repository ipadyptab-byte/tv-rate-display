import type { GoldRate } from "@shared/schema";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const CURRENT_RATES_PATH = path.resolve(process.cwd(), "currentrates.txt");

export async function writeCurrentRatesFile(rates: GoldRate): Promise<void> {
  const lines = [
    `updated_at=${(rates.created_date ?? new Date()).toISOString()}`,
    `gold_24k_sale=${rates.gold_24k_sale}`,
    `gold_24k_purchase=${rates.gold_24k_purchase}`,
    `gold_22k_sale=${rates.gold_22k_sale}`,
    `gold_22k_purchase=${rates.gold_22k_purchase}`,
    `gold_18k_sale=${rates.gold_18k_sale}`,
    `gold_18k_purchase=${rates.gold_18k_purchase}`,
    `silver_per_kg_sale=${rates.silver_per_kg_sale}`,
    `silver_per_kg_purchase=${rates.silver_per_kg_purchase}`,
  ];

  await writeFile(CURRENT_RATES_PATH, `${lines.join("\n")}\n`, "utf8");
}
