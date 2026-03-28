import type { IStorage } from "./storage";
import { log } from "./log";
import { syncRatesFromExternal } from "./ratesSync";

export function startAutoRateSync(storage: IStorage) {
  if (process.env.DISABLE_AUTO_RATE_SYNC === "1") return;

  let inFlight = false;
  let stopped = false;
  let timeout: NodeJS.Timeout | null = null;

  const runOnce = async () => {
    if (inFlight || stopped) return;
    inFlight = true;
    try {
      const rates = await syncRatesFromExternal(storage);
      log(`auto rate sync: updated (id=${rates.id})`);
    } catch (err) {
      log(`auto rate sync: failed (${(err as Error).message})`);
    } finally {
      inFlight = false;
    }
  };

  const scheduleNext = async () => {
    if (stopped) return;

    let minutes = 5;
    try {
      const settings = await storage.getRateSettings();
      minutes = settings?.check_interval_minutes ?? 5;
    } catch (err) {
      log(`auto rate sync: failed to load settings (${(err as Error).message})`);
    }

    const delayMs = Math.max(1, minutes) * 60_000;

    timeout = setTimeout(async () => {
      await runOnce();
      await scheduleNext();
    }, delayMs);

    log(`auto rate sync: scheduled in ${minutes} minute(s)`);
  };

  // First run shortly after boot (gives DB a moment to be ready)
  timeout = setTimeout(async () => {
    await runOnce();
    await scheduleNext();
  }, 5_000);

  return () => {
    stopped = true;
    if (timeout) clearTimeout(timeout);
  };
}
