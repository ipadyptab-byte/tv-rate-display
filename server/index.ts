import { createServer } from "http";
import { setupVite, serveStatic } from "./vite";
import { log } from "./log";
import { storage } from "./storage";
import { insertGoldRateSchema } from "@shared/schema";
import { createApp } from "./app";

// Robust global error handlers to prevent server crash on transient network failures
process.on("unhandledRejection", (reason) => {
  log(`unhandledRejection: ${(reason as Error)?.message || String(reason)}`);
});
process.on("uncaughtException", (err) => {
  log(`uncaughtException: ${err.message}`);
});

async function performRateSync(): Promise<void> {
  const apiUrl = "https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

  try {
    const resp = await fetch(apiUrl, { cache: "no-store", signal: controller.signal });
    if (!resp.ok) {
      log(`rate sync: external fetch failed (${resp.status})`);
      return;
    }

    let data: Record<string, number>;
    try {
      data = await resp.json() as Record<string, number>;
    } catch (parseErr) {
      log(`rate sync: failed to parse JSON - ${(parseErr as Error).message}`);
      return;
    }

    const gold24kSale = Number(data["24K Gold"]);
    const silverSalePerGram = Number(data["Silver"]);
    if (!Number.isFinite(gold24kSale) || !Number.isFinite(silverSalePerGram)) {
      log("rate sync: API missing fields");
      return;
    }

    const calc = await storage.getRateSettings();
    const perc_24k_purchase = calc?.perc_24k_purchase ?? 0.985;
    const perc_22k_sale = calc?.perc_22k_sale ?? 0.92;
    const perc_22k_purchase = calc?.perc_22k_purchase ?? 0.90;
    const perc_18k_sale = calc?.perc_18k_sale ?? 0.86;
    const perc_18k_purchase = calc?.perc_18k_purchase ?? 0.80;
    const silver_purchase_offset = calc?.silver_purchase_offset ?? -5000;

    // Silver from API is per 10 grams, convert to per kg (1000g / 10g = 100x)
    const silverPerKgSale = silverSalePerGram * 100;

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

    const validated = insertGoldRateSchema.parse(payload);
    await storage.createGoldRate(validated);
    log("rate sync: stored new rates");
  } catch (err) {
    const msg = (err as Error).message || String(err);
    if (msg.includes("aborted")) {
      log("rate sync: request aborted (timeout)");
    } else {
      log(`rate sync error: ${msg}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

function scheduleRateSync() {
  let cancelled = false;

  const loop = async () => {
    if (cancelled) return;

    await performRateSync();

    const calc = await storage.getRateSettings();
    const minutes = calc?.check_interval_minutes ?? 5;
    const intervalMs = Math.max(1, minutes) * 60_000;

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    if (cancelled) return;
    loop();
  };

  loop();

  return () => { cancelled = true; };
}

(async () => {
  const app = await createApp();
  const server = createServer(app);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  scheduleRateSync();

  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
