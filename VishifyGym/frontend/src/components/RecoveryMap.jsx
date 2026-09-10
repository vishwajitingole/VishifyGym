import { useEffect, useState } from 'react';
import { Card } from './Card';

function phaseColor(elapsedHours) {
  const fade = Math.min(1, Math.max(0, 1 - elapsedHours / 48));
  const red = Math.round(220 + (40 - 220) * (1 - fade));
  const green = Math.round(90 + (210 - 90) * fade);
  return { stroke: `rgb(${red},${green},60)`, label: elapsedHours >= 48 ? 'recovered' : `${Math.round(elapsedHours)}h recovery` };
}

export function RecoveryMap({ workouts }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const latest = workouts?.at(0);
  const isPull = latest?.type === 'pull';
  const isPush = latest?.type === 'push' || latest?.type === 'pushups';
  const active = isPull || isPush;
  const elapsed = latest ? (now - new Date(`${latest.date}T00:00:00`).getTime()) / 3600000 : 48;
  const palette = active ? phaseColor(elapsed) : { stroke: '#4fae6d', label: 'ready' };
  return (
    <Card
      title="Recovery status"
      subtitle={active ? (isPush ? 'Chest & triceps are recovering' : 'Back & biceps are recovering') : 'Ready for your next session'}
      action={<span className={`recovery-status ${active ? 'healing' : 'ready'}`}>{active ? palette.label : 'Ready'}</span>}
      className="recovery-card"
    >
      <div className="recovery-content">
        <svg className="body-map" viewBox="0 0 150 176" role="img" aria-label="Muscle recovery map">
          <circle cx="75" cy="18" r="13" className="body-base" />
          <path className="body-base" d="M55 37 Q75 29 95 37L109 64 96 73 95 134 55 134 54 73 41 64Z" />
          <path className="body-base" d="M54 42L33 81 42 87 60 57M96 42L117 81 108 87 90 57M58 132L49 168M92 132L101 168" fill="none" strokeWidth="14" strokeLinecap="round" />
          {active && isPush && (
            <>
              <path className="muscle-hot" style={{ fill: palette.stroke }} d="M56 48L75 41 94 48 91 68 59 68Z" />
              <path className="muscle-hot" style={{ stroke: palette.stroke }} d="M48 54L38 79M102 54L112 79" fill="none" strokeWidth="8" strokeLinecap="round" />
            </>
          )}
          {active && isPull && (
            <>
              <path className="muscle-hot" style={{ fill: palette.stroke }} d="M60 45L75 39 90 45 95 75 55 75Z" />
              <path className="muscle-hot" style={{ stroke: palette.stroke }} d="M49 57L40 80M101 57L110 80" fill="none" strokeWidth="8" strokeLinecap="round" />
            </>
          )}
        </svg>
        <div className="recovery-copy">
          <b>{isPull ? 'Back & biceps' : isPush ? 'Chest & triceps' : 'No recent stress'}</b>
          <p>{active ? 'Your heat fades from red to green across 48 hours.' : 'Fully restored — ready to train.'}</p>
          <div className="recovery-scale"><i /><i /><i /><i /></div>
          <small>stressed <span /> recovered</small>
        </div>
      </div>
    </Card>
  );
}