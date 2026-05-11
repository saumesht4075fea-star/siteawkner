import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  interface Monitor {
    id: string;
    url: string;
    interval: number; // in minutes
    lastPingStatus: number | null;
    lastPingDuration: number | null;
    lastPingTime: string | null;
    timer?: NodeJS.Timeout;
    isActive: boolean;
  }

  const monitors = new Map<string, Monitor>();

  const pingUrl = async (monitorId: string) => {
    const monitor = monitors.get(monitorId);
    if (!monitor || !monitor.isActive) return;

    const start = Date.now();
    try {
      console.log(`[UpKeep] Pinging ${monitor.url}...`);
      const response = await fetch(monitor.url, {
        method: 'GET',
        headers: { 
          'User-Agent': 'UpKeep-Bot/1.1 (Brutalist Alive Service)',
          'Cache-Control': 'no-cache'
        },
      });
      monitor.lastPingStatus = response.status;
      monitor.lastPingDuration = Date.now() - start;
      monitor.lastPingTime = new Date().toISOString();
      console.log(`[UpKeep] Success: ${monitor.url} [${response.status}] in ${monitor.lastPingDuration}ms`);
    } catch (error: any) {
      console.error(`[UpKeep] Error pinging ${monitor.url}:`, error.message);
      monitor.lastPingStatus = 0; // Error / Offline
      monitor.lastPingDuration = Date.now() - start;
      monitor.lastPingTime = new Date().toISOString();
    }
  };

  // API Routes
  app.get("/api/monitors", (req, res) => {
    const list = Array.from(monitors.values()).map(({ timer, ...rest }) => rest);
    res.json(list);
  });

  // Self-Wakeup: Ping itself every 10 minutes to prevent Cloud Run sleep
  const selfUrl = process.env.APP_URL;
  if (selfUrl) {
    setInterval(() => {
      console.log(`[UpKeep] Self-pinging to stay awake: ${selfUrl}`);
      fetch(`${selfUrl}/api/ping`).catch(() => {});
    }, 10 * 60 * 1000);
  }

  app.post("/api/monitors", (req, res) => {
    const { url, interval } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    // Basic URL validation
    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = `https://${url}`;
    }

    const id = Math.random().toString(36).substring(7);
    const monitor: Monitor = {
      id,
      url: formattedUrl,
      interval: Math.max(1, interval || 10),
      lastPingStatus: null,
      lastPingTime: null,
      isActive: true,
    };

    // Initial ping
    pingUrl(id);

    // Set interval
    monitor.timer = setInterval(() => pingUrl(id), monitor.interval * 60 * 1000);
    monitors.set(id, monitor);

    const { timer, ...safeMonitor } = monitor;
    res.json(safeMonitor);
  });

  app.post("/api/monitors/:id/ping", async (req, res) => {
    const { id } = req.params;
    const monitor = monitors.get(id);
    if (monitor) {
      await pingUrl(id);
      const { timer, ...safeMonitor } = monitor;
      res.json(safeMonitor);
    } else {
      res.status(404).json({ error: "Monitor not found" });
    }
  });

  app.delete("/api/monitors/:id", (req, res) => {
    const { id } = req.params;
    const monitor = monitors.get(id);
    if (monitor) {
      if (monitor.timer) clearInterval(monitor.timer);
      monitors.delete(id);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Monitor not found" });
    }
  });

  // Simple endpoint to keep this service alive
  app.get("/api/ping", (req, res) => {
    res.json({ status: "alive", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[UpKeep] Server running on http://localhost:${PORT}`);
  });
}

startServer();
