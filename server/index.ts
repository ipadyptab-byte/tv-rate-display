import { createServer } from "node:http";
import { createApp } from "./app";
import { log } from "./log";
import { serveStatic, setupVite } from "./vite";

const port = Number(process.env.PORT) || 3000;

const app = await createApp();
const server = createServer(app);

if (process.env.NODE_ENV === "development") {
  await setupVite(app, server);
} else {
  serveStatic(app);
}

server.listen(port, "0.0.0.0", () => {
  log(`serving on port ${port}`);
});
