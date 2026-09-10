export const EXERCISE_SEED = [
  { name: 'Minutes', category: 'cardio' },
  { name: 'Speed', category: 'cardio' },
  { name: 'Barbell Chest Press', category: 'push' },
  { name: 'Cable Fly', category: 'push' },
  { name: 'Seated Chest Press Machine', category: 'push' },
  { name: 'Tricep Skull Crushers', category: 'push' },
  { name: 'Seated Tricep Pushdowns', category: 'push' },
  { name: 'Dips', category: 'push' },
  { name: 'Pushups', category: 'push' },
  { name: 'Pull-ups', category: 'pull' },
  { name: 'Wide Grip EZ Barbell Curls', category: 'pull' },
  { name: 'Close Grip EZ Barbell Curls', category: 'pull' },
  { name: 'Seated Preacher Curls', category: 'pull' },
  { name: 'Back Lat Pulldowns', category: 'pull' }
].map((exercise, index) => ({ ...exercise, order: index, isSeeded: true }));

export const NUTRITION = {
  egg: { protein: 6, calories: 72 },
  dahiBowl: { protein: 11, calories: 180 }
};
