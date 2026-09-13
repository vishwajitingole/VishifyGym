import { Router } from 'express';
import DailyLog from '../models/DailyLog.js';
import WorkoutSession from '../models/WorkoutSession.js';

const router = Router();
const value = (cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`;

router.get('/csv', async (_req, res, next) => {
  try {
    const userId = _req.userId;
    const [logs, sessions] = await Promise.all([DailyLog.find({ userId }).sort({ date: 1 }).lean(), WorkoutSession.find({ userId }).sort({ date: 1 }).lean()]);
    const rows = [['kind', 'date', 'eggs', 'dahi_bowls', 'water_glasses', 'bodyweight_kg', 'workout_type', 'total_volume_kg', 'exercise_data']];
    logs.forEach((log) => rows.push(['daily', log.date, log.eggs, log.dahiBowls, log.waterGlasses, log.bodyweight, '', '', '']));
    sessions.forEach((session) => rows.push(['workout', session.date, '', '', '', '', session.type, session.totalVolume, JSON.stringify(session.exerciseLogs)]));
    res.type('text/csv').attachment('vishify-gym-history.csv').send(rows.map((row) => row.map(value).join(',')).join('\n'));
  } catch (error) { next(error); }
});
export default router;
