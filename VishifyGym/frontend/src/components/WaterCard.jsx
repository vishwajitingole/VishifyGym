import { CupSoda, Droplets, Plus } from 'lucide-react';
import { useGym } from '../state/GymContext';

const WATER_TARGET = 10;

export function WaterCard() {
  const { dashboard, quickAdd } = useGym();
  const { today, weekly } = dashboard;
  const bottleEquivalent = today.waterGlasses / 4;

  const handleBottle = () => {
    if (today.waterGlasses < WATER_TARGET) {
      quickAdd('bottle');
    }
  };

  return (
    <section className="card water-card">
      <div className="card-heading">
        <div><h2>Hydration</h2><p>Glasses or 1L bottle — it all counts</p></div>
        <button className="icon-button aqua" onClick={() => quickAdd('water')} aria-label="Add a glass of water"><Plus size={19} /></button>
      </div>
      <div className="water-main">
        <div className="water-bubble"><Droplets size={28} /></div>
        <div>
          <strong>{today.waterGlasses}<small> / {WATER_TARGET} glasses</small></strong>
          <p>{Math.max(0, (WATER_TARGET - today.waterGlasses) * 0.25).toFixed(2)} L to your daily flow</p>
        </div>
        <span className="bottle-count" title={`${today.waterGlasses} glasses = ${bottleEquivalent.toFixed(2)} L`}>
          <CupSoda size={14} /> {bottleEquivalent.toFixed(2)} L
        </span>
      </div>
      <div className="water-actions">
        <button className="water-add bottle-add" onClick={handleBottle} disabled={today.waterGlasses >= WATER_TARGET}>
          <CupSoda size={18} /><span><b>+1L Bottle</b><small>{Math.min(4, WATER_TARGET - today.waterGlasses)} glasses · 4/4</small></span>
        </button>
        <button className="water-add glass-add" onClick={() => quickAdd('water')} disabled={today.waterGlasses >= WATER_TARGET}>
          <Droplets size={18} /><span><b>+ Glass</b><small>250 ml</small></span>
        </button>
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