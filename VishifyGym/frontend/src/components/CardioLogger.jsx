import { useState } from 'react';
import { Check } from 'lucide-react';
import { useGym } from '../state/GymContext';
import { queue, request } from '../lib/api';

export function CardioLogger() {
  const { dashboard, refresh } = useGym();
  const [minutes, setMinutes] = useState('');
  const [speed, setSpeed] = useState('');
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!minutes || !speed) return;
    const operation = {
      path: '/workouts',
      options: { method: 'POST', body: JSON.stringify({ date: dashboard.today.date, type: 'cardio', durationMinutes: +minutes, speed: +speed, exerciseLogs: [] }) }
    };
    try {
      await request(operation.path, operation.options);
      await refresh();
    } catch {
      queue(operation);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  return (
    <div className="cardio-form">
      <label>Minutes<input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="20" /></label>
      <label>Speed<input type="number" value={speed} onChange={(e) => setSpeed(e.target.value)} step=".1" placeholder="6.0" /></label>
      <button className="save-workout" onClick={save}>{saved ? <><Check size={16} /> Logged</> : 'Save cardio'}</button>
    </div>
  );
}