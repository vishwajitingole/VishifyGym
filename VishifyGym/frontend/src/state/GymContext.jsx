import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { demoDashboard, EXERCISES, todayId } from '../data';
import { flushQueue, queue, readQueue, request, clearToken, getToken, setToken } from '../lib/api';

const GymContext = createContext(null);
const cacheKey = (date, userId) => `vishify-dashboard-${userId || 'anon'}-${date}`;

const NUTRITION = {
  egg: { protein: 6, calories: 72 },
  dahiBowl: { protein: 11, calories: 180 }
};

export function GymProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('vishify-user');
    return cached ? JSON.parse(cached) : null;
  });
  const [authenticating, setAuthenticating] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [dashboard, setDashboard] = useState(() => {
    const cachedUser = localStorage.getItem('vishify-user');
    const userId = cachedUser ? JSON.parse(cachedUser)?._id : null;
    return JSON.parse(localStorage.getItem(cacheKey(todayId(), userId)) || 'null') || demoDashboard();
  });
  const [exercises, setExercises] = useState(() => {
    const cachedUser = localStorage.getItem('vishify-user');
    const userId = cachedUser ? JSON.parse(cachedUser)?._id : null;
    return JSON.parse(localStorage.getItem(`vishify-exercises-${userId || 'anon'}`) || 'null') || EXERCISES;
  });
  const [offline, setOffline] = useState(!navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  const persistDashboard = (next) => {
    setDashboard(next);
    try { localStorage.setItem(cacheKey(next.today.date, user?._id), JSON.stringify(next)); } catch { /* storage full */ }
  };

  const refresh = useCallback(async () => {
    try {
      const [freshDashboard, freshExercises] = await Promise.all([
        request(`/dashboard?date=${todayId()}`),
        request('/exercises')
      ]);
      persistDashboard(freshDashboard);
      setExercises(freshExercises);
      localStorage.setItem(`vishify-exercises-${user?._id || 'anon'}`, JSON.stringify(freshExercises));
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);

  // Restore session if a token exists
  useEffect(() => {
    let active = true;
    (async () => {
      if (!getToken()) {
        setAuthenticating(false);
        return;
      }
      try {
        const me = await request('/auth/me');
        if (active) {
          setUser(me);
          localStorage.setItem('vishify-user', JSON.stringify(me));
        }
      } catch {
        // invalid token — treated as logged out
      } finally {
        if (active) setAuthenticating(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const clearUserScopedKeys = () => {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('vishify-dashboard-') || key.startsWith('vishify-exercises-')) localStorage.removeItem(key);
      });
    };
    const onUnauthorized = () => {
      setUser(null);
      clearToken();
      localStorage.removeItem('vishify-user');
      clearUserScopedKeys();
    };
    window.addEventListener('vishify-auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('vishify-auth:unauthorized', onUnauthorized);
  }, []);

  // Load data only when logged in
  useEffect(() => {
    if (!getToken()) return;
    let mounted = true;
    refresh().finally(() => mounted && undefined);
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
  }, [refresh, user]);

  const login = useCallback(async ({ email, password }) => {
    setAuthError(null);
    try {
      const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setToken(data.token);
      localStorage.setItem('vishify-user', JSON.stringify(data.user));
      setUser(data.user);
      await refresh();
      return data.user;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }, [refresh]);

  const register = useCallback(async ({ name, email, password }) => {
    setAuthError(null);
    try {
      const data = await request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      setToken(data.token);
      localStorage.setItem('vishify-user', JSON.stringify(data.user));
      setUser(data.user);
      if (data.seeded) {
        await refresh();
        confetti({ particleCount: 180, spread: 100, origin: { y: 0.5 }, colors: ['#7CFF6B', '#71e6f4', '#f5c85a', '#ffffff'] });
      }
      return data.user;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }, [refresh]);

  const logout = useCallback(() => {
    setUser(null);
    clearToken();
    localStorage.removeItem('vishify-user');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('vishify-dashboard-') || key.startsWith('vishify-exercises-') || key.startsWith('vishify-offline-')) localStorage.removeItem(key);
    });
    setDashboard(demoDashboard());
    setExercises(EXERCISES);
  }, []);

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
    const map = { egg: 'eggs', dahi: 'dahiBowls', water: 'waterGlasses', bottle: 'waterGlasses' };
    const property = map[item];
    const before = dashboard.today;
    const increment = item === 'bottle' ? 4 : 1;
    const nextCount = (before[property] || 0) + increment;
    await updateToday({ [property]: nextCount });
    const targetHit = (item === 'egg' || item === 'dahi') && before.nutrition.protein < before.proteinTarget
      && (before.eggs + (item === 'egg' ? 1 : 0)) * NUTRITION.egg.protein + (before.dahiBowls + (item === 'dahi' ? 1 : 0)) * NUTRITION.dahiBowl.protein >= before.proteinTarget;
    if (targetHit) {
      confetti({
        particleCount: 160,
        spread: 85,
        origin: { y: 0.75 },
        colors: ['#7CFF6B', '#71e6f4', '#fff4bd', '#f5c85a']
      });
    }
  };

  const updateProfile = useCallback(async (updates) => {
    try {
      const profile = await request('/auth/me', { method: 'PATCH', body: JSON.stringify(updates) });
      setUser((prev) => ({ ...prev, ...profile }));
      localStorage.setItem('vishify-user', JSON.stringify(profile));
      await refresh();
      return profile;
    } catch {
      return null;
    }
  }, [refresh]);

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

  const reorderExercises = useCallback(async (category, orderedIds) => {
    try {
      const updated = await request('/exercises/reorder', { method: 'PUT', body: JSON.stringify({ category, order: orderedIds }) });
      setExercises(updated);
      try { localStorage.setItem(`vishify-exercises-${user?._id || 'anon'}`, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    } catch {
      await refresh();
      return null;
    }
  }, [refresh, user]);

  const value = useMemo(
    () => ({ user, login, register, logout, authenticating, authError, dashboard, exercises, offline, syncing, pending: readQueue().length, quickAdd, updateToday, updateProfile, editExercise, reorderExercises, refresh }),
    [user, login, register, logout, authenticating, authError, dashboard, exercises, offline, syncing]
  );
  return <GymContext.Provider value={value}>{children}</GymContext.Provider>;
}

export const useGym = () => useContext(GymContext);