import { Router } from 'express';
import DailyLog from '../models/DailyLog.js';
import WorkoutSession from '../models/WorkoutSession.js';
import User from '../models/User.js';
import { nutritionFor } from '../utils/metrics.js';

const router = Router();
const isoDay = () => new Date().toLocaleDateString('en-CA');

router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    const from = req.query.from;
    const to = req.query.to || isoDay();
    const range = {
      ...(from ? { $gte: from } : {}),
      ...(to ? { $lte: to } : {})
    };
    const logCondition = { userId, date: range };
    const sessionCondition = { userId, date: range };
    if (req.query.type) sessionCondition.type = req.query.type;
    if (req.query.exercise) sessionCondition['exerciseLogs.exerciseName'] = req.query.exercise;

    const [logs, sessions, user] = await Promise.all([
      DailyLog.find(logCondition).select('date eggs dahiBowls waterGlasses bodyweight notes').sort({ date: 1 }).lean(),
      WorkoutSession.find(sessionCondition).select('date type durationMinutes speed totalVolume exerciseLogs').sort({ date: -1, createdAt: -1 }).lean(),
      User.findById(userId).lean()
    ]);

    const days = new Map();
    logs.forEach((log) => days.set(log.date, { date: log.date, log, sessions: [] }));
    sessions.forEach((s) => {
      const slot = days.get(s.date) || { date: s.date, log: null, sessions: [] };
      slot.sessions.push(s);
      days.set(s.date, slot);
    });

    res.json({
      date: to,
      targets: {
        proteinTarget: user?.proteinTarget || 50,
        calorieTarget: user?.calorieTarget || 900,
        cardioTargetMinutes: user?.cardioTargetMinutes || 20
      },
      totals: {
        days: days.size,
        sessions: sessions.length,
        workouts: sessions.filter((s) => s.type !== 'cardio').length,
        cardioMinutes: sessions.filter((s) => s.type === 'cardio').reduce((total, s) => total + (s.durationMinutes || 0), 0),
        volume: sessions.reduce((total, s) => total + (s.totalVolume || 0), 0),
        waterGlasses: logs.reduce((total, l) => total + (l.waterGlasses || 0), 0)
      },
      days: [...days.values()].sort((a, b) => b.date.localeCompare(a.date))
    });
  } catch (error) { next(error); }
});

export default router;