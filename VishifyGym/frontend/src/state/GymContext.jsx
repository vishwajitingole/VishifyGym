import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { demoDashboard, EXERCISES, todayId } from '../data';
import { flushQueue, queue, readQueue, request } from '../lib/api';

const GymContext = createContext(null);
const cacheKey = (date) => `vishify-dashboard-${date}`;

export function GymProvider({ children }) {
  const [dashboard, setDashboard] = useState(() => JSON.parse(localStorage.getItem(cacheKey(todayId())) || 'null') || demoDashboard());
  const [exercises, setExercises] = useState(() => JSON.parse(localStorage.getItem('vishify-exercises') || 'null') || EXERCISES);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const persistDashboard = (next) => { setDashboard(next); localStorage.setItem(cacheKey(next.today.date), JSON.stringify(next)); };

  const refresh = useCallback(async () => {
    try {
      const [freshDashboard, freshExercises] = await Promise.all([request(`/dashboard?date=${todayId()}`), request('/exercises')]);
      persistDashboard(freshDashboard); setExercises(freshExercises); localStorage.setItem('vishify-exercises', JSON.stringify(freshExercises)); setOffline(false);
    } catch { setOffline(true); }
  }, []);
  useEffect(() => { refresh(); const online = async () => { setSyncing(true); await flushQueue(); await refresh(); setSyncing(false); }; window.addEventListener('online', online); window.addEventListener('offline', () => setOffline(true)); return () => { window.removeEventListener('online', online); window.removeEventListener('offline', () => setOffline(true)); }; }, [refresh]);

  const updateToday = async (update) => {
    const old = dashboard.today; const nutrition = { protein: (update.eggs ?? old.eggs) * 6 + (update.dahiBowls ?? old.dahiBowls) * 11, calories: (update.eggs ?? old.eggs) * 72 + (update.dahiBowls ?? old.dahiBowls) * 180 };
    const optimistic = { ...dashboard, today: { ...old, ...update, nutrition } }; persistDashboard(optimistic);
    const operation = { path: `/daily-logs/${old.date}`, options: { method: 'PATCH', body: JSON.stringify(update) } };
    try { const saved = await request(operation.path, operation.options); persistDashboard({ ...optimistic, today: saved }); } catch { queue(operation); setOffline(true); }
  };
  const quickAdd = async (item) => {
    const map = { egg: 'eggs', dahi: 'dahiBowls', water: 'waterGlasses' }; const property = map[item]; const before = dashboard.today;
    await updateToday({ [property]: before[property] + 1 });
    const resultingProtein = (before.eggs + (item === 'egg' ? 1 : 0)) * 6 + (before.dahiBowls + (item === 'dahi' ? 1 : 0)) * 11;
    if (before.nutrition.protein < before.proteinTarget && resultingProtein >= before.proteinTarget) confetti({ particleCount: 140, spread: 80, origin: { y: .75 }, colors: ['#7CFF6B', '#71e6f4', '#fff4bd'] });
  };
  const editExercise = async (operation, data) => {
    if (operation === 'add') { const local = { ...data, _id: `local-${Date.now()}` }; setExercises((all) => [...all, local]); try { const saved = await request('/exercises', { method: 'POST', body: JSON.stringify(data) }); setExercises((all) => all.map((item) => item._id === local._id ? saved : item)); } catch { queue({ path: '/exercises', options: { method: 'POST', body: JSON.stringify(data) } }); } }
    if (operation === 'remove') { setExercises((all) => all.filter((item) => item._id !== data._id)); try { await request(`/exercises/${data._id}`, { method: 'DELETE' }); } catch { if (!data._id.startsWith('local-')) queue({ path: `/exercises/${data._id}`, options: { method: 'DELETE' } }); } }
  };
  const value = useMemo(() => ({ dashboard, exercises, offline, syncing, pending: readQueue().length, quickAdd, updateToday, editExercise, refresh }), [dashboard, exercises, offline, syncing]);
  return <GymContext.Provider value={value}>{children}</GymContext.Provider>;
}
export const useGym = () => useContext(GymContext);
