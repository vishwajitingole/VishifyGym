import { Router } from 'express';
import DailyLog from '../models/DailyLog.js';
import WorkoutSession from '../models/WorkoutSession.js';
import { nutritionFor } from '../utils/metrics.js';

const router = Router();
const isoDay = (shift = 0) => { const d = new Date(); d.setDate(d.getDate() + shift); return d.toISOString().slice(0, 10); };

router.get('/', async (req, res, next) => {
  try {
    const date = req.query.date || isoDay();
    const sevenDaysAgo = new Date(`${date}T12:00:00`); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const rangeStart = sevenDaysAgo.toISOString().slice(0, 10);
    const [today, recentLogs, todayWorkouts, allWorkouts] = await Promise.all([
      DailyLog.findOneAndUpdate({ date }, { $setOnInsert: { date } }, { new: true, upsert: true }),
      DailyLog.find({ date: { $gte: rangeStart, $lte: date } }).sort({ date: 1 }),
      WorkoutSession.find({ date }),
      WorkoutSession.find({ date: { $gte: rangeStart, $lte: date } })
    ]);
    const totals = recentLogs.reduce((acc, log) => ({ eggs: acc.eggs + log.eggs, dahiBowls: acc.dahiBowls + log.dahiBowls }), { eggs: 0, dahiBowls: 0 });
    const logByDate = Object.fromEntries(recentLogs.map((log) => [log.date, log]));
    const weekly = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(`${rangeStart}T12:00:00`); day.setDate(day.getDate() + i); const id = day.toISOString().slice(0, 10); const log = logByDate[id] || { eggs: 0, dahiBowls: 0, waterGlasses: 0, proteinTarget: 130 };
      return { date: id, label: day.toLocaleDateString('en', { weekday: 'short' }), ...log, protein: nutritionFor(log).protein, workedOut: allWorkouts.some((workout) => workout.date === id) };
    });
    res.json({
      today: { ...today.toObject(), nutrition: nutritionFor(today) },
      workouts: todayWorkouts,
      weekly,
      forecast: { eggs: Math.ceil(totals.eggs / 7 * 7), dahiBowls: Math.ceil(totals.dahiBowls / 7 * 7) }
    });
  } catch (error) { next(error); }
});

export default router;
