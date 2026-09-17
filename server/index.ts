import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { initDatabase } from './db.js';
import { apiRouter, setWsBroadcaster, seedHistoricalData } from './api.js';
import { resetAndSeedUserLedgerTree } from './seedUserLedgerTree.js';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rich terminal request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toLocaleTimeString();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userHeader = req.headers['x-user-id'] || 'anonymous';
    const statusColor = res.statusCode >= 400 ? '❌' : '✅';
    console.log(`[${timestamp}] ${statusColor} ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | User: ${userHeader} | Time: ${duration}ms`);
  });

  next();
});

// Mount API routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Clack Financial Server', timestamp: new Date().toISOString() });
});

// Serve frontend static build if dist folder exists (Production on Render)
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  console.log(`[Server] Serving static frontend build from: ${distPath}`);
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// WebSocket Server for live financial synchronization
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected. Total active clients: ${clients.size}`);
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Clack Live Sync Active' }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected. Total active clients: ${clients.size}`);
  });
});

// Connect API broadcaster to WebSocket clients
setWsBroadcaster((payload: any) => {
  const data = JSON.stringify(payload);
  console.log(`[WS BROADCAST] Broadcasting event: ${payload.type} (Action: ${payload.action || 'SYNC'})`);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    console.log('====================================================');
    console.log('      CLACK FINANCIAL MANAGEMENT PLATFORM           ');
    console.log('  Backend Engine: Node/Express + PGlite (pgvector)  ');
    console.log('====================================================');

    await initDatabase();

    server.listen(PORT, async () => {
      console.log(`[Clack Server] Listening live on http://localhost:${PORT}`);
      console.log(`[Clack WebSocket] Live sync ready on ws://localhost:${PORT}/ws`);
      console.log(`[Clack Database] PostgreSQL engine active with pgvector`);
      console.log('====================================================\n');

      // Erase existing ledger and seed user-defined 4-level ledger tree
      try {
        const result = await resetAndSeedUserLedgerTree();
        console.log(`[Clack Seed] User ledger tree seeded successfully: ${result.totalLedgers} ledgers, ${result.totalVouchers} vouchers.`);
      } catch (seedErr) {
        console.warn('[Clack] User ledger seed warning:', seedErr);
      }
    });
  } catch (err) {
    console.error('[Clack Server] Fatal startup error:', err);
    process.exit(1);
  }
}



start();
