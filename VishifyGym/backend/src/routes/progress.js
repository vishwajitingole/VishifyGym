import { Router } from 'express';
import DailyLog from '../models/DailyLog.js';
import User from '../models/User.js';
import WorkoutSession from '../models/WorkoutSession.js';
import { nutritionFor, volumeFor } from '../utils/metrics.js';

const router = Router();

const isoDay = (d) => d.toLocaleDateString('en-CA');
const addDays = (date, amount) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + amount); return d; };

router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);
    const date = req.query.date || isoDay(new Date());
    const rangeStart = isoDay(addDays(date, -(days - 1)));
    const [user, logs, sessions] = await Promise.all([
      User.findById(userId).lean(),
      DailyLog.find({ userId, date: { $gte: rangeStart, $lte: date } }).select('date eggs dahiBowls waterGlasses bodyweight notes').sort({ date: 1 }).lean(),
      WorkoutSession.find({ userId, date: { $gte: rangeStart, $lte: date } }).select('date type durationMinutes speed totalVolume exerciseLogs').lean()
    ]);
    const proteinTarget = user?.proteinTarget || 50;
    const cardioTarget = user?.cardioTargetMinutes || 20;
    const logByDate = Object.fromEntries(logs.map((log) => [log.date, log]));
    const sessionsByDate = {}; sessions.forEach((session) => (sessionsByDate[session.date] = [...(sessionsByDate[session.date] || []), session]));
    const daily = Array.from({ length: days }, (_, i) => {
      const day = addDays(rangeStart, i); const id = isoDay(day);
      const log = logByDate[id] || { eggs: 0, dahiBowls: 0, waterGlasses: 0 };
      const daySessions = sessionsByDate[id] || [];
      const nutrition = nutritionFor(log);
      const volume = daySessions.reduce((total, session) => total + (session.totalVolume || volumeFor(session.exerciseLogs)), 0);
      return {
        date: id, label: day.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
        eggs: log.eggs, dahiBowls: log.dahiBowls, waterGlasses: log.waterGlasses || 0, bodyweight: log.bodyweight,
        protein: nutrition.protein, calories: nutrition.calories,
        volume, workedOut: daySessions.length > 0,
        cardioMinutes: daySessions.filter((s) => s.type === 'cardio').reduce((t, s) => t + (s.durationMinutes || 0), 0)
      };
    });
    const lastSeven = daily.slice(-7);
    const proteinHits = lastSeven.filter((d) => d.protein >= proteinTarget).length;
    const cardioHits = lastSeven.filter((d) => d.cardioMinutes >= cardioTarget).length;
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
    const cardioSessions = sessions.filter((s) => s.type === 'cardio');
    const cardio = {
      sessions: cardioSessions.map((s) => ({ date: s.date, durationMinutes: s.durationMinutes || 0, speed: s.speed || 0 })),
      totalMinutes: cardioSessions.reduce((t, s) => t + (s.durationMinutes || 0), 0),
      avgMinutes: daily.length ? cardioSessions.reduce((t, s) => t + (s.durationMinutes || 0), 0) / daily.length : 0,
      best: cardioSessions.length ? Math.max(...cardioSessions.map((s) => s.durationMinutes || 0)) : 0,
      target: cardioTarget
    };
    res.json({ days, daily, exerciseMax, topSessions, pushupMilestones, streaks: { protein: proteinHits, cardio: cardioHits }, cardio });
  } catch (error) { next(error); }
});

router.get('/heatmap', async (req, res, next) => {
  try {
    const userId = req.userId;
    const days = Math.min(Math.max(Number(req.query.days) || 365, 7), 365);
    const date = req.query.date || isoDay(new Date());
    const start = isoDay(addDays(date, -(days - 1)));
    const sessions = await WorkoutSession.find({ userId, date: { $gte: start, $lte: date } }).select('date').lean();
    const byDate = {};
    sessions.forEach((session) => { byDate[session.date] = (byDate[session.date] || 0) + 1; });
    const heatmap = [];
    for (let i = 0; i < days; i++) { const id = isoDay(addDays(start, i)); heatmap.push({ date: id, count: byDate[id] || 0 }); }
    res.json({ days, start, end: date, heatmap });
  } catch (error) { next(error); }
});

router.get('/review', async (req, res, next) => {
  try {
    const userId = req.userId;
    const date = req.query.date || isoDay(new Date());
    const end = isoDay(addDays(date, -1));
    const start = isoDay(addDays(end, -6));
    const [logs, sessions] = await Promise.all([
      DailyLog.find({ userId, date: { $gte: start, $lte: end } }).select('date eggs dahiBowls waterGlasses bodyweight notes').sort({ date: 1 }).lean(),
      WorkoutSession.find({ userId, date: { $gte: start, $lte: end } }).select('date type durationMinutes speed totalVolume exerciseLogs').sort({ date: 1 }).lean()
    ]);
    const totals = {
      workouts: 0, push: 0, pull: 0, cardio: 0,
      volume: sessions.reduce((t, s) => t + (s.totalVolume || volumeFor(s.exerciseLogs)), 0),
      cardioMinutes: sessions.filter((s) => s.type === 'cardio').reduce((t, s) => t + (s.durationMinutes || 0), 0),
      eggs: logs.reduce((t, l) => t + l.eggs, 0),
      dahiBowls: logs.reduce((t, l) => t + l.dahiBowls, 0),
      waterGlasses: logs.reduce((t, l) => t + (l.waterGlasses || 0), 0),
      protein: logs.reduce((t, l) => t + nutritionFor(l).protein, 0)
    };
    sessions.forEach((s) => { if (s.type === 'cardio') totals.cardio++; else { totals.workouts++; totals[s.type] = (totals[s.type] || 0) + 1; } });
    const ranked = sessions.slice().sort((a, b) => (b.totalVolume || 0) - (a.totalVolume || 0));
    const topSession = ranked[0];
    const prs = [];
    ranked.forEach((session) => session.exerciseLogs.forEach((entry) => {
      if (prs.length >= 3) return;
      const best = entry.sets.reduce((m, set) => Math.max(m, set.weight || 0), 0);
      if (best > 0) prs.push({ exercise: entry.exerciseName, value: best, date: session.date });
    }));
    res.json({
      start, end,
      totals,
      prs,
      topSession: topSession ? { date: topSession.date, type: topSession.type, volume: topSession.totalVolume || volumeFor(topSession.exerciseLogs), exerciseCount: (topSession.exerciseLogs || []).length } : null
    });
  } catch (error) { next(error); }
});

export default router;