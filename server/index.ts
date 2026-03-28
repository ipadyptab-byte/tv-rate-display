import 'dotenv/config';
import { createApp } from "./app";
import { log } from "./log";

async function main() {
  const port = Number(process.env.PORT) || 3000;
  const app = await createApp();

  app.listen(port, "0.0.0.0", () => {
    log(`server listening on http://0.0.0.0:${port}`);
  });
}

main();
