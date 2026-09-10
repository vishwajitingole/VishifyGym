import { Router } from 'express';
import DailyLog from '../models/DailyLog.js';
import { nutritionFor } from '../utils/metrics.js';

const router = Router();
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

router.get('/:date', async (req, res, next) => {
  try {
    if (!datePattern.test(req.params.date)) return res.status(400).json({ message: 'Use YYYY-MM-DD.' });
    const log = await DailyLog.findOneAndUpdate({ date: req.params.date }, { $setOnInsert: { date: req.params.date } }, { new: true, upsert: true });
    res.json({ ...log.toObject(), nutrition: nutritionFor(log) });
  } catch (error) { next(error); }
});

router.patch('/:date', async (req, res, next) => {
  try {
    const allowed = ['eggs', 'dahiBowls', 'waterGlasses', 'bodyweight', 'proteinTarget', 'calorieTarget', 'cardioTargetMinutes', 'notes'];
    const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const log = await DailyLog.findOneAndUpdate({ date: req.params.date }, { $set: update, $setOnInsert: { date: req.params.date } }, { new: true, upsert: true, runValidators: true });
    res.json({ ...log.toObject(), nutrition: nutritionFor(log) });
  } catch (error) { next(error); }
});

router.post('/:date/quick-add', async (req, res, next) => {
  try {
    const increments = { egg: { eggs: 1 }, dahi: { dahiBowls: 1 }, water: { waterGlasses: 1 } };
    const update = increments[req.body.item];
    if (!update) return res.status(400).json({ message: 'item must be egg, dahi, or water.' });
    const log = await DailyLog.findOneAndUpdate({ date: req.params.date }, { $inc: update, $setOnInsert: { date: req.params.date } }, { new: true, upsert: true });
    res.json({ ...log.toObject(), nutrition: nutritionFor(log) });
  } catch (error) { next(error); }
});

export default router;
