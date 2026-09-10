import { useEffect, useMemo, useState } from 'react';
import { Check, Dumbbell, X, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGym } from '../state/GymContext';
import { queue, request } from '../lib/api';

const number = (value) => new Intl.NumberFormat('en-IN').format(Math.round(value || 0));

function blankSets() {
  return [
    { reps: '', weight: '' },
    { reps: '', weight: '' },
    { reps: '', weight: '' }
  ];
}

const isSuperset = (name) => name === 'Close Grip EZ Barbell Curls' || name === 'Seated Preacher Curls';

export function WorkoutSheet({ type, close }) {
  const { exercises, dashboard, refresh } = useGym();
  const [saving, setSaving] = useState(false);
  const [dips, setDips] = useState('');
  const isSunday = new Date(`${dashboard.today.date}T12:00:00`).getDay() === 0;

  const current = useMemo(() => {
    if (type === 'pushups') return exercises.filter((e) => e.name === 'Pushups');
    return exercises.filter((e) => e.category === type && e.name !== 'Dips');
  }, [exercises, type]);

  const [logs, setLogs] = useState(() => current.map((exercise) => ({ exercise: exercise._id, exerciseName: exercise.name, sets: blankSets() })));

  useEffect(() => {
    request(`/workouts/last/${type}`).then((last) => {
      if (!last) return;
      setLogs(current.map((exercise) => {
        const previous = last.exerciseLogs?.find((entry) => entry.exerciseName === exercise.name);
        if (previous) {
          return {
            exercise: exercise._id,
            exerciseName: exercise.name,
            sets: [...previous.sets.map((set) => ({ reps: set.reps, weight: set.weight })), ...Array.from({ length: Math.max(0, 3 - previous.sets.length) }, () => ({ reps: '', weight: '' }))]
          };
        }
        return { exercise: exercise._id, exerciseName: exercise.name, sets: blankSets() };
      }));
    }).catch(() => {});
    // The exercise selection is intentionally captured when this sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const volume = logs.reduce((total, log) => total + log.sets.reduce((sum, set) => sum + (+set.reps || 0) * (+set.weight || 0), 0), 0);

  const change = (entryIndex, setIndex, key, value) =>
    setLogs((all) => all.map((entry, i) => i === entryIndex ? { ...entry, sets: entry.sets.map((set, j) => j === setIndex ? { ...set, [key]: value } : set) } : entry));

  const submit = async () => {
    setSaving(true);
    const payload = {
      date: dashboard.today.date,
      type,
      exerciseLogs: [...logs, ...(dips ? [{ exerciseName: 'Dips', sets: [{ reps: +dips, weight: 0 }] }] : [])]
    };
    try {
      const result = await request('/workouts', { method: 'POST', body: JSON.stringify(payload) });
      if (result.personalRecords?.length) {
        confetti({ particleCount: 160, spread: 85, origin: { y: 0.7 }, colors: ['#7CFF6B', '#f5c85a', '#71e6f4'] });
      }
      await refresh();
      close();
    } catch {
      queue({ path: '/workouts', options: { method: 'POST', body: JSON.stringify(payload) } });
      close();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sheet-backdrop">
      <section className="workout-sheet">
        <header>
          <div>
            <span className="eyebrow">{type === 'pushups' ? 'SUNDAY ONLY' : 'SESSION BUILDER'}</span>
            <h2>{type === 'pushups' ? 'Pushup milestone' : `${type[0].toUpperCase() + type.slice(1)} session`}</h2>
          </div>
          <button className="icon-button" onClick={close}><X /></button>
        </header>
        {type === 'pull' && (
          <div className="superset-note">
            <Zap size={16} /> Close Grip EZ Curls + Seated Preacher Curls are paired as a superset.
          </div>
        )}
        <div className="workout-exercises">
          {logs.map((log, entryIndex) => (
            <div className={`exercise-entry ${isSuperset(log.exerciseName) ? 'superset' : ''}`} key={log.exerciseName}>
              <div className="exercise-title">
                <b>{log.exerciseName}</b>
                <small>{isSuperset(log.exerciseName) ? 'Superset' : 'Auto-fills from last session'}</small>
              </div>
              <div className="sets-grid">
                <span>SET</span>
                <span>REPS</span>
                <span>KG</span>
                {log.sets.map((set, setIndex) => (
                  <div className="set-row" key={setIndex}>
                    <i>{setIndex + 1}</i>
                    <input inputMode="numeric" aria-label={`${log.exerciseName} set ${setIndex + 1} reps`} value={set.reps} onChange={(e) => change(entryIndex, setIndex, 'reps', e.target.value)} placeholder="—" />
                    <input inputMode="decimal" aria-label={`${log.exerciseName} set ${setIndex + 1} weight`} value={set.weight} onChange={(e) => change(entryIndex, setIndex, 'weight', e.target.value)} placeholder="—" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {type === 'push' && (
          <div className="dips-dock">
            <div>
              <Dumbbell size={18} />
              <span><b>Log Dips</b><small>Any time, including warm-up</small></span>
            </div>
            <input inputMode="numeric" value={dips} onChange={(e) => setDips(e.target.value)} placeholder="reps" />
          </div>
        )}
        <footer>
          <div>
            <small>SESSION VOLUME</small>
            <strong>{number(volume)} kg</strong>
          </div>
          <button className="save-workout" disabled={saving} onClick={submit}>
            {saving ? 'Saving...' : <><Check size={18} /> Complete session</>}
          </button>
        </footer>
      </section>
    </div>
  );
}