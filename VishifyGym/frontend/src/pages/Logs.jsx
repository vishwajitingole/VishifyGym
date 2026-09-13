import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Filter, RotateCcw } from 'lucide-react';
import { useGym } from '../state/GymContext';
import { request } from '../lib/api';

const number = (v) => new Intl.NumberFormat('en-IN').format(Math.round(v || 0));
const formatWeight = (v) => (Math.round((Number(v) || 0) * 100) / 100).toFixed(Number(v) % 1 ? 1 : 0);
const exerciseTypes = ['push', 'pull', 'pushups', 'cardio'];

const typeBadge = { push: 'Push', pull: 'Pull', pushups: 'Pushups', cardio: 'Cardio' };

export function Logs() {
  const { dashboard, exercises } = useGym();
  const [data, setData] = useState({ days: [], totals: {}, targets: {} });
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [exercise, setExercise] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(dashboard.today.date);
  const [applied, setApplied] = useState({});

  const exerciseOptions = useMemo(() => exercises.filter((e) => e.category !== 'cardio').map((e) => e.name), [exercises]);

  const load = (filters) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.type) params.set('type', filters.type);
    if (filters.exercise) params.set('exercise', filters.exercise);
    request(`/logs?${params}`)
      .then(setData)
      .catch(() => setData({ days: [], totals: {}, targets: {} }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load({ to: dashboard.today.date }); }, [dashboard.today.date]);
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const applyFilters = () => {
    const filters = { from: from || undefined, to: to || undefined, type: type || undefined, exercise: exercise || undefined };
    setApplied(filters);
    load(filters);
  };

  const clearFilters = () => {
    setType(''); setExercise(''); setFrom(''); setTo(dashboard.today.date);
    setApplied({});
    load({ to: dashboard.today.date });
  };

  const totals = data.totals || {};

  return (
    <main className="page-content logs-view">
      <header className="topbar">
        <div>
          <p className="eyebrow">EVERYTHING YOU LOGGED</p>
          <h1>Log book<span>.</span></h1>
        </div>
      </header>

      <section className="logs-filter card">
        <div className="logs-filter-title"><Filter size={15} /> <span>Filter logs</span></div>
        <div className="logs-filter-row">
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All</option>
              {exerciseTypes.map((t) => <option key={t} value={t}>{typeBadge[t]}</option>)}
            </select>
          </label>
          <label>
            Exercise
            <select value={exercise} onChange={(e) => setExercise(e.target.value)}>
              <option value="">All</option>
              {exerciseOptions.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label>
            From
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={to} max={dashboard.today.date} onChange={(e) => setTo(e.target.value)} />
          </label>
          <div className="logs-filter-actions">
            <button className="save-workout" onClick={applyFilters}>Apply</button>
            <button className="filter-reset" onClick={clearFilters}><RotateCcw size={13} /> Reset</button>
          </div>
        </div>
      </section>

      <div className="progress-strip logs-strip">
        <div className="progress-stat"><span>days tracked</span><b>{number(totals.days)}</b></div>
        <div className="progress-stat"><span>workouts</span><b>{number(totals.workouts)}</b></div>
        <div className="progress-stat"><span>volume moved</span><b>{number(totals.volume)} kg</b></div>
        <div className="progress-stat"><span>cardio time</span><b>{number(totals.cardioMinutes)} min</b></div>
      </div>

      {loading ? (
        <div className="loading-panel"><span className="ring-loader" /> Pulling your log book…</div>
      ) : !data.days.length ? (
        <div className="empty-card">
          <ClipboardList size={30} />
          <b>Nothing logged{applied.type || applied.exercise || applied.from ? ' for these filters' : ' yet'}.</b>
          <p>Your workouts, cardio sessions, and egg & curd meals will show up here — with full set-by-set detail.</p>
          {(applied.type || applied.exercise || applied.from) && <button className="filter-reset" onClick={clearFilters}>Clear filters</button>}
        </div>
      ) : (
        <div className="log-days">
          {data.days.map((day) => (
            <DayCard key={day.date} day={day} targets={data.targets} applied={applied} exerciseOnly={Boolean(applied.exercise)} />
          ))}
        </div>
      )}
    </main>
  );
}

function DayCard({ day, targets, applied, exerciseOnly }) {
  const dateLabel = new Date(`${day.date}T12:00:00`).toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' });
  const log = day.log;
  const protein = ((log?.eggs || 0) * 6) + ((log?.dahiBowls || 0) * 11);
  const calories = ((log?.eggs || 0) * 72) + ((log?.dahiBowls || 0) * 180);
  const sessions = day.sessions || [];

  return (
    <section className="log-day card">
      <header className="log-day-head">
        <div>
          <span className="eyebrow">{day.date}</span>
          <h2>{dateLabel}</h2>
        </div>
        <div className="log-day-metrics">
          {log && (
            <>
              <span><b>{protein}</b> / {targets.proteinTarget} g protein</span>
              <span><b>{calories}</b> kcal</span>
              <span>{log?.eggs || 0} eggs</span>
              <span>{log?.dahiBowls || 0} dahi bowls</span>
              <span>{log?.waterGlasses || 0} glasses water</span>
            </>
          )}
        </div>
      </header>

      {sessions.length === 0 ? (
        <p className="empty-state">No workouts this day.</p>
      ) : (
        <div className="log-sessions">
          {sessions.map((session) => (
            <div className="log-session" key={session._id}>
              <div className="log-session-head">
                <span className={`log-type ${session.type}`}>{typeBadge[session.type] || session.type}</span>
                <span className="log-volume">{number(session.totalVolume)} kg moved</span>
                {session.type === 'cardio' && <span className="log-volume">{session.durationMinutes} min{session.speed ? ` @ ${session.speed} km/h` : ''}</span>}
                {session.type === 'pushups' && <span className="log-volume">{session.exerciseLogs?.reduce((t, e) => t + e.sets.reduce((v, s) => v + ((s.completed === false ? 0 : s.reps) || 0), 0), 0)} reps</span>}
              </div>
              <div className="log-exercises">
                {(session.exerciseLogs || []).map((entry) => (
                  <div className="log-exercise" key={entry.exerciseName + session._id}>
                    <b>{entry.exerciseName}</b>
                    <div className="log-sets">
                      {entry.sets?.filter((s) => (s.completed !== false)).map((set, i) => (
                        <span key={i} className="log-set">
                          {i + 1}. {set.weight > 0 ? `${formatWeight(set.weight)} kg × ${set.reps}` : `${set.reps} reps`}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}