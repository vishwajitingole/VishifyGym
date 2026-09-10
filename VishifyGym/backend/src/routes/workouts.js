import { Router } from 'express';
import WorkoutSession from '../models/WorkoutSession.js';
import { maxRepsFor, maxWeightFor, volumeFor } from '../utils/metrics.js';

const router = Router();

router.get('/last/:type', async (req, res, next) => {
  try { res.json(await WorkoutSession.findOne({ userId: req.userId, type: req.params.type }).sort({ date: -1, createdAt: -1 }) || null); } catch (error) { next(error); }
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
    res.status(201).json({ session: saved, personalRecords });
  } catch (error) { next(error); }
});

export default router;