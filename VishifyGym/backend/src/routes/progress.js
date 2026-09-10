import { Router } from 'express';
import DailyLog from '../models/DailyLog.js';
import WorkoutSession from '../models/WorkoutSession.js';
import { nutritionFor, volumeFor } from '../utils/metrics.js';

const router = Router();

const isoDay = (d) => d.toISOString().slice(0, 10);
const addDays = (date, amount) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + amount); return d; };

router.get('/', async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);
    const date = req.query.date || isoDay(new Date());
    const rangeStart = isoDay(addDays(date, -(days - 1)));
    const [logs, sessions] = await Promise.all([
      DailyLog.find({ date: { $gte: rangeStart, $lte: date } }).sort({ date: 1 }),
      WorkoutSession.find({ date: { $gte: rangeStart, $lte: date } })
    ]);
    const logByDate = Object.fromEntries(logs.map((log) => [log.date, log]));
    const sessionsByDate = {}; sessions.forEach((session) => (sessionsByDate[session.date] = [...(sessionsByDate[session.date] || []), session]));
    const daily = Array.from({ length: days }, (_, i) => {
      const day = addDays(rangeStart, i); const id = isoDay(day);
      const log = logByDate[id] || { eggs: 0, dahiBowls: 0, waterGlasses: 0 };
      const daySessions = sessionsByDate[id] || [];
      const nutrition = nutritionFor(log);
      const bodyweight = log.bodyweight || null;
      const volume = daySessions.reduce((total, session) => total + (session.totalVolume || volumeFor(session.exerciseLogs)), 0);
      return {
        date: id, label: day.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
        eggs: log.eggs, dahiBowls: log.dahiBowls, waterGlasses: log.waterGlasses,
        protein: nutrition.protein, calories: nutrition.calories, bodyweight,
        volume, workedOut: daySessions.length > 0,
        cardioMinutes: daySessions.filter((s) => s.type === 'cardio').reduce((t, s) => t + (s.durationMinutes || 0), 0)
      };
    });
    const lastSeven = daily.slice(-7);
    const proteinHits = lastSeven.filter((d) => d.protein >= 130).length;
    const cardioHits = lastSeven.filter((d) => d.cardioMinutes >= 20).length;
    const exerciseMax = {};
    sessions.forEach((session) => session.exerciseLogs.forEach((entry) => {
      const max = Math.max(0, ...entry.sets.map((set) => set.weight || 0));
      if (max > 0 && (entry.exerciseName || '')) exerciseMax[entry.exerciseName] = Math.max(exerciseMax[entry.exerciseName] || 0, max);
    }));
    const topSessions = sessions.slice().sort((a, b) => (b.totalVolume || 0) - (a.totalVolume || 0)).slice(0, 5);
    const pushupSessions = sessions.filter((s) => s.type === 'pushups' || s.exerciseLogs.some((e) => e.exerciseName === 'Pushups'));
    const pushupMilestones = pushupSessions.map((session) => {
      const pushupEntry = session.exerciseLogs.find((e) => e.exerciseName === 'Pushups') || { sets: [] };
      const reps = pushupEntry.sets.reduce((total, set) => total + (set.completed === false ? 0 : set.reps || 0), 0);
      return { date: session.date, reps };
    }).filter((m) => m.reps > 0);
    res.json({ days, daily, exerciseMax, topSessions, pushupMilestones, streaks: { protein: proteinHits, cardio: cardioHits } });
  } catch (error) { next(error); }
});

export default router;