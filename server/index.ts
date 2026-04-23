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
    const tick = async () => {
      try {
        await syncRatesFromExternal(storage, { force: false });
      } catch (error) {
        log(`auto-sync failed: ${(error as Error).message}`);
      }
    };

    // Run once on startup, then check every minute.
    tick();
    setInterval(tick, 60_000).unref();
  }
}

main();
