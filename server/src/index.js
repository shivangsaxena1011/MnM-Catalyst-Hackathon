import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { initDatabase } from './db/database.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { checkAndEscalateDoses } from './services/escalationService.js';

// Route imports
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import medicationRoutes from './routes/medications.js';
import logRoutes from './routes/logs.js';
import appointmentRoutes from './routes/appointments.js';
import escalationRoutes from './routes/escalations.js';
import timelineRoutes from './routes/timeline.js';
import notificationRoutes from './routes/notifications.js';
import aiRoutes from './routes/ai.js';
import demoRoutes from './routes/demo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite database
initDatabase();

// Core Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use('/api', apiRateLimiter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'SAATHI CARE API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/escalations', escalationRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/demo', demoRoutes);

// In production, serve the built Vite client
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SAATHI CARE Backend running on http://localhost:${PORT}`);
  console.log(`🔒 Security: Passcode hashing, Rate Limiting & Auth active`);
  console.log(`🛡️ Escalation Engine: Ready & Monitoring`);
  console.log(`=======================================================`);
});

// Periodic background escalation check every 10 minutes
const ESCALATION_INTERVAL_MS = 10 * 60 * 1000;
setInterval(() => {
  checkAndEscalateDoses().catch(err => {
    console.error('[Background Escalation Error]:', err.message);
  });
}, ESCALATION_INTERVAL_MS);

export default app;
