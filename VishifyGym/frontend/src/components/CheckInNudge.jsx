import { useEffect, useRef } from 'react';
import { useGym } from '../state/GymContext';
import { getToken } from '../lib/api';

const nudgeEnabled = () => localStorage.getItem('vishify-nudge-enabled') === '1';

export function CheckInNudge() {
  const { dashboard } = useGym();
  const dashboardRef = useRef(dashboard);
  dashboardRef.current = dashboard;

  useEffect(() => {
    if (!getToken() || !('Notification' in window)) return;

    const check = () => {
      if (!nudgeEnabled() || Notification.permission !== 'granted' || !dashboardRef.current) return;
      const pillars = dashboardRef.current.coach?.pillars;
      if (pillars?.fuel && pillars?.train && pillars?.cardio) return;
      const last = Number(localStorage.getItem('vishify-nudge-last') || 0);
      if (Date.now() - last < 40 * 60 * 1000) return;
      localStorage.setItem('vishify-nudge-last', String(Date.now()));
      const tip = dashboardRef.current.coach?.tip;
      try {
        new Notification('VishifyGym — check in', { body: tip || 'Fuel, train, or move. Two minutes is enough.', tag: 'vishify-nudge' });
      } catch { /* notifications unavailable */ }
    };

    const timer = setInterval(check, 10 * 60 * 1000);
    const untilGone = setTimeout(check, 8000);
    window.addEventListener('focus', check);
    check();
    return () => {
      clearInterval(timer);
      clearTimeout(untilGone);
      window.removeEventListener('focus', check);
    };
  }, []);

  return null;
}