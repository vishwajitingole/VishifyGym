import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth, signToken } from '../utils/auth.js';
import { seedUserExercises } from '../utils/seedUser.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: 'Name, email, and password are required.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'An account with that email already exists.' });
    const user = await User.createUser(name.trim(), email, password);
    await seedUserExercises(user._id);
    res.status(201).json({ token: signToken(user), user: { _id: user._id, name: user.name, email: user.email }, seeded: true });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid email or password.' });
    await seedUserExercises(user._id);
    res.json({ token: signToken(user), user: { _id: user._id, name: user.name, email: user.email } });
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ _id: user._id, name: user.name, email: user.email, proteinTarget: user.proteinTarget, calorieTarget: user.calorieTarget, cardioTargetMinutes: user.cardioTargetMinutes });
  } catch (error) { next(error); }
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const valid = ['proteinTarget', 'calorieTarget', 'cardioTargetMinutes'];
    const sanitized = {};
    Object.entries(req.body || {}).forEach(([key, value]) => {
      if (!valid.includes(key)) return;
      const clamped = Math.max(0, Math.min(10000, Number(value) || 0));
      sanitized[key] = key === 'cardioTargetMinutes' ? Math.round(clamped) : Math.round(clamped * 2) / 2;
    });
    const user = await User.findByIdAndUpdate(req.userId, sanitized, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ _id: user._id, name: user.name, email: user.email, proteinTarget: user.proteinTarget, calorieTarget: user.calorieTarget, cardioTargetMinutes: user.cardioTargetMinutes });
  } catch (error) { next(error); }
});

export default router;