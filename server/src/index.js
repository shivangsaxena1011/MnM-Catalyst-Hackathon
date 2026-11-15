import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { initDatabase } from './db/database.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import {
  checkAndEscalateDoses,
  checkAndSendAppointmentReminders,
  checkAndSendUpcomingDoseReminders
} from './services/escalationService.js';

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

// 1. Content Security Policy & Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'https://generativelanguage.googleapis.com'],
        workerSrc: ["'self'", 'blob:'],
        childSrc: ["'self'", 'blob:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Strict CORS Configuration: Exact-match Set
const allowedOrigins = new Set();
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean).forEach(o => allowedOrigins.add(o));
}
if (process.env.RENDER_EXTERNAL_URL) {
  allowedOrigins.add(process.env.RENDER_EXTERNAL_URL.trim());
}
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://localhost:5000');
  allowedOrigins.add('http://127.0.0.1:5173');
  allowedOrigins.add('http://127.0.0.1:5000');
  if (process.env.PORT) {
    allowedOrigins.add(`http://localhost:${process.env.PORT}`);
    allowedOrigins.add(`http://127.0.0.1:${process.env.PORT}`);
  }
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser agents, curl, mobile, or same-origin requests with no Origin header
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy violation: Origin '${origin}' is not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
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

// Global Error Handler - Sanitizes error messages to prevent sensitive leaks
app.use((err, req, res, next) => {
  console.error('[Application Error]:', err.message);
  
  if (err.message && err.message.includes('CORS policy violation')) {
    return res.status(403).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'An unexpected internal error occurred' 
      : (err.message || 'Internal Server Error'),
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

// Reliable background escalation and reminder runner every 10 minutes
const ESCALATION_INTERVAL_MS = 10 * 60 * 1000;
setInterval(() => {
  checkAndEscalateDoses().catch(err => {
    console.error('[Background Escalation Error]:', err.message);
  });
  checkAndSendAppointmentReminders().catch(err => {
    console.error('[Background Appointment Reminder Error]:', err.message);
  });
  checkAndSendUpcomingDoseReminders().catch(err => {
    console.error('[Background Upcoming Dose Error]:', err.message);
  });
}, ESCALATION_INTERVAL_MS);

export default app;
