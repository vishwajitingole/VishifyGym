import { GlassWater } from 'lucide-react';
import { useGym } from '../state/GymContext';

const TARGET = 8;

export function WaterCard() {
  const { dashboard, quickAdd } = useGym();
  const { today, weekly } = dashboard;
  const glasses = today.waterGlasses || 0;
  const weeklyMax = Math.max(1, ...weekly.map((d) => d.waterGlasses || 0));

  return (
    <section className="card water-card">
      <div className="card-heading">
        <div><h2>Hydration</h2><p>Water is a pillar — drink it like one</p></div>
        <span className={glasses >= TARGET ? 'green-chip' : 'outline-chip'}>{glasses} / {TARGET} glasses</span>
      </div>
      <div className="water-main">
        <div className="water-bubble" aria-hidden><GlassWater size={22} /></div>
        <div>
          <strong>{glasses} <small>glasses</small></strong>
          <p>{glasses >= TARGET ? 'Fully hydrated today.' : `${TARGET - glasses} glasses to your daily goal`}</p>
        </div>
      </div>
      <div className="water-actions">
        <button className="water-add glass-add" onClick={() => quickAdd('water')}>
          <GlassWater size={15} />
          <span><b>+1 Glass</b><small>250 ml</small></span>
        </button>
        <button className="water-add bottle-add" onClick={() => quickAdd('bottle')}>
          <GlassWater size={15} />
          <span><b>+1 Bottle</b><small>1 litre</small></span>
        </button>
      </div>
      <div className="water-bars">
        {weekly.map((day) => (
          <div className="water-day" key={day.date} title={`${day.date}: ${day.waterGlasses || 0} glasses`}>
            <i style={{ height: `${Math.max(5, ((day.waterGlasses || 0) / weeklyMax) * 44)}px` }} />
            <span>{day.label[0]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}