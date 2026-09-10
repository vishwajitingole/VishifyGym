import { useState } from 'react';
import { Check, Plus, Minus } from 'lucide-react';
import { useGym } from '../state/GymContext';
import { queue, request } from '../lib/api';
import { Celebration } from './Celebration';

const number = (value) => (Number(value) || 0).toFixed(1).replace(/\.0$/, '');

export function CardioLogger() {
  const { dashboard, refresh } = useGym();
  const [minutes, setMinutes] = useState('');
  const [speed, setSpeed] = useState('');
  const [saved, setSaved] = useState(false);
  const [celebration, setCelebration] = useState(null);

  const save = async () => {
    if (!minutes) return;
    const operation = {
      path: '/workouts',
      options: { method: 'POST', body: JSON.stringify({ date: dashboard.today.date, type: 'cardio', durationMinutes: +minutes, speed: +(+speed || 6.0), exerciseLogs: [] }) }
    };
    try {
      const result = await request(operation.path, operation.options);
      await refresh();
      if (result.cardioRecord?.broke) {
        setCelebration({
          title: 'Cardio record!',
          message: `${number(result.cardioRecord.current)} minutes — beats your previous best of ${number(result.cardioRecord.previous)}.`,
          colors: ['#71e6f4', '#ffffff']
        });
        return;
      }
      if (result.cardioRecord?.hitTarget) {
        setCelebration({
          title: 'Cardio goal hit!',
          message: `${number(result.cardioRecord.current)} minutes clears the ${result.cardioRecord.target} minute daily target.`,
          colors: ['#71e6f4', '#7CFF6B', '#ffffff']
        });
        return;
      }
    } catch {
      queue(operation);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  const step = (field, delta) => {
    const value = Number(field === 'minutes' ? minutes : speed) || 0;
    const next = Math.max(0, Math.round((value + delta) * 10) / 10);
    if (field === 'minutes') setMinutes(String(next));
    else setSpeed(String(next));
  };

  return (
    <>
      {celebration && <Celebration {...celebration} onClose={() => setCelebration(null)} />}
      <div className="cardio-form">
        <label className="cardio-field">
          Minutes
          <div className="mini-stepper">
            <button type="button" onClick={() => step('minutes', -5)}><Minus size={12} /></button>
            <input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="20" />
            <button type="button" onClick={() => step('minutes', 5)}><Plus size={12} /></button>
          </div>
        </label>
        <label className="cardio-field">
          Speed
          <div className="mini-stepper">
            <button type="button" onClick={() => step('speed', -0.5)}><Minus size={12} /></button>
            <input type="number" value={speed} onChange={(e) => setSpeed(e.target.value)} step=".1" placeholder="6.0" />
            <button type="button" onClick={() => step('speed', 0.5)}><Plus size={12} /></button>
          </div>
        </label>
        <button className="save-workout" onClick={save}>{saved ? <><Check size={16} /> Logged</> : 'Save cardio'}</button>
      </div>
    </>
  );
}