export const EXERCISES = [
  { _id: 'minutes', name: 'Minutes', category: 'cardio' }, { _id: 'speed', name: 'Speed', category: 'cardio' },
  { _id: 'barbell', name: 'Barbell Chest Press', category: 'push' }, { _id: 'fly', name: 'Cable Fly', category: 'push' }, { _id: 'seated-chest', name: 'Seated Chest Press Machine', category: 'push' }, { _id: 'skull', name: 'Tricep Skull Crushers', category: 'push' }, { _id: 'pushdown', name: 'Seated Tricep Pushdowns', category: 'push' }, { _id: 'dips', name: 'Dips', category: 'push' }, { _id: 'pushups', name: 'Pushups', category: 'push' },
  { _id: 'pullups', name: 'Pull-ups', category: 'pull' }, { _id: 'wide-curl', name: 'Wide Grip EZ Barbell Curls', category: 'pull' }, { _id: 'close-curl', name: 'Close Grip EZ Barbell Curls', category: 'pull' }, { _id: 'preacher', name: 'Seated Preacher Curls', category: 'pull' }, { _id: 'pulldown', name: 'Back Lat Pulldowns', category: 'pull' }
];

export const todayId = () => new Date().toLocaleDateString('en-CA');
export const dateLabel = (date) => new Date(`${date}T12:00:00`).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });
export function demoDashboard() {
  const today = todayId();
  const weekly = Array.from({ length: 7 }, (_, index) => { const d = new Date(`${today}T12:00:00`); d.setDate(d.getDate() - 6 + index); return { date: d.toLocaleDateString('en-CA'), label: d.toLocaleDateString('en', { weekday: 'short' }), eggs: [3, 4, 5, 2, 5, 4, 2][index], dahiBowls: [1, 1, 2, 1, 1, 2, 1][index], waterGlasses: [5, 6, 8, 4, 7, 8, 3][index], protein: [29, 35, 52, 23, 41, 46, 23][index], workedOut: [true, true, false, true, true, true, false][index] }; });
  return { today: { date: today, eggs: 2, dahiBowls: 1, waterGlasses: 3, bodyweight: 74.2, proteinTarget: 130, calorieTarget: 2400, cardioTargetMinutes: 20, nutrition: { protein: 23, calories: 324 } }, weekly, workouts: [], forecast: { eggs: 25, dahiBowls: 9 } };
}
