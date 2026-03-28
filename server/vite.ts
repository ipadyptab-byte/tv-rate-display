import type { Express } from "express";
import express from "express";
import type { Server } from "node:http";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { createServer as createViteServer } from "vite";

const clientRoot = path.resolve(import.meta.dirname, "../client");
const distPublic = path.resolve(import.meta.dirname, "../dist/public");

export async function setupVite(app: Express, _server: Server) {
  const vite = await createViteServer({
    root: clientRoot,
    server: {
      middlewareMode: true,
    },
    appType: "spa",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    if (req.originalUrl.startsWith("/api")) return next();

    try {
      const url = req.originalUrl;
      let template = await readFile(path.join(clientRoot, "index.html"), "utf-8");
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });
}

export function serveStatic(app: Express) {
  app.use(express.static(distPublic));

  app.get("*", (req, res, next) => {
    if (req.originalUrl.startsWith("/api")) return next();
    res.sendFile(path.join(distPublic, "index.html"));
  });
}
