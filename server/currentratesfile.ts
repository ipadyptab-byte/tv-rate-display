import { writeFile } from "node:fs/promises";
import type { GoldRate } from "@shared/schema";

function getCurrentRatesFilePath() {
  return new URL("../currentrates.txt", import.meta.url);
}

export async function writeCurrentRatesToFile(rates: GoldRate) {
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
    `created_date=${
      rates.created_date instanceof Date
        ? rates.created_date.toISOString()
        : new Date(rates.created_date).toISOString()
    }`,
  ];

  try {
    await writeFile(getCurrentRatesFilePath(), `${lines.join("\n")}\n`, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    if (code === "EROFS" || code === "EACCES" || code === "EPERM") {
      // Some runtimes (e.g. Vercel serverless) have a read-only filesystem.
      // Rates are still stored in the DB; file export is best-effort.
      console.warn("Could not write currentrates.txt (read-only filesystem)");
      return;
    }
    throw error;
  }
}
