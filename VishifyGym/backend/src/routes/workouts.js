import { Router } from 'express';
import Exercise from '../models/Exercise.js';
import WorkoutSession from '../models/WorkoutSession.js';
import User from '../models/User.js';
import { maxRepsFor, maxWeightFor, suggestProgression, volumeFor } from '../utils/metrics.js';

const router = Router();
const isoDay = () => new Date().toLocaleDateString('en-CA');

const typeRecord = (session, previous, current) => ({
  broke: current > previous && current > 0,
  previous: Math.round(previous * 100) / 100,
  current: Math.round(current * 100) / 100
});

router.get('/plan/:type', async (req, res, next) => {
  try {
    const userId = req.userId;
    const date = req.query.date || isoDay();
    const type = req.params.type;
    const sessionType = ['push', 'pull', 'pushups'].includes(type) ? type : 'push';
    const [session, allSessions] = await Promise.all([
      WorkoutSession.findOne({ userId, date, type: sessionType }).select('date exerciseLogs').lean(),
      WorkoutSession.find({ userId }).select('date exerciseLogs.exerciseName exerciseLogs.sets').sort({ date: -1, createdAt: -1 }).lean()
    ]);
    const exerciseList = sessionType === 'pushups'
      ? await Exercise.find({ userId, name: 'Pushups', active: true }).sort({ order: 1 }).lean()
      : await Exercise.find({ userId, category: sessionType, name: { $ne: 'Pushups' }, active: true }).sort({ order: 1 }).lean();
    const loggedByName = Object.fromEntries((session?.exerciseLogs || []).map((e) => [e.exerciseName, e]));
    const exercises = exerciseList.map((ex) => {
      const name = ex.name;
      const todayEntry = loggedByName[name];
      let last = todayEntry
        ? { date, sets: todayEntry.sets }
        : null;
      if (!last) {
        for (const s of allSessions) {
          const entry = s.exerciseLogs.find((e) => e.exerciseName === name);
          if (entry) { last = { date: s.date, sets: entry.sets }; break; }
        }
      }
      const suggested = last ? suggestProgression(last) : null;
      return { _id: ex._id, exerciseName: name, category: ex.category, order: ex.order, last, suggested };
    });
    res.json({ date, type: sessionType, logged: session?.exerciseLogs || [], exercises });
  } catch (error) { next(error); }
});

router.get('/last/:type', async (req, res, next) => {
  try {
    const session = await WorkoutSession.findOne({ userId: req.userId, type: req.params.type }).select('date exerciseLogs.exerciseName exerciseLogs.sets').sort({ date: -1, createdAt: -1 }).lean();
    if (!session) return res.json({ session: null, suggested: {} });
    const suggested = {};
    session.exerciseLogs.forEach((entry) => {
      const suggestion = suggestProgression(entry);
      if (suggestion) suggested[entry.exerciseName] = suggestion;
    });
    res.json({ session, suggested });
  } catch (error) { next(error); }
});

router.get('/today/:type', async (req, res, next) => {
  try {
    const date = req.query.date || isoDay();
    const session = await WorkoutSession.findOne({ userId: req.userId, date, type: req.params.type }).select('date exerciseLogs').lean();
    res.json({ date, session });
  } catch (error) { next(error); }
});

router.get('/exercise/:name', async (req, res, next) => {
  try {
    const name = req.params.name;
    const session = await WorkoutSession.findOne({ userId: req.userId, 'exerciseLogs.exerciseName': name }).select('date exerciseLogs.exerciseName exerciseLogs.sets').sort({ date: -1, createdAt: -1 }).lean();
    const entry = session?.exerciseLogs?.find((e) => e.exerciseName === name) || null;
    const suggested = entry ? suggestProgression(entry) : null;
    res.json({ last: entry && session ? { date: session.date, exerciseName: entry.exerciseName, sets: entry.sets } : null, suggested });
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const query = { userId: req.userId };
    if (req.query.from || req.query.to) query.date = { ...(req.query.from && { $gte: req.query.from }), ...(req.query.to && { $lte: req.query.to }) };
    if (req.query.type) query.type = req.query.type;
    if (req.query.exercise) query['exerciseLogs.exerciseName'] = req.query.exercise;
    let sessions = await WorkoutSession.find(query).sort({ date: -1, createdAt: -1 }).lean();
    if (req.query.limit) sessions = sessions.slice(0, Number(req.query.limit));
    res.json(sessions);
  } catch (error) { next(error); }
});

router.post('/exercise', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { date, type, exerciseName, exercise, sets } = req.body || {};
    if (!exerciseName) return res.status(400).json({ message: 'exerciseName is required.' });
    const sessionType = ['push', 'pull', 'pushups'].includes(type) ? type : 'push';
    const day = Date.parse(date) ? date : isoDay();
    if (new Date(`${day}T12:00:00`).getDay() === 0 && (sessionType === 'push' || sessionType === 'pull')) {
      return res.status(422).json({ message: 'Sunday is reserved strictly for Pushups.' });
    }
    const cleanSets = (sets || [])
      .map((set) => ({
        reps: Math.max(0, Math.round(Number(set?.reps) || 0)),
        weight: Math.max(0, Number(set?.weight) || 0),
        completed: (Number(set?.reps) || 0) > 0
      }))
      .filter((set) => set.reps > 0);
    const entry = {
      ...(exercise ? { exercise } : {}),
      exerciseName,
      sets: cleanSets,
      maxReps: maxRepsFor({ sets: cleanSets }),
      volume: cleanSets.reduce((sum, set) => sum + set.reps * set.weight, 0),
      supersetWith: null
    };

    const todaySession = await WorkoutSession.findOne({ userId, date: day, type: sessionType });
    let session;
    if (todaySession) {
      todaySession.exerciseLogs = [...todaySession.exerciseLogs.filter((e) => e.exerciseName !== exerciseName), entry];
      todaySession.totalVolume = volumeFor(todaySession.exerciseLogs);
      session = await todaySession.save();
    } else {
      session = await WorkoutSession.create({ userId, date: day, type: sessionType, exerciseLogs: [entry], totalVolume: entry.volume });
    }

    const previous = await WorkoutSession.find({ userId, 'exerciseLogs.exerciseName': exerciseName });
    let prevWeight = 0;
    let prevReps = 0;
    previous.forEach((s) => s.exerciseLogs.forEach((e) => {
      if (e.exerciseName !== exerciseName) return;
      if (s.date === day && s.type === sessionType) return;
      prevWeight = Math.max(prevWeight, maxWeightFor(e));
      prevReps = Math.max(prevReps, maxRepsFor(e));
    }));
    const personalRecords = [];
    if (maxWeightFor(entry) > prevWeight) personalRecords.push({ exercise: exerciseName, metric: 'weight', value: maxWeightFor(entry) });
    if (maxRepsFor(entry) > prevReps) personalRecords.push({ exercise: exerciseName, metric: 'reps', value: maxRepsFor(entry) });

    const records = {};
    if (!todaySession) {
      const prior = await WorkoutSession.find({ userId, type: sessionType, date: { $ne: day } });
      const previousBest = prior.reduce((max, s) => Math.max(max, s.totalVolume || volumeFor(s.exerciseLogs)), 0);
      records.volumeRecord = typeRecord(session, previousBest, session.totalVolume || 0);
    }
    if (sessionType === 'pushups') {
      const pushupEntry = session.exerciseLogs.find((e) => e.exerciseName === 'Pushups') || { sets: [] };
      const reps = pushupEntry.sets.reduce((total, set) => total + (set.completed === false ? 0 : set.reps || 0), 0);
      const prior = await WorkoutSession.find({ userId, type: 'pushups', date: { $ne: day } });
      const previousBest = prior.reduce((max, s) => Math.max(max, (s.exerciseLogs.find((e) => e.exerciseName === 'Pushups')?.sets || []).reduce((t, set) => t + (set.completed === false ? 0 : set.reps || 0), 0)), 0);
      records.pushupRecord = { ...typeRecord(session, previousBest, reps), reps };
    }

    res.status(201).json({ session, personalRecords, ...records });
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