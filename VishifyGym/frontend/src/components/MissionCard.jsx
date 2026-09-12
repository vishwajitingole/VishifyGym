import { useEffect, useRef, useState } from 'react';
import { CalendarCheck2, CheckCircle2, Dumbbell, Egg, HeartPulse } from 'lucide-react';
import confetti from 'canvas-confetti';

const pill = (progress, target) => Math.min(progress / (target || 1), 1);

export function MissionCard({ mission }) {
  const celebrated = useRef(false);
  const [burst, setBurst] = useState(false);
  const targets = mission?.targets || { sessions: 3, fuelDays: 5, cardioMinutes: 60 };
  const progress = mission?.progress || { sessions: 0, fuelDays: 0, cardioMinutes: 0 };

  useEffect(() => {
    if (mission?.done && !celebrated.current) {
      celebrated.current = true;
      setBurst(true);
      confetti({ particleCount: 220, spread: 120, origin: { y: 0.4 }, colors: ['#7CFF6B', '#71e6f4', '#f5c85a', '#ffffff'] });
      setTimeout(() => setBurst(false), 2800);
    }
    if (!mission?.done) celebrated.current = false;
  }, [mission?.done]);

  const rows = [
    { key: 'sessions', icon: Dumbbell, label: 'Workouts', value: `${progress.sessions}/${targets.sessions}` },
    { key: 'fuelDays', icon: Egg, label: 'Eggs & curd days', value: `${progress.fuelDays}/${targets.fuelDays}` },
    { key: 'cardioMinutes', icon: HeartPulse, label: 'Cardio', value: `${progress.cardioMinutes}/${targets.cardioMinutes} min` }
  ];

  return (
    <section className={`card mission-card ${burst ? 'wrapped' : ''} ${mission?.done ? 'done' : ''}`}>
      <div className="card-heading">
        <div>
          <p className="eyebrow">WEEKLY MISSION</p>
          <h2>{mission?.done ? 'Mission complete — week won. 🏆' : 'This week&apos;s smart target'}</h2>
        </div>
        <span className="mission-percent">{mission?.percent || 0}%</span>
      </div>
      <div className="mission-track">
        <div className="mission-bar"><span style={{ width: `${Math.max(0, Math.min(100, mission?.percent || 0))}%` }} /></div>
      </div>
      <div className="mission-rows">
        {rows.map((row) => {
          const Icon = row.icon;
          const done = progress[row.key] >= targets[row.key];
          return (
            <div className={`mission-row ${done ? 'done' : ''}`} key={row.key}>
              <span className="mission-icon">{done ? <CheckCircle2 size={14} /> : <Icon size={14} />}</span>
              <b>{row.label}</b>
              <div className="mission-pill"><span style={{ width: `${pill(progress[row.key], targets[row.key]) * 100}%` }} /></div>
              <em>{row.value}</em>
            </div>
          );
        })}
      </div>
    </section>
  );
}