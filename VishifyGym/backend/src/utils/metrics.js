import { NUTRITION } from '../constants.js';

export const nutritionFor = (log) => ({
  protein: log.eggs * NUTRITION.egg.protein + log.dahiBowls * NUTRITION.dahiBowl.protein,
  calories: log.eggs * NUTRITION.egg.calories + log.dahiBowls * NUTRITION.dahiBowl.calories
});

export const volumeFor = (exerciseLogs = []) => exerciseLogs.reduce(
  (total, entry) => total + entry.sets.reduce((volume, set) => volume + (set.reps || 0) * (set.weight || 0), 0),
  0
);

export function maxRepsFor(entry) { return Math.max(0, ...(entry.sets || []).map((set) => set.reps || 0)); }
export function maxWeightFor(entry) { return Math.max(0, ...(entry.sets || []).map((set) => set.weight || 0)); }
export function totalRepsFor(entry) { return (entry.sets || []).reduce((total, set) => total + (set.completed === false ? 0 : set.reps || 0), 0); }
