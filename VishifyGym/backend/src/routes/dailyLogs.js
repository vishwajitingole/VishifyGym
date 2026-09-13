import { Router } from 'express';
import DailyLog from '../models/DailyLog.js';
import User from '../models/User.js';
import { nutritionFor } from '../utils/metrics.js';

const router = Router();
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const withTargets = async (log) => {
  const user = await User.findById(log.userId);
  return {
    ...log.toObject(),
    proteinTarget: user?.proteinTarget || 50,
    calorieTarget: user?.calorieTarget || 900,
    cardioTargetMinutes: user?.cardioTargetMinutes || 20,
    nutrition: nutritionFor(log)
  };
};

router.get('/:date', async (req, res, next) => {
  try {
    if (!datePattern.test(req.params.date)) return res.status(400).json({ message: 'Use YYYY-MM-DD.' });
    const log = await DailyLog.findOneAndUpdate({ userId: req.userId, date: req.params.date }, { $setOnInsert: { userId: req.userId, date: req.params.date } }, { new: true, upsert: true });
    res.json(await withTargets(log));
  } catch (error) { next(error); }
});

router.patch('/:date', async (req, res, next) => {
  try {
    const allowed = ['eggs', 'dahiBowls', 'waterGlasses', 'bodyweight', 'notes'];
    const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const log = await DailyLog.findOneAndUpdate({ userId: req.userId, date: req.params.date }, { $set: update, $setOnInsert: { userId: req.userId, date: req.params.date } }, { new: true, upsert: true, runValidators: true });
    res.json(await withTargets(log));
  } catch (error) { next(error); }
});

router.post('/:date/quick-add', async (req, res, next) => {
  try {
    const increments = { egg: { eggs: 1 }, dahi: { dahiBowls: 1 }, water: { waterGlasses: 1 }, bottle: { waterGlasses: 4 } };
    const update = increments[req.body.item];
    if (!update) return res.status(400).json({ message: 'item must be egg, dahi, water, or bottle.' });
    const log = await DailyLog.findOneAndUpdate({ userId: req.userId, date: req.params.date }, { $inc: update, $setOnInsert: { userId: req.userId, date: req.params.date } }, { new: true, upsert: true });
    res.json(await withTargets(log));
  } catch (error) { next(error); }
});

export default router;