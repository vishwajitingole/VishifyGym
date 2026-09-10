import { Router } from 'express';
import WorkoutSession from '../models/WorkoutSession.js';
import User from '../models/User.js';
import { maxRepsFor, maxWeightFor, suggestProgression, volumeFor } from '../utils/metrics.js';

const router = Router();

const typeRecord = (session, previous, current) => ({
  broke: current > previous && current > 0,
  previous: Math.round(previous * 100) / 100,
  current: Math.round(current * 100) / 100
});

router.get('/last/:type', async (req, res, next) => {
  try {
    const session = await WorkoutSession.findOne({ userId: req.userId, type: req.params.type }).sort({ date: -1, createdAt: -1 });
    if (!session) return res.json({ session: null, suggested: {} });
    const suggested = {};
    session.exerciseLogs.forEach((entry) => {
      const suggestion = suggestProgression(entry);
      if (suggestion) suggested[entry.exerciseName] = suggestion;
    });
    res.json({ session, suggested });
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const query = { userId: req.userId };
    if (req.query.from || req.query.to) query.date = { ...(req.query.from && { $gte: req.query.from }), ...(req.query.to && { $lte: req.query.to }) };
    if (req.query.type) query.type = req.query.type;
    res.json(await WorkoutSession.find(query).sort({ date: -1, createdAt: -1 }));
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    const session = { userId, ...req.body, totalVolume: volumeFor(req.body.exerciseLogs) };
    if (new Date(`${session.date}T12:00:00`).getDay() === 0 && session.type === 'push') return res.status(422).json({ message: 'Sunday is reserved strictly for Pushups.' });
    if (session.type === 'pushups') session.exerciseLogs = session.exerciseLogs.filter((entry) => entry.exerciseName === 'Pushups');
    const names = [...new Set(session.exerciseLogs.map((entry) => entry.exerciseName).filter(Boolean))];
    const previousMax = Object.fromEntries(names.map((name) => [name, { weight: 0, reps: 0 }]));
    if (names.length) {
      const previous = await WorkoutSession.find({ userId, 'exerciseLogs.exerciseName': { $in: names } });
      previous.forEach((oldSession) => oldSession.exerciseLogs.forEach((entry) => {
        if (Object.hasOwn(previousMax, entry.exerciseName)) {
          previousMax[entry.exerciseName].weight = Math.max(previousMax[entry.exerciseName].weight, maxWeightFor(entry));
          previousMax[entry.exerciseName].reps = Math.max(previousMax[entry.exerciseName].reps, maxRepsFor(entry));
        }
      }));
    }
    const saved = await WorkoutSession.create(session);
    const personalRecords = saved.exerciseLogs.flatMap((entry) => {
      const prior = previousMax[entry.exerciseName] || { weight: 0, reps: 0 };
      const records = [];
      if (maxWeightFor(entry) > prior.weight) records.push({ exercise: entry.exerciseName, metric: 'weight', value: maxWeightFor(entry) });
      if (maxRepsFor(entry) > prior.reps) records.push({ exercise: entry.exerciseName, metric: 'reps', value: maxRepsFor(entry) });
      return records;
    });

    const records = {};
    const prior = await WorkoutSession.find({ userId, type: session.type, _id: { $ne: saved._id } });
    if (session.type === 'push' || session.type === 'pull') {
      const previousBest = prior.reduce((max, s) => Math.max(max, s.totalVolume || volumeFor(s.exerciseLogs)), 0);
      records.volumeRecord = typeRecord(saved, previousBest, saved.totalVolume || 0);
    }
    if (session.type === 'cardio') {
      const previousBest = prior.reduce((max, s) => Math.max(max, s.durationMinutes || 0), 0);
      const user = await User.findById(userId);
      const cardioTarget = user?.cardioTargetMinutes || 20;
      records.cardioRecord = { ...typeRecord(saved, previousBest, session.durationMinutes || 0), hitTarget: (session.durationMinutes || 0) >= cardioTarget, target: cardioTarget };
    }
    if (session.type === 'pushups') {
      const pushupEntry = saved.exerciseLogs.find((e) => e.exerciseName === 'Pushups') || { sets: [] };
      const reps = pushupEntry.sets.reduce((total, set) => total + (set.completed === false ? 0 : set.reps || 0), 0);
      const previousBest = prior.reduce((max, s) => Math.max(max, (s.exerciseLogs.find((e) => e.exerciseName === 'Pushups')?.sets || []).reduce((t, set) => t + (set.completed === false ? 0 : set.reps || 0), 0)), 0);
      records.pushupRecord = { ...typeRecord(saved, previousBest, reps), reps };
    }

    res.status(201).json({ session: saved, personalRecords, ...records });
  } catch (error) { next(error); }
});

export default router;