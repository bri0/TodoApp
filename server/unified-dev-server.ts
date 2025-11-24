/**
 * Unified Development Server
 * Serves both Vite (frontend) and API on the same port (5173)
 */

import express from "express";
import { createServer } from "vite";
import dotenv from "dotenv";
import { syncRateLimiter } from "./middleware/rateLimit";
import { securityMiddleware } from "./middleware/securityMiddleware";
import { validateSyncRequest } from "./middleware/validationMiddleware";
import { syncHandler } from "./routes/sync";
import { initializeDatabase, ensureConnection } from "./db";

dotenv.config({ path: ".env.local" });

const PORT = 5173;

async function startServer() {
  console.log("🚀 Starting Unified Todo App Server...\n");

  // Initialize database
  try {
    await ensureConnection();
    await initializeDatabase();
    console.log("✅ Database initialized");
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1);
  }

  // Create Vite server
  console.log("⚙️  Starting Vite dev server...");
  const vite = await createServer({
    server: {
      middlewareMode: false,
      port: PORT,
    },
    configFile: "./vite.config.ts",
  });

  await vite.listen();

  const viteServer = vite.httpServer;
  if (!viteServer) {
    throw new Error("Failed to start Vite server");
  }

  // Add Express middleware to Vite's server
  const app = express();

  // Body parser for API routes
  app.use("/api", express.json({ limit: "1mb" }));

  // Security headers for API routes
  app.use("/api", securityMiddleware);

  // API Routes
  app.post("/api/sync/t/:uid", syncRateLimiter, validateSyncRequest, syncHandler);

  // Inject API routes into Vite's middleware stack
  viteServer.on("request", (req, res) => {
    if (req.url?.startsWith("/api")) {
      app(req, res);
    }
  });

  console.log("========================================");
  console.log("✅ UNIFIED SERVER RUNNING");
  console.log("========================================");
  console.log(`🌐 URL:      http://localhost:${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}/`);
  console.log(`🔌 API:      http://localhost:${PORT}/api/sync/t/:uid`);
  console.log("========================================\n");
  console.log("✓ Hot Module Replacement enabled");
  console.log("✓ API and Frontend on same port");
  console.log("✓ Database connected");
  console.log("\nPress Ctrl+C to stop\n");
}

startServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
