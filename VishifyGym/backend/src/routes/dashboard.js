import { Router } from 'express';
import DailyLog from '../models/DailyLog.js';
import User from '../models/User.js';
import WorkoutSession from '../models/WorkoutSession.js';
import { nutritionFor, volumeFor } from '../utils/metrics.js';

const router = Router();
const isoDay = (shift = 0) => { const d = new Date(); d.setDate(d.getDate() + shift); return d.toLocaleDateString('en-CA'); };

router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    const date = req.query.date || isoDay();
    const rangeStart = isoDay(-6);
    const priorStart = isoDay(-13);
    let [user, today, recentLogs, priorLogs, todayWorkouts, recentWorkouts, priorWorkouts] = await Promise.all([
      User.findById(userId).lean(),
      DailyLog.findOne({ userId, date }).lean(),
      DailyLog.find({ userId, date: { $gte: rangeStart, $lte: date } }).select('date eggs dahiBowls waterGlasses bodyweight notes').sort({ date: 1 }).lean(),
      DailyLog.find({ userId, date: { $gte: priorStart, $lt: rangeStart } }).select('date eggs dahiBowls waterGlasses bodyweight notes').sort({ date: 1 }).lean(),
      WorkoutSession.find({ userId, date }).select('date type durationMinutes speed totalVolume exerciseLogs').lean(),
      WorkoutSession.find({ userId, date: { $gte: rangeStart, $lte: date } }).select('date type durationMinutes speed totalVolume exerciseLogs').lean(),
      WorkoutSession.find({ userId, date: { $gte: priorStart, $lt: rangeStart } }).select('date type durationMinutes speed totalVolume exerciseLogs').lean()
    ]);
    if (!today) {
      const created = await DailyLog.create({ userId, date });
      today = { _id: created._id, userId, date, eggs: 0, dahiBowls: 0, waterGlasses: 0, bodyweight: null, notes: '' };
    } else {
      today = { ...today, waterGlasses: today.waterGlasses ?? 0, notes: today.notes ?? '' };
    }
    const targets = {
      proteinTarget: user?.proteinTarget || 50,
      calorieTarget: user?.calorieTarget || 900,
      cardioTargetMinutes: user?.cardioTargetMinutes || 20
    };
    const todayNutrition = nutritionFor(today);
    const totals = recentLogs.reduce((acc, log) => ({ eggs: acc.eggs + log.eggs, dahiBowls: acc.dahiBowls + log.dahiBowls }), { eggs: 0, dahiBowls: 0 });
    const logByDate = Object.fromEntries(recentLogs.map((log) => [log.date, log]));
    const workoutsByDate = recentWorkouts.reduce((acc, workout) => ({ ...acc, [workout.date]: [...(acc[workout.date] || []), workout] }), {});
    const weekly = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(`${rangeStart}T12:00:00`); day.setDate(day.getDate() + i); const id = day.toISOString().slice(0, 10);
      const log = logByDate[id] || { eggs: 0, dahiBowls: 0, waterGlasses: 0 };
      const dayWorkouts = workoutsByDate[id] || [];
      return {
        date: id,
        label: day.toLocaleDateString('en', { weekday: 'short' }),
        eggs: log.eggs, dahiBowls: log.dahiBowls, waterGlasses: log.waterGlasses || 0,
        bodyweight: log.bodyweight,
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

    const counts = recentWorkouts.reduce((acc, w) => ({ ...acc, [w.type]: (acc[w.type] || 0) + 1 }), {});
    const trace = [...recentWorkouts, ...priorWorkouts];
    const weekVolume = recentWorkouts.reduce((t, w) => t + (w.totalVolume || volumeFor(w.exerciseLogs)), 0);
    const priorVolume = priorWorkouts.reduce((t, w) => t + (w.totalVolume || volumeFor(w.exerciseLogs)), 0);
    const trend = priorVolume > 0
      ? { dir: weekVolume >= priorVolume ? 'up' : 'down', pct: Math.abs(Math.round(((weekVolume - priorVolume) / priorVolume) * 100)) }
      : { dir: 'flat', pct: 0 };

    const sunday = new Date(`${date}T12:00:00`).getDay() === 0;
    const trainedToday = todayWorkouts.some((w) => w.type !== 'cardio');
    const cardioToday = todayWorkouts.some((w) => w.type === 'cardio');
    const fueled = todayNutrition.protein >= targets.proteinTarget;

    const schedule = user?.schedule || {};
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
    const scheduled = sunday ? null : schedule[String(dayOfWeek)] || null;

    const weekStartDate = new Date(`${date}T12:00:00`);
    weekStartDate.setDate(weekStartDate.getDate() - ((weekStartDate.getDay() + 6) % 7));
    const weekStartId = weekStartDate.toLocaleDateString('en-CA');
    const weekWorkouts = recentWorkouts.filter((w) => w.date >= weekStartId);
    const weekLogs = recentLogs.filter((l) => l.date >= weekStartId);
    const weekTypeByDate = Object.fromEntries(weekWorkouts.map((w) => [w.date, w.type]));

    const daysSinceMonday = Math.round((new Date(`${date}T12:00:00`) - weekStartDate) / 86400000);
    let missed = null;
    if (!sunday) {
      for (let i = 0; i < daysSinceMonday; i++) {
        const d = new Date(weekStartDate); d.setDate(d.getDate() + i);
        const id = d.toLocaleDateString('en-CA');
        const typ = schedule[String(d.getDay())];
        if ((typ === 'push' || typ === 'pull') && weekTypeByDate[id] !== typ) { missed = { dateLabel: d.toLocaleDateString('en', { weekday: 'long' }), type: typ }; break; }
      }
    }

    const missionTargets = { sessions: 3, fuelDays: 5, cardioMinutes: targets.cardioTargetMinutes * 3 };
    const missionProgress = {
      sessions: weekWorkouts.filter((w) => w.type !== 'cardio').length,
      fuelDays: weekLogs.filter((l) => l.eggs > 0 || l.dahiBowls > 0).length,
      cardioMinutes: weekWorkouts.filter((w) => w.type === 'cardio').reduce((t, w) => t + (w.durationMinutes || 0), 0)
    };
    const missionDone = Object.keys(missionTargets).every((k) => missionProgress[k] >= missionTargets[k]);
    const missionPercent = Math.round(100
      * (Math.min(missionProgress.sessions, missionTargets.sessions) / missionTargets.sessions
        + Math.min(missionProgress.fuelDays, missionTargets.fuelDays) / missionTargets.fuelDays
        + Math.min(missionProgress.cardioMinutes, missionTargets.cardioMinutes) / missionTargets.cardioMinutes) / 3);
    const mission = { weekStart: weekStartId, targets: missionTargets, progress: missionProgress, percent: missionPercent, done: missionDone };

    const avgProtein = weekly.reduce((t, d) => t + d.protein, 0) / weekly.length;
    const avgCalories = weekly.reduce((t, d) => t + d.calories, 0) / weekly.length;
    const avgCardio = weekly.reduce((t, d) => t + d.cardioMinutes, 0) / weekly.length;
    const activeDays = weekly.filter((d) => d.protein > 0 || d.cardioMinutes > 0 || d.workedOut).length;
    const adaptive = activeDays >= 3
      ? {
          protein: Math.max(25, Math.round((avgProtein * 1.1 + 2) / 5) * 5),
          calories: Math.max(300, Math.round((avgCalories * 1.1 + 30) / 50) * 50),
          cardio: Math.max(10, Math.round(avgCardio * 1.1 + 1))
        }
      : null;

    const pushCount = counts.push || 0;
    const pullCount = counts.pull || 0;
    const cardioCount = (counts.cardio || 0);
    const scheduledName = (s) => (s === 'push' ? 'Push' : 'Pull');
    let focus;
    if (sunday) focus = 'Sunday protocol — Pushups are the only lift on the menu.';
    else if (scheduled === 'rest' && !trainedToday && !cardioToday) focus = 'Rest day on your schedule — recovery builds the muscle. Keep eggs & curd in and take the load off.';
    else if (scheduled === 'rest') focus = 'Rest day on your schedule — you trained anyway. Extra credit; now recover hard.';
    else if (scheduled && (scheduled === 'push' ? pushCount === 0 : pullCount === 0)) focus = `Today is your ${scheduledName(scheduled)} day — the plan is queued. Log each exercise as you finish it.`;
    else if (missed) focus = `You skipped ${scheduledName(missed.type)} on ${missed.dateLabel} — the plan is still open. Catch it today.`;
    else if (pushCount === 0 && pullCount === 0 && weekVolume === 0) focus = 'A clean slate. Start with a Push day and set the tone for the week.';
    else if (pushCount === 0 && pullCount === 0) focus = 'Neither Push nor Pull logged this week — pick one today and get moving.';
    else if (pushCount < pullCount) focus = `${cardioCount > 0 ? 'Cardio handled. ' : ''}Push is behind this week (${pushCount} vs ${pullCount} pull) — load the bench today.`;
    else if (pullCount < pushCount) focus = `${cardioCount > 0 ? 'Cardio handled. ' : ''}Pull is behind this week (${pullCount} vs ${pushCount} push) — back and biceps day.`;
    else focus = `${cardioCount > 0 ? 'Cardio handled. ' : ''}Even split of ${pushCount} push and ${pullCount} pull this week — keep the balance.`;

    let tip;
    if (todayNutrition.protein <= 0 && trace.length === 0) tip = 'Two eggs and a bowl of dahi is your foundation — log them first.';
    else if (todayNutrition.protein < targets.proteinTarget) tip = `${today.eggs} eggs + ${today.dahiBowls} bowl dahi = ${todayNutrition.protein}g protein (${targets.proteinTarget}g target). ${targets.proteinTarget - todayNutrition.protein}g left — one egg is 6g.`;
    else if (!trainedToday) tip = 'Fuel is in. Now pick a plan and log each exercise one at a time.';
    else if (weekVolume === 0) tip = 'Plan is checked in — first session of the week done. Recovery is earned.';
    else if (trend.dir === 'up') tip = `Volume up ${trend.pct}% on last week — healthy progression. Beat it again next week.`;
    else if (trend.dir === 'down') tip = `Volume ${trend.pct}% under last week — today is your best shot to even it out.`;
    else tip = (pushCount || pullCount || cardioCount || fueled) ? 'Consistency beats intensity. Show up, log it, rest.' : 'Log any pillar — the coach starts advising from real data.';

    res.json({
      today: { ...today, ...targets, nutrition: todayNutrition },
      workouts: todayWorkouts,
      weekly,
      mission,
      forecast: { eggs: Math.ceil(totals.eggs), dahiBowls: Math.ceil(totals.dahiBowls) },
      streaks: { protein: proteinStreak, cardio: cardioStreak },
      coach: {
        pillars: { fuel: fueled, train: trainedToday, cardio: cardioToday },
        counts: { push: pushCount, pull: pullCount, pushups: counts.pushups || 0, cardio: cardioCount, eggs: totals.eggs, dahiBowls: totals.dahiBowls },
        focus,
        trend,
        tip,
        schedule,
        scheduled,
        adaptive
      },
      user: { name: user?.name, email: user?.email }
    });
  } catch (error) { next(error); }
});

export default router;