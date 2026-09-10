import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import { connectDatabase } from './config/db.js';
import dailyLogs from './routes/dailyLogs.js';
import dashboard from './routes/dashboard.js';
import exercises from './routes/exercises.js';
import exportRouter from './routes/export.js';
import progress from './routes/progress.js';
import workouts from './routes/workouts.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/exercises', exercises);
app.use('/api/daily-logs', dailyLogs);
app.use('/api/workouts', workouts);
app.use('/api/dashboard', dashboard);
app.use('/api/progress', progress);
app.use('/api/export', exportRouter);
app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(error.code === 11000 ? 409 : 500).json({ message: error.code === 11000 ? 'That exercise already exists.' : 'Something went wrong.' });
});

connectDatabase().then(async() => {
    const { default: Exercise } = await
    import ('./models/Exercise.js');
    const { EXERCISE_SEED } = await
    import ('./constants.js');
    await Exercise.bulkWrite(EXERCISE_SEED.map((exercise) => ({ updateOne: { filter: { name: exercise.name, category: exercise.category }, update: { $setOnInsert: exercise }, upsert: true } })));
    app.listen(process.env.PORT || 4000, () => console.log('Vishify Gym API listening on port 4000'));
}).catch((error) => {
    console.error('Database connection failed', error);
    process.exit(1);
});