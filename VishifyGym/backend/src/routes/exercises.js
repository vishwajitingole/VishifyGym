import { Router } from 'express';
import Exercise from '../models/Exercise.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try { res.json(await Exercise.find().sort({ category: 1, order: 1, name: 1 })); } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, category } = req.body;
    if (!name || !['cardio', 'push', 'pull'].includes(category)) return res.status(400).json({ message: 'Name and valid category are required.' });
    const order = await Exercise.countDocuments({ category });
    res.status(201).json(await Exercise.create({ name, category, order }));
  } catch (error) { next(error); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const exercise = await Exercise.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!exercise) return res.status(404).json({ message: 'Exercise not found.' });
    res.json(exercise);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const exercise = await Exercise.findByIdAndDelete(req.params.id);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found.' });
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
