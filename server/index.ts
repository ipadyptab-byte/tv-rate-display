import 'dotenv/config';
import { createApp } from "./app";
import { log } from "./log";
import { storage } from "./storage";
import { syncRatesFromExternal } from "./ratesSync";

async function main() {
  const port = Number(process.env.PORT) || 3000;
  const app = await createApp();

  app.listen(port, "0.0.0.0", () => {
    log(`server listening on http://0.0.0.0:${port}`);
  });

  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (!isServerless) {
    // Initial sync on startup - force sync to ensure we get rates immediately
    const initialSync = async () => {
      try {
        log("Running initial rate sync on startup...");
        const result = await syncRatesFromExternal(storage, { force: true });
        log(`Initial sync complete: 24K=${result.gold_24k_sale}, Silver=${result.silver_per_kg_sale}`);
      } catch (error) {
        log(`Initial sync failed: ${(error as Error).message}`);
      }
    };

    // Run initial sync after a short delay to let DB initialize
    setTimeout(initialSync, 3000);

    // Regular sync based on interval setting
    const tick = async () => {
      try {
        const settings = await storage.getRateSettings();
        const intervalMinutes = settings?.check_interval_minutes ?? 1;
        
        // Use the shorter of: 1 minute or the configured interval
        // This ensures we check frequently but respect the setting
        const intervalMs = Math.max(intervalMinutes, 1) * 60_000;
        
        const result = await syncRatesFromExternal(storage, { force: false });
        if (result) {
          log(`Auto-sync: 24K=${result.gold_24k_sale}, Silver=${result.silver_per_kg_sale}, Interval=${intervalMinutes}min`);
        }
      } catch (error) {
        log(`auto-sync failed: ${(error as Error).message}`);
      }
    };

    // Run sync check every minute
    setInterval(tick, 60_000).unref();
  } else {
    // For serverless, try to sync on first request
    log("Serverless mode - sync will happen on first API call");
  }
}

main();
