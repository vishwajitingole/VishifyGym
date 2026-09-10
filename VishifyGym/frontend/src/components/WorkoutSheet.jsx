import { useEffect, useMemo, useState } from 'react';
import { Check, Dumbbell, Minus, Plus, Wand2, X, Zap } from 'lucide-react';
import { useGym } from '../state/GymContext';
import { queue, request } from '../lib/api';
import { Celebration } from './Celebration';

const number = (value) => new Intl.NumberFormat('en-IN').format(Math.round(value || 0));
const isSuperset = (name) => name === 'Close Grip EZ Barbell Curls' || name === 'Seated Preacher Curls';
const weightStepFor = (value) => (Number(value) || 0) >= 20 ? 2.5 : 1.25;
const formatWeight = (value) => (Math.round((Number(value) || 0) * 100) / 100).toFixed(Number(value) % 1 ? 1 : 0);

const blankSets = () => [
  { reps: '', weight: '' },
  { reps: '', weight: '' },
  { reps: '' }
];

function Stepper({ value, onChange, step, min = 0, max = 250, disabled }) {
  const val = Number(value) || 0;
  const clamp = (v) => Math.min(max, Math.max(min, Math.round(v * 100) / 100));
  return (
    <div className={`stepper ${disabled ? 'disabled' : ''}`}>
      <button type="button" disabled={disabled} onClick={() => onChange(String(clamp(val - step)))} aria-label="Decrease"><Minus size={13} /></button>
      <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="—" />
      <button type="button" disabled={disabled} onClick={() => onChange(String(clamp(val + step)))} aria-label="Increase"><Plus size={13} /></button>
    </div>
  );
}

export function WorkoutSheet({ type, close }) {
  const { exercises, dashboard, refresh } = useGym();
  const [saving, setSaving] = useState(false);
  const [dips, setDips] = useState('');
  const [suggestion, setSuggestion] = useState({});
  const [celebration, setCelebration] = useState(null);
  const isSunday = new Date(`${dashboard.today.date}T12:00:00`).getDay() === 0;

  const current = useMemo(() => {
    if (type === 'pushups') return exercises.filter((e) => e.name === 'Pushups');
    return exercises.filter((e) => e.category === type && e.name !== 'Dips');
  }, [exercises, type]);

  const [logs, setLogs] = useState(() => current.map((exercise) => ({ exercise: exercise._id, exerciseName: exercise.name, sets: blankSets() })));

  useEffect(() => {
    request(`/workouts/last/${type}`).then((response) => {
      const last = response?.session;
      setSuggestion(response?.suggested || {});
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

  const applySuggestion = (entryIndex) => {
    const proposed = suggestion[logs[entryIndex].exerciseName];
    if (!proposed) return;
    setLogs((all) => all.map((entry, i) => i === entryIndex
      ? { ...entry, sets: entry.sets.map((set) => proposed.weight === 0 ? { ...set, reps: proposed.reps, weight: '' } : { ...set, reps: proposed.reps, weight: proposed.weight }) }
      : entry));
  };

  const submit = async () => {
    setSaving(true);
    const payload = {
      date: dashboard.today.date,
      type,
      exerciseLogs: [...logs, ...(dips ? [{ exerciseName: 'Dips', sets: [{ reps: +dips, weight: 0 }] }] : [])]
    };
    try {
      const result = await request('/workouts', { method: 'POST', body: JSON.stringify(payload) });
      await refresh();
      const records = result.personalRecords || [];
      if (records.length) {
        setCelebration({
          title: 'New personal best!',
          message: `${records[0].exercise}: ${records[0].value} ${records[0].metric === 'reps' ? 'reps' : 'kg'} — you just beat your previous max.`,
          colors: ['#7CFF6B', '#f5c85a', '#71e6f4']
        });
      } else if (result.volumeRecord?.broke) {
        setCelebration({
          title: 'Session volume record!',
          message: `${number(result.volumeRecord.current)} kg moved — ${number(result.volumeRecord.current - result.volumeRecord.previous)} kg more than your best session.`,
          colors: ['#a992ff', '#f5c85a', '#ffffff']
        });
      } else if (result.pushupRecord?.broke) {
        setCelebration({
          title: 'Pushup milestone!',
          message: `${result.pushupRecord.reps} reps this Sunday — a new weekly record.`,
          colors: ['#7CFF6B', '#ffffff']
        });
      } else if (result.cardioRecord?.hitTarget) {
        setCelebration({
          title: 'Cardio goal hit!',
          message: `${result.cardioRecord.current} minutes logged — cleared the ${result.cardioRecord.target} minute daily target.`,
          colors: ['#71e6f4', '#7CFF6B', '#ffffff']
        });
      } else {
        close();
      }
    } catch {
      queue({ path: '/workouts', options: { method: 'POST', body: JSON.stringify(payload) } });
      close();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sheet-backdrop">
      {celebration && <Celebration {...celebration} onClose={close} />}
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
        {Object.keys(suggestion).length > 0 && (
          <div className="plan-note">
            <Wand2 size={15} /> Progressive plan loaded — tap <b>Apply</b> on any exercise to lock in the next realistic step.
          </div>
        )}
        <div className="workout-exercises">
          {logs.map((log, entryIndex) => {
            const proposed = suggestion[log.exerciseName];
            const bodyweight = proposed?.weight === 0 || log.sets.every((s) => s.weight === 0 || s.weight === '');
            return (
              <div className={`exercise-entry ${isSuperset(log.exerciseName) ? 'superset' : ''}`} key={log.exerciseName}>
                <div className="exercise-title">
                  <b>{log.exerciseName}</b>
                  <small>{isSuperset(log.exerciseName) ? 'Superset' : 'Taps adjust reps · weight'}</small>
                </div>
                {proposed && (
                  <button className="suggestion-chip" onClick={() => applySuggestion(entryIndex)}>
                    <Zap size={13} />
                    <span>
                      <b>{proposed.weight === 0 ? `${proposed.reps} reps` : `${formatWeight(proposed.weight)} kg × ${proposed.reps}`}</b>
                      <small>{proposed.note}</small>
                    </span>
                    <em>Apply</em>
                  </button>
                )}
                <div className="sets-grid">
                  <span>SET</span>
                  <span>REPS</span>
                  <span>KG</span>
                  {log.sets.map((set, setIndex) => (
                    <div className="set-row" key={setIndex}>
                      <i>{setIndex + 1}</i>
                      <Stepper value={set.reps} step={1} onChange={(v) => change(entryIndex, setIndex, 'reps', v)} />
                      <Stepper
                        value={set.weight}
                        step={weightStepFor(set.weight)}
                        disabled={bodyweight}
                        onChange={(v) => change(entryIndex, setIndex, 'weight', v)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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