import { Egg, Utensils } from 'lucide-react';
import { useGym } from '../state/GymContext';

const pct = (value, total) => Math.min(100, Math.max(0, Math.round((value / total) * 100)));

export function FuelPanel() {
  const { dashboard, quickAdd } = useGym();
  const { today, weekly } = dashboard;
  const protein = today.nutrition?.protein || 0;
  const target = today.proteinTarget || 50;
  const progress = pct(protein, target);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const weeklyMax = Math.max(1, ...weekly.map((d) => Math.max(d.eggs || 0, d.dahiBowls || 0)));
  const hit = protein >= target;

  return (
    <section className="card fuel-card">
      <div className="card-heading">
        <div><h2>Eggs & curd</h2><p>Your daily foundation — protein from real food</p></div>
        <span className={hit ? 'green-chip' : 'outline-chip'}>{protein}g / {target}g protein</span>
      </div>
      <div className="fuel-body">
        <div className="fuel-ring">
          <svg viewBox="0 0 104 104" aria-label={`${protein} of ${target} grams protein`}>
            <circle className="gauge-track" cx="52" cy="52" r={radius} />
            <circle
              className="gauge-value"
              cx="52"
              cy="52"
              r={radius}
              style={{ stroke: hit ? '#7CFF6B' : '#f5c85a', strokeDasharray: circumference, strokeDashoffset: circumference - (circumference * progress) / 100 }}
            />
          </svg>
          <div className="fuel-ring-num">
            <b>{protein}</b>
            <span>/ {target}g</span>
          </div>
        </div>
        <div className="fuel-actions">
          <button className="fuel-add egg" onClick={() => quickAdd('egg')}>
            <span className="action-icon"><Egg /></span>
            <span><b>+1 Egg</b><small>6g protein · 72 kcal</small></span>
            <strong>{today.eggs || 0}</strong>
          </button>
          <button className="fuel-add dahi" onClick={() => quickAdd('dahi')}>
            <span className="action-icon"><Utensils /></span>
            <span><b>+1 Bowl Dahi</b><small>11g protein · 180 kcal</small></span>
            <strong>{today.dahiBowls || 0}</strong>
          </button>
        </div>
      </div>
      <div className="fuel-week">
        {weekly.map((day) => (
          <div className="fuel-day" key={day.date}>
            <div className="fuel-day-bars">
              <i className="egg" style={{ height: `${Math.max(8, ((day.eggs || 0) / weeklyMax) * 34)}px` }} />
              <i className="dahi" style={{ height: `${Math.max(8, ((day.dahiBowls || 0) / weeklyMax) * 34)}px` }} />
            </div>
            <span>{day.label[0]}</span>
          </div>
        ))}
        <div className="fuel-legend">
          <span><i className="egg" /> eggs</span>
          <span><i className="dahi" /> curd</span>
        </div>
      </div>
    </section>
  );
}