import { Router } from 'express';
import DailyLog from '../models/DailyLog.js';
import User from '../models/User.js';
import WorkoutSession from '../models/WorkoutSession.js';
import { nutritionFor } from '../utils/metrics.js';

const router = Router();
const isoDay = (shift = 0) => { const d = new Date(); d.setDate(d.getDate() + shift); return d.toISOString().slice(0, 10); };

router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    const date = req.query.date || isoDay();
    const sevenDaysAgo = new Date(`${date}T12:00:00`); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const rangeStart = sevenDaysAgo.toISOString().slice(0, 10);
    const [user, today, recentLogs, todayWorkouts, allWorkouts] = await Promise.all([
      User.findById(userId),
      DailyLog.findOneAndUpdate({ userId, date }, { $setOnInsert: { userId, date } }, { new: true, upsert: true }),
      DailyLog.find({ userId, date: { $gte: rangeStart, $lte: date } }).sort({ date: 1 }),
      WorkoutSession.find({ userId, date }),
      WorkoutSession.find({ userId, date: { $gte: rangeStart, $lte: date } })
    ]);
    const targets = {
      proteinTarget: user?.proteinTarget || 130,
      calorieTarget: user?.calorieTarget || 2400,
      cardioTargetMinutes: user?.cardioTargetMinutes || 20
    };
    const totals = recentLogs.reduce((acc, log) => ({ eggs: acc.eggs + log.eggs, dahiBowls: acc.dahiBowls + log.dahiBowls }), { eggs: 0, dahiBowls: 0 });
    const logByDate = Object.fromEntries(recentLogs.map((log) => [log.date, log]));
    const workoutsByDate = allWorkouts.reduce((acc, workout) => ({ ...acc, [workout.date]: [...(acc[workout.date] || []), workout] }), {});
    const weekly = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(`${rangeStart}T12:00:00`); day.setDate(day.getDate() + i); const id = day.toISOString().slice(0, 10);
      const log = logByDate[id] || { eggs: 0, dahiBowls: 0, waterGlasses: 0 };
      const dayWorkouts = workoutsByDate[id] || [];
      return {
        date: id,
        label: day.toLocaleDateString('en', { weekday: 'short' }),
        eggs: log.eggs, dahiBowls: log.dahiBowls, waterGlasses: log.waterGlasses, bodyweight: log.bodyweight,
        protein: nutritionFor(log).protein,
        calories: nutritionFor(log).calories,
        workedOut: dayWorkouts.length > 0,
        cardioMinutes: dayWorkouts.filter((w) => w.type === 'cardio').reduce((t, w) => t + (w.durationMinutes || 0), 0)
      };
    });
    const proteinStreak = (() => {
      let streak = 0;
      for (let i = weekly.length - 1; i >= 0; i--) {
        if (weekly[i].protein >= targets.proteinTarget) streak++;
        else break;
      }
      return streak;
    })();
    const cardioStreak = (() => {
      let streak = 0;
      for (let i = weekly.length - 1; i >= 0; i--) {
        if (weekly[i].cardioMinutes >= targets.cardioTargetMinutes) streak++;
        else break;
      }
      return streak;
    })();
    res.json({
      today: { ...today.toObject(), ...targets, nutrition: nutritionFor(today) },
      workouts: todayWorkouts,
      weekly,
      forecast: { eggs: Math.ceil(totals.eggs / 7 * 7), dahiBowls: Math.ceil(totals.dahiBowls / 7 * 7) },
      streaks: { protein: proteinStreak, cardio: cardioStreak },
      user: { name: user?.name, email: user?.email }
    });
  } catch (error) { next(error); }
});

export default router;