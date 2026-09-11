import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { connectDatabase } from './config/db.js';
import auth from './routes/auth.js';
import dailyLogs from './routes/dailyLogs.js';
import dashboard from './routes/dashboard.js';
import exercises from './routes/exercises.js';
import exportRouter from './routes/export.js';
import logs from './routes/logs.js';
import progress from './routes/progress.js';
import workouts from './routes/workouts.js';
import { requireAuth } from './utils/auth.js';

const app = express();
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api', async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', auth);
app.use('/api/exercises', requireAuth, exercises);
app.use('/api/daily-logs', requireAuth, dailyLogs);
app.use('/api/workouts', requireAuth, workouts);
app.use('/api/dashboard', requireAuth, dashboard);
app.use('/api/progress', requireAuth, progress);
app.use('/api/logs', requireAuth, logs);
app.use('/api/export', requireAuth, exportRouter);

app.use((error, _req, res, _next) => {
  if (/Mongo|mongoose|buffering|ServerSelection|connect/i.test(`${error?.name || ''} ${error?.message || ''}`)) {
    return res.status(503).json({ message: 'Database unreachable right now. Check that MONGODB_URI is set on Vercel and that Atlas Network Access allows all IPs (0.0.0.0/0).' });
  }
  if (error?.code === 11000) return res.status(409).json({ message: 'That already exists.' });
  if (error?.name === 'ValidationError') return res.status(400).json({ message: error.message });
  console.error(error);
  res.status(500).json({ message: 'Something went wrong.' });
});

export default app;