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

const roundTo = (value, step) => Math.round(value / step) * step;

export function suggestProgression(entry) {
  const sets = (entry?.sets || []).filter((set) => Number(set.reps) > 0);
  if (!sets.length) return null;
  const topWeight = Math.max(0, ...sets.map((set) => Number(set.weight) || 0));
  const maxReps = Math.max(...sets.map((set) => Number(set.reps) || 0));
  const bodyweight = topWeight === 0;

  const weightStep = topWeight < 20 ? 1.25 : 2.5;
  const nextWeight = (offset) => (bodyweight ? 0 : Math.max(0, roundTo(topWeight + offset, weightStep)));

  // Hit the rep ceiling (10+): add one small weight step, drop the target back to a clean 8.
  if (maxReps >= 10) {
    const bumped = nextWeight(weightStep);
    if (!bodyweight && bumped <= topWeight) return { weight: topWeight, reps: Math.min(12, maxReps + 1), note: 'Same weight — add one more rep this time.' };
    return { weight: bumped, reps: 8, note: bodyweight ? 'Push for 8 clean sets before spiking volume.' : `+${weightStep} kg from last time — aim for 8 clean reps.` };
  }
  // Solid reps (8-9): keep the weight, buy reps one at a time.
  if (maxReps >= 8) {
    return { weight: topWeight, reps: Math.min(12, maxReps + 1), note: 'Same weight — push for one more rep per set.' };
  }
  // Struggling (7 or fewer): drop a touch of weight, build up clean reps first.
  if (maxReps > 0) {
    return { weight: nextWeight(-weightStep), reps: Math.min(10, maxReps + 2), note: 'Lighten up a little and build clean reps first.' };
  }
  return null;
}
