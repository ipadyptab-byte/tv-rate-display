import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import postgres from "postgres";
import { registerRoutes } from "./routes";
import { log } from "./log";
import { getDatabaseUrl } from "./db";

export async function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "â€¦";
        }

        log(logLine);
      }
    });

    next();
  });

  // Health check endpoint
  app.get("/api/health", async (_req, res) => {
    try {
      const connectionString = getDatabaseUrl();
      if (!connectionString) {
        return res.status(500).json({
          status: "unhealthy",
          database: "disconnected",
          error: "Database URL not set (DATABASE_URL / POSTGRES_URL / POSTGRES_PRISMA_URL)",
        });
      }

      const client = postgres(connectionString);
      await client`SELECT 1`;
      await client.end();
      res.json({ status: "healthy", database: "connected" });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        database: "disconnected",
        error: (error as Error).message,
      });
    }
  });

  // Quick diagnostics
  app.get("/api/debug/env", (_req, res) => {
    res.json({
      hasDatabaseUrl: Boolean(getDatabaseUrl()),
      nodeEnv: process.env.NODE_ENV,
      vercel: Boolean(process.env.VERCEL),
    });
  });

  app.get("/api/version", (_req, res) => {
    res.json({
      vercel: Boolean(process.env.VERCEL),
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
      gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
      buildTime: new Date().toISOString(),
    });
  });

  // Detailed database diagnostics
  app.get("/api/debug/db", async (_req, res) => {
    try {
      const connectionString = getDatabaseUrl();
      if (!connectionString) {
        return res.json({
          error: "No DATABASE_URL set",
          envVars: {
            DATABASE_URL: process.env.DATABASE_URL ? "[SET]" : null,
            POSTGRES_URL: process.env.POSTGRES_URL ? "[SET]" : null,
            POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? "[SET]" : null,
          }
        });
      }

      // Parse connection string to show host (not password)
      const url = new URL(connectionString);
      const debugInfo = {
        host: url.host,
        port: url.port,
        database: url.pathname.replace("/", ""),
        user: url.username,
        hasPassword: Boolean(url.password),
        ssl: connectionString.includes("sslmode=require"),
      };

      const client = postgres(connectionString);
      const result = await client`SELECT version() as version, now() as time`;
      await client.end();

      res.json({
        connection: debugInfo,
        query: {
          success: true,
          version: result[0].version.split(",")[0],
          time: result[0].time,
        }
      });
    } catch (error: any) {
      res.json({
        connection: "failed",
        error: error.message,
        code: error.code,
        errno: error.errno,
        hostname: error.hostname,
      });
    }
  });

  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message, error: err?.message });
  });

  return app;
}
