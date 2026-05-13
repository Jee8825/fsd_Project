import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import bootstrapRoutes from './routes/bootstrap.js';
import resourceRoutes from './routes/resources.js';

const app = express();
const allowedOrigins = Array.from(
  new Set([env.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean)),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/bootstrap', bootstrapRoutes);
app.use('/api', resourceRoutes);

// In production (Elastic Beanstalk), serve the Vite build from the same process.
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.resolve(__dirname, '../../dist');

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get(/^\/(?!api).*/, (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    message: error.message || 'Internal server error',
  });
});

export default app;
