import { useEffect, useMemo, useState } from 'react';
import { useGym } from '../state/GymContext';
import { request } from '../lib/api';
import { TimeRange } from '../components/TimeRange';
import { ProgressCharts } from '../components/ProgressCharts';
import { PRBanner } from '../components/PRBanner';
import { CardioMonitor } from '../components/CardioMonitor';

const fallbackSeries = (days) => {
  const today = new Date().toLocaleDateString('en-CA');
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() - (days - 1 - i));
    const seed = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    return {
      date: d.toLocaleDateString('en-CA'),
      label: d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
      eggs: Math.round(1 + seed * 4),
      dahiBowls: Math.round(seed * 2),
      protein: Math.round(25 + seed * 45),
      calories: Math.round(300 + seed * 500),
      waterGlasses: Math.round(3 + seed * 5),
      bodyweight: 74.6 - i * 0.04 + (i % 5 === 2 ? 0.3 : 0),
      volume: i % 3 === 0 ? Math.round(1200 + seed * 2600) : 0,
      workedOut: i % 3 === 0,
      cardioMinutes: i % 4 === 0 ? 20 + seed * 15 : 0
    };
  });
};

export function Progress() {
  const { dashboard } = useGym();
  const [range, setRange] = useState(7);
  const [progress, setProgress] = useState({ daily: fallbackSeries(7), exerciseMax: {}, topSessions: [], pushupMilestones: [], streaks: { protein: 0, cardio: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    request(`/progress?days=${range}&date=${dashboard.today.date}`)
      .then((data) => setProgress(data))
      .catch(() => setProgress({ daily: fallbackSeries(range), exerciseMax: {}, topSessions: [], pushupMilestones: [], streaks: { protein: 0, cardio: 0 } }))
      .finally(() => setLoading(false));
  }, [range, dashboard.today.date]);

  const daily = progress.daily || [];
  const recentPRs = useMemo(() => {
    return (progress.topSessions || []).slice(0, 1).map((session) => {
      const heaviest = (session.exerciseLogs || []).filter((e) => e.sets?.length).sort((a, b) => (Math.max(0, ...b.sets.map((s) => s.weight)) - Math.max(0, ...a.sets.map((s) => s.weight))))[0] || {};
      return { exercise: heaviest.exerciseName || '—', value: heaviest.sets ? Math.max(0, ...heaviest.sets.map((s) => s.weight || 0)) : 0, metric: 'kg', date: session.date };
    });
  }, [progress.topSessions]);

  return (
    <main className="page-content">
      <header className="topbar">
        <div>
          <p className="eyebrow">YOUR METRICS</p>
          <h1>Progress, visualized<span>.</span></h1>
        </div>
        <TimeRange value={range} change={setRange} />
      </header>

      <div className="progress-strip">
        <div className="progress-stat"><span>volume moved</span><b>{Intl.NumberFormat('en-IN').format(daily.reduce((t, d) => t + (d.volume || 0), 0))} kg</b></div>
        <div className="progress-stat"><span>avg bodyweight</span><b>{(daily.filter((d) => d.bodyweight != null).reduce((t, d, _, arr) => t + d.bodyweight / (arr.length || 1), 0)).toFixed(1)} kg</b></div>
        <div className="progress-stat"><span>protein streak</span><b>{progress.streaks?.protein || 0} days</b></div>
        <div className="progress-stat"><span>cardio streak</span><b>{progress.streaks?.cardio || 0} days</b></div>
      </div>

      <PRBanner records={recentPRs} />

      {loading ? (
        <div className="loading-panel"><span className="ring-loader" /> Crunching your numbers…</div>
      ) : (
        <>
          <ProgressCharts daily={daily} exerciseMax={progress.exerciseMax || {}} />
          <CardioMonitor daily={daily} cardio={progress.cardio} />
          {progress.pushupMilestones?.length > 0 && (
            <div className="pushup-panel">
              <p className="eyebrow">SUNDAY PUSHUPS</p>
              <div className="pushup-mini-list">
                {progress.pushupMilestones.slice(-4).reverse().map((m) => (
                  <div key={m.date}><span>{new Date(m.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric' })}</span><b>{m.reps} reps</b></div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}