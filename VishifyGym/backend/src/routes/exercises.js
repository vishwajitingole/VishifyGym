import { Router } from 'express';
import Exercise from '../models/Exercise.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try { res.json(await Exercise.find({ userId: req.userId }).sort({ category: 1, order: 1, name: 1 })); } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, category } = req.body;
    if (!name || !['cardio', 'push', 'pull'].includes(category)) return res.status(400).json({ message: 'Name and valid category are required.' });
    const order = await Exercise.countDocuments({ userId: req.userId, category });
    res.status(201).json(await Exercise.create({ userId: req.userId, name, category, order }));
  } catch (error) { next(error); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'category', 'active'];
    const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const exercise = await Exercise.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, update, { new: true, runValidators: true });
    if (!exercise) return res.status(404).json({ message: 'Exercise not found.' });
    res.json(exercise);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const exercise = await Exercise.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!exercise) return res.status(404).json({ message: 'Exercise not found.' });
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;