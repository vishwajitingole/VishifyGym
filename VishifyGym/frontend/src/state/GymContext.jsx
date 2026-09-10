import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { demoDashboard, EXERCISES, todayId } from '../data';
import { flushQueue, queue, readQueue, request } from '../lib/api';

const GymContext = createContext(null);
const cacheKey = (date) => `vishify-dashboard-${date}`;

const NUTRITION = {
  egg: { protein: 6, calories: 72 },
  dahiBowl: { protein: 11, calories: 180 }
};

export function GymProvider({ children }) {
  const [dashboard, setDashboard] = useState(() => JSON.parse(localStorage.getItem(cacheKey(todayId())) || 'null') || demoDashboard());
  const [exercises, setExercises] = useState(() => JSON.parse(localStorage.getItem('vishify-exercises') || 'null') || EXERCISES);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [booted, setBooted] = useState(false);

  const persistDashboard = (next) => {
    setDashboard(next);
    try { localStorage.setItem(cacheKey(next.today.date), JSON.stringify(next)); } catch { /* storage full */ }
  };

  const refresh = useCallback(async () => {
    try {
      const [freshDashboard, freshExercises] = await Promise.all([
        request(`/dashboard?date=${todayId()}`),
        request('/exercises')
      ]);
      persistDashboard(freshDashboard);
      setExercises(freshExercises);
      localStorage.setItem('vishify-exercises', JSON.stringify(freshExercises));
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    refresh().finally(() => mounted && setBooted(true));
    const online = async () => {
      setSyncing(true);
      await flushQueue();
      await refresh();
      setSyncing(false);
    };
    window.addEventListener('online', online);
    window.addEventListener('offline', () => setOffline(true));
    return () => {
      mounted = false;
      window.removeEventListener('online', online);
      window.removeEventListener('offline', () => setOffline(true));
    };
  }, [refresh]);

  const replaceToday = (nextToday) => {
    const optimistic = { ...dashboard, today: nextToday };
    persistDashboard(optimistic);
    return optimistic;
  };

  const updateToday = async (update) => {
    const old = dashboard.today;
    const nutrition = {
      protein: ((update.eggs ?? old.eggs) || 0) * NUTRITION.egg.protein + ((update.dahiBowls ?? old.dahiBowls) || 0) * NUTRITION.dahiBowl.protein,
      calories: ((update.eggs ?? old.eggs) || 0) * NUTRITION.egg.calories + ((update.dahiBowls ?? old.dahiBowls) || 0) * NUTRITION.dahiBowl.calories
    };
    replaceToday({ ...old, ...update, nutrition });
    const operation = { path: `/daily-logs/${old.date}`, options: { method: 'PATCH', body: JSON.stringify(update) } };
    try {
      const saved = await request(operation.path, operation.options);
      replaceToday({ ...dashboard.today, ...saved });
    } catch {
      queue(operation);
      setOffline(true);
    }
  };

  const quickAdd = async (item) => {
    const map = { egg: 'eggs', dahi: 'dahiBowls', water: 'waterGlasses' };
    const property = map[item];
    const before = dashboard.today;
    const nextCount = before[property] + 1;
    const resultingProtein = (before.eggs + (item === 'egg' ? 1 : 0)) * NUTRITION.egg.protein + (before.dahiBowls + (item === 'dahi' ? 1 : 0)) * NUTRITION.dahiBowl.protein;
    if (item === 'water' && nextCount === 10) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.2 }, colors: ['#71e6f4', '#ffffff'] });
    }
    await updateToday({ [property]: nextCount });
    if (before.nutrition.protein < before.proteinTarget && resultingProtein >= before.proteinTarget) {
      confetti({
        particleCount: 160,
        spread: 85,
        origin: { y: 0.75 },
        colors: ['#7CFF6B', '#71e6f4', '#fff4bd', '#f5c85a']
      });
    }
  };

  const editExercise = async (operation, data) => {
    if (operation === 'add') {
      const local = { ...data, _id: `local-${Date.now()}`, isSeeded: false };
      setExercises((all) => [...all, local]);
      try {
        const saved = await request('/exercises', { method: 'POST', body: JSON.stringify(data) });
        setExercises((all) => all.map((item) => item._id === local._id ? saved : item));
      } catch {
        queue({ path: '/exercises', options: { method: 'POST', body: JSON.stringify(data) } });
      }
    }
    if (operation === 'remove') {
      setExercises((all) => all.filter((item) => item._id !== data._id));
      try {
        await request(`/exercises/${data._id}`, { method: 'DELETE' });
      } catch {
        if (!String(data._id).startsWith('local-')) queue({ path: `/exercises/${data._id}`, options: { method: 'DELETE' } });
      }
    }
  };

  const value = useMemo(
    () => ({ dashboard, exercises, offline, syncing, booted, pending: readQueue().length, quickAdd, updateToday, editExercise, refresh }),
    [dashboard, exercises, offline, syncing, booted]
  );
  return <GymContext.Provider value={value}>{children}</GymContext.Provider>;
}

export const useGym = () => useContext(GymContext);