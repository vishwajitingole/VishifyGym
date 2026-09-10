import Exercise from '../models/Exercise.js';
import DailyLog from '../models/DailyLog.js';
import WorkoutSession from '../models/WorkoutSession.js';
import { EXERCISE_SEED, NUTRITION, SEED_DEMO_DATA } from '../constants.js';

export async function seedUserExercises(userId) {
  const ops = EXERCISE_SEED.map((exercise) => ({
    updateOne: { filter: { userId, name: exercise.name, category: exercise.category }, update: { $setOnInsert: { userId, ...exercise } }, upsert: true }
  }));
  await Exercise.bulkWrite(ops);
  return EXERCISE_SEED.length;
}

export async function seedDemoHistory(userId) {
  if (!SEED_DEMO_DATA) return;
  const [dailyCount, workoutCount] = await Promise.all([DailyLog.countDocuments({ userId }), WorkoutSession.countDocuments({ userId })]);
  if (dailyCount > 0 || workoutCount > 0) return;

  const today = new Date();
  const iso = (offset) => { const d = new Date(today); d.setDate(d.getDate() + offset); return d.toLocaleDateString('en-CA'); };

  const RNG = (i, salt) => Math.abs(Math.sin(i * 12.9898 + salt) * 43758.5453) % 1;
  const dailyLogs = [];
  const workoutSessions = [];

  for (let i = 13; i >= 0; i--) {
    const seed = RNG(i, 1);
    const eggs = 2 + Math.round(seed * 3);
    const dahiBowls = 1 + Math.round(RNG(i, 2) * 1);
    const protein = Math.round(eggs * NUTRITION.egg.protein + dahiBowls * NUTRITION.dahiBowl.protein);
    const waterGlasses = 4 + Math.round(RNG(i, 3) * 5);
    const bodyweight = +(74.8 - i * 0.05 + (RNG(i, 4) * 0.4 - 0.2)).toFixed(1);
    const date = iso(-(13 - i));
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();

    dailyLogs.push({ userId, date, eggs, dahiBowls, waterGlasses, bodyweight });

    const isCardioDay = RNG(i, 5) > 0.35;
    const isPushDay = dayOfWeek !== 0 && RNG(i, 6) > 0.55;
    const isPullDay = dayOfWeek !== 0 && RNG(i, 7) > 0.6;
    const isSundayPushup = dayOfWeek === 0 && RNG(i, 8) > 0.2;

    if (isCardioDay) {
      workoutSessions.push({ userId, date, type: 'cardio', durationMinutes: 18 + Math.round(RNG(i, 9) * 12), speed: +(5.5 + RNG(i, 10) * 1.5).toFixed(1), exerciseLogs: [], totalVolume: 0 });
    }
    if (isPushDay) {
      const pressWeight = 55 + Math.round(RNG(i, 11) * 12);
      workoutSessions.push({
        userId, date, type: 'push',
        exerciseLogs: [
          { exerciseName: 'Barbell Chest Press', sets: [{ reps: 8 + Math.round(RNG(i, 12) * 4), weight: pressWeight }, { reps: 8, weight: pressWeight }] },
          { exerciseName: 'Cable Fly', sets: [{ reps: 12, weight: 15 }] },
          { exerciseName: 'Seated Chest Press Machine', sets: [{ reps: 10, weight: 40 }] },
          { exerciseName: 'Tricep Skull Crushers', sets: [{ reps: 10, weight: 20 }] },
          { exerciseName: 'Seated Tricep Pushdowns', sets: [{ reps: 12, weight: 25 }] }
        ],
        totalVolume: 0
      });
      const session = workoutSessions[workoutSessions.length - 1];
      session.totalVolume = session.exerciseLogs.reduce((t, e) => t + e.sets.reduce((v, s) => v + s.reps * s.weight, 0), 0);
    }
    if (isPullDay) {
      const curlWeight = 17.5 + (RNG(i, 13) > 0.5 ? 2.5 : 0);
      workoutSessions.push({
        userId, date, type: 'pull',
        exerciseLogs: [
          { exerciseName: 'Pull-ups', sets: [{ reps: 8 + Math.round(RNG(i, 14) * 3), weight: 0 }] },
          { exerciseName: 'Wide Grip EZ Barbell Curls', sets: [{ reps: 10, weight: curlWeight }] },
          { exerciseName: 'Close Grip EZ Barbell Curls', sets: [{ reps: 10, weight: curlWeight }] },
          { exerciseName: 'Seated Preacher Curls', sets: [{ reps: 10, weight: 15 }] },
          { exerciseName: 'Back Lat Pulldowns', sets: [{ reps: 10, weight: 50 }] }
        ],
        totalVolume: 0
      });
      const session = workoutSessions[workoutSessions.length - 1];
      session.totalVolume = session.exerciseLogs.reduce((t, e) => t + e.sets.reduce((v, s) => v + s.reps * s.weight, 0), 0);
    }
    if (isSundayPushup) {
      workoutSessions.push({
        userId, date, type: 'pushups',
        exerciseLogs: [{ exerciseName: 'Pushups', sets: [{ reps: 130 + Math.round(RNG(i, 15) * 60), weight: 0 }] }],
        totalVolume: 0
      });
    }
  }

  await DailyLog.insertMany(dailyLogs);
  if (workoutSessions.length) await WorkoutSession.insertMany(workoutSessions);
  return { dailyLogs: dailyLogs.length, workouts: workoutSessions.length };
}