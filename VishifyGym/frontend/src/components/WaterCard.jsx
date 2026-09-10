import { Plus, Droplets } from 'lucide-react';
import { useGym } from '../state/GymContext';

const WATER_TARGET = 10;

export function WaterCard() {
  const { dashboard, quickAdd } = useGym();
  const { today, weekly } = dashboard;
  return (
    <section className="card water-card">
      <div className="card-heading">
        <div><h2>Hydration</h2><p>A little often wins</p></div>
        <button className="icon-button aqua" onClick={() => quickAdd('water')} aria-label="Add a glass of water"><Plus size={19} /></button>
      </div>
      <div className="water-main">
        <div className="water-bubble"><Droplets size={28} /></div>
        <div>
          <strong>{today.waterGlasses}<small> / {WATER_TARGET} glasses</small></strong>
          <p>{Math.max(0, WATER_TARGET - today.waterGlasses)} to your daily flow</p>
        </div>
        <button className="outline-mini" onClick={() => quickAdd('water')}>+ Glass</button>
      </div>
      <div className="water-bars">
        {weekly.map((day) => (
          <div className="water-day" key={day.date}>
            <i style={{ height: `${Math.min(100, (day.waterGlasses / WATER_TARGET) * 100)}%` }} />
            <span>{day.label[0]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}