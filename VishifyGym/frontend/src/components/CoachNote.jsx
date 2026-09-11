import { Dumbbell, Flame, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';

const TrendChip = ({ trend }) => {
  if (!trend || trend.dir === 'flat') return <span className="coach-chip neutral">week flat</span>;
  const Icon = trend.dir === 'up' ? TrendingUp : TrendingDown;
  return <span className={`coach-chip ${trend.dir}`}><Icon size={13} /> Volume {trend.dir === 'up' ? '+' : '−'}{trend.pct}%</span>;
};

export function CoachNote({ coach }) {
  if (!coach) return null;
  const { focus, tip, trend, counts } = coach;
  return (
    <section className="coach-note card">
      <div className="coach-body">
        <p className="coach-focus"><Sparkles size={15} /> {focus}</p>
        <p className="coach-tip">{tip}</p>
      </div>
      <div className="coach-footer">
        <div className="coach-counts">
          <span><Dumbbell size={13} /> Push <b>{counts.push}</b></span>
          <span><Dumbbell size={13} /> Pull <b>{counts.pull}</b></span>
          <span><Flame size={13} /> Cardio <b>{counts.cardio}</b></span>
        </div>
        <TrendChip trend={trend} />
      </div>
    </section>
  );
}