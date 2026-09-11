import { useEffect, useRef, useState } from 'react';
import { Check, Dumbbell, Egg, HeartPulse } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useGym } from '../state/GymContext';

export function TodayChecklist() {
  const { dashboard, quickAdd } = useGym();
  const navigate = useNavigate();
  const { today, workouts, coach } = dashboard;
  const pillars = coach?.pillars || { fuel: false, train: false, cardio: false };
  const sunday = new Date(`${today.date}T12:00:00`).getDay() === 0;
  const fuelDone = pillars.fuel;
  const trainDone = pillars.train;
  const cardioDone = pillars.cardio;
  const allDone = fuelDone && trainDone && cardioDone;
  const celebrated = useRef(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (allDone && !celebrated.current) {
      celebrated.current = true;
      setBurst(true);
      confetti({ particleCount: 210, spread: 110, origin: { y: 0.7 }, colors: ['#7CFF6B', '#71e6f4', '#fff4bd', '#f5c85a', '#aaff9c'] });
      setTimeout(() => setBurst(false), 2600);
    }
    if (!allDone) celebrated.current = false;
  }, [allDone]);

  const doneFlags = { fuelDone, trainDone, cardioDone };
  const minutes = workouts.filter((w) => w.type === 'cardio').reduce((t, w) => t + (w.durationMinutes || 0), 0);
  const target = today.cardioTargetMinutes || 20;

  const rows = [
    {
      key: 'fuel',
      icon: Egg,
      title: 'Eggs & curd',
      value: `${today.eggs || 0} eggs · ${today.dahiBowls || 0} curd · ${today.nutrition?.protein || 0}/${today.proteinTarget}g protein`,
      action: (
        <div className="checklist-actions">
          <button className="checklist-add" onClick={() => quickAdd('egg')} disabled={fuelDone}><span>+1</span> Egg</button>
          <button className="checklist-add curd" onClick={() => quickAdd('dahi')} disabled={fuelDone}><span>+1</span> Dahi</button>
        </div>
      )
    },
    {
      key: 'train',
      icon: Dumbbell,
      title: sunday ? 'Pushups' : 'Push / Pull',
      value: workouts.filter((w) => w.type !== 'cardio').length
        ? `Logged ${workouts.filter((w) => w.type !== 'cardio').length} session${workouts.filter((w) => w.type !== 'cardio').length > 1 ? 's' : ''} today`
        : 'No session logged today',
      action: <button className="checklist-cta" onClick={() => navigate('/train')}>{trainDone ? 'Done' : 'Open plan'}</button>
    },
    {
      key: 'cardio',
      icon: HeartPulse,
      title: 'Cardio',
      value: `${minutes}/${target} min`,
      action: <button className="checklist-cta" onClick={() => navigate('/train')}>{cardioDone ? 'Done' : 'Log'} </button>
    }
  ];

  return (
    <section className={`today-checklist card ${burst ? 'wrapped' : ''}`}>
      <div className="checklist-head">
        <div>
          <p className="eyebrow">TODAY'S THREE</p>
          <h2>{allDone ? 'Day wrapped — great work. 🎉' : 'Fuel, train, move.'}</h2>
        </div>
        <span className={`wrap-chip ${allDone ? 'done' : ''}`}>{allDone ? 'All three ✓' : `${[fuelDone, trainDone, cardioDone].filter(Boolean).length}/3 done`}</span>
      </div>
      <div className="checklist-rows">
        {rows.map((row) => {
          const Icon = row.icon;
          const done = doneFlags[`${row.key}Done`];
          return (
            <div className={`checklist-row ${done ? 'done' : ''}`} key={row.key}>
              <span className={`checklist-status ${done ? 'checked' : ''}`}>{done ? <Check size={14} /> : <Icon size={16} />}</span>
              <div className="checklist-copy">
                <b>{row.title}</b>
                <small>{row.value}</small>
              </div>
              {row.action}
            </div>
          );
        })}
      </div>
    </section>
  );
}