import Exercise from '../models/Exercise.js';
import { EXERCISE_SEED } from '../constants.js';

export async function seedUserExercises(userId) {
  const ops = EXERCISE_SEED.map((exercise) => ({
    updateOne: { filter: { userId, name: exercise.name, category: exercise.category }, update: { $setOnInsert: { userId, ...exercise } }, upsert: true }
  }));
  await Exercise.bulkWrite(ops);
  return EXERCISE_SEED.length;
}