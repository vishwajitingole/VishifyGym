import { useState } from 'react';
import { CheckCircle2, Scale, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useGym } from '../state/GymContext';

function TrendArrow({ delta }) {
  if (delta == null || Math.abs(delta) < 0.05) return <span className="trend-arrow flat"><Minus size={13} /></span>;
  if (delta > 0) return <span className="trend-arrow up"><TrendingUp size={13} /></span>;
  return <span className="trend-arrow down"><TrendingDown size={13} /></span>;
}

export function BodyweightCard() {
  const { dashboard, updateToday } = useGym();
  const { today, weekly } = dashboard;
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);

  const yesterday = weekly.length > 1 ? weekly[weekly.length - 2].bodyweight : null;
  const logged = typeof today.bodyweight === 'number' || (today.bodyweight != null && today.bodyweight !== '');

  const submit = async (event) => {
    event.preventDefault();
    const value = parseFloat(draft);
    if (!Number.isFinite(value) || value <= 0) return;
    await updateToday({ bodyweight: value });
    setDraft('');
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <section className="card bodyweight-card">
      <div className="card-heading">
        <div><h2>Morning weigh-in</h2><p>Log it when you step off the scale</p></div>
        <span className="bw-status" title={logged ? 'Today logged' : 'Not logged yet'}>
          {saved && <CheckCircle2 size={13} />}
          {logged ? (saved ? 'Logged' : 'Today ✓') : 'Pending'}
        </span>
      </div>

      <div className="bw-main">
        <div className="bw-scale"><Scale size={26} /></div>
        <div className="bw-value">
          <strong>{logged ? Number(today.bodyweight).toFixed(1) : '—'}<small> kg</small></strong>
          <span className={`bw-delta ${(today.bodyweight ?? 0) > (yesterday ?? 0) ? 'up' : (today.bodyweight ?? 0) < (yesterday ?? 0) ? 'down' : 'flat'}`}>
            <TrendArrow delta={yesterday != null ? today.bodyweight - yesterday : null} />
            {yesterday != null && today.bodyweight != null ? `${(today.bodyweight - yesterday).toFixed(1)} vs yesterday` : 'no baseline yet'}
          </span>
        </div>
      </div>

      <form className="bw-form" onSubmit={submit}>
        <input
          inputMode="decimal"
          type="number"
          step="0.1"
          min="30"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={logged ? `Update ${Number(today.bodyweight).toFixed(1)} kg` : 'e.g. 74.5'}
        />
        <button type="submit"><Scale size={15} /> {logged ? 'Update' : 'Log weight'}</button>
      </form>

      <div className="bw-bars">
        {weekly.map((day) => (
          <div className="bw-day" key={day.date}>
            <i style={{ height: `${Math.max(5, Math.min(100, ((day.bodyweight ?? 0) / 120) * 100))}%` }} />
            <span>{day.bodyweight != null ? Number(day.bodyweight).toFixed(1) : '—'}</span>
            <small>{day.label[0]}</small>
          </div>
        ))}
      </div>
    </section>
  );
}