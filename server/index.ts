import 'dotenv/config';
import { createApp } from "./app";
import { log } from "./log";

async function main() {
  const port = Number(process.env.PORT) || 3000;
  const app = await createApp();

  // Runs only for long-lived Node deployments. For serverless (e.g. Vercel), use an external cron
  // hitting /api/rates/sync.
  const { startAutoRateSync } = await import("./autoRateSync");
  startAutoRateSync((await import("./storage")).storage);

  app.listen(port, "0.0.0.0", () => {
    log(`server listening on http://0.0.0.0:${port}`);
  });
}

main();
