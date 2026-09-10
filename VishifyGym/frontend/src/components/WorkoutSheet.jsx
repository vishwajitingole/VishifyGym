import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Dumbbell, History, Minus, Plus, SkipForward, X, Zap } from 'lucide-react';
import { useGym } from '../state/GymContext';
import { queue, request } from '../lib/api';
import { Celebration } from './Celebration';

const number = (value) => new Intl.NumberFormat('en-IN').format(Math.round(value || 0));
const isSuperset = (name) => name === 'Close Grip EZ Barbell Curls' || name === 'Seated Preacher Curls';
const weightStepFor = (value) => (Number(value) || 0) >= 20 ? 2.5 : 1.25;
const formatWeight = (value) => (Math.round((Number(value) || 0) * 100) / 100).toFixed(Number(value) % 1 ? 1 : 0);

const blankSets = () => [
  { reps: '', weight: '' },
  { reps: '' }
];

const typeTitle = { push: 'Push session', pull: 'Pull session', pushups: 'Pushup milestone' };
const draftKey = (type, date) => `vishify-session-${type}-${date}`;

const loadDraft = (type, date) => {
  try {
    const raw = localStorage.getItem(draftKey(type, date));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const saveDraft = (type, date, data) => {
  try { localStorage.setItem(draftKey(type, date), JSON.stringify(data)); } catch { /* storage full */ }
};

const clearDraft = (type, date) => {
  try { localStorage.removeItem(draftKey(type, date)); } catch { /* ignore */ }
};

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
  const today = dashboard.today.date;
  const [index, setIndex] = useState(() => loadDraft(type, today)?.index || 0);
  const [saving, setSaving] = useState(false);
  const [suggestion, setSuggestion] = useState({});
  const [lastSession, setLastSession] = useState(null);
  const [celebration, setCelebration] = useState(null);

  const current = useMemo(() => {
    const base = (type === 'pushups'
      ? exercises.filter((e) => e.name === 'Pushups')
      : exercises.filter((e) => e.category === type && e.name !== 'Dips')
    ).map((exercise) => ({ _id: exercise._id, exerciseName: exercise.name }));
    return type === 'push' ? [...base, { _id: 'dips', exerciseName: 'Dips' }] : base;
  }, [exercises, type]);

  const [logs, setLogs] = useState(() => {
    const draft = loadDraft(type, today);
    if (draft?.logs?.length) return draft.logs;
    return current.map((exercise) => ({ exercise: exercise._id, exerciseName: exercise.exerciseName, sets: blankSets() }));
  });

  const persist = (nextLogs, nextIndex = index) => saveDraft(type, today, { logs: nextLogs, index: nextIndex });

  useEffect(() => {
    request(`/workouts/last/${type}`).then((response) => {
      const last = response?.session;
      setSuggestion(response?.suggested || {});
      setLastSession(last);
      if (!last || loadDraft(type, today)) return;
      setLogs(current.map((exercise) => {
        const previous = last.exerciseLogs?.find((entry) => entry.exerciseName === exercise.exerciseName);
        if (previous) {
          const target = Math.max(previous.sets.length, blankSets().length);
          return {
            exercise: exercise._id,
            exerciseName: exercise.exerciseName,
            sets: [...previous.sets.map((set) => ({ reps: set.reps, weight: set.weight })), ...Array.from({ length: Math.max(0, target - previous.sets.length) }, () => ({ reps: '', weight: '' }))]
          };
        }
        return { exercise: exercise._id, exerciseName: exercise.exerciseName, sets: blankSets() };
      }));
    }).catch(() => {});
    // The exercise selection is intentionally captured when this sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const lastEntryFor = (name) => lastSession?.exerciseLogs?.find((entry) => entry.exerciseName === name) || null;

  const lastSetsText = (entry) => {
    if (!entry?.sets?.length) return null;
    const worthLogging = entry.sets.filter((set) => Number(set.reps) > 0);
    if (!worthLogging.length) return null;
    return worthLogging.map((set) => {
      const weight = Number(set.weight) || 0;
      const reps = Number(set.reps) || 0;
      return weight > 0 ? `${weight} kg × ${reps}` : `${reps} rep${reps > 1 ? 's' : ''}`;
    }).join('  ·  ');
  };

  const isDone = (i) => i < index || logs[i].sets.some((set) => Number(set.reps) > 0);
  const active = logs[index];
  const volume = logs.reduce((total, log) => total + log.sets.reduce((sum, set) => sum + (+set.reps || 0) * (+set.weight || 0), 0), 0);

  const change = (setIndex, key, value) => {
    const next = logs.map((entry, i) => i === index ? { ...entry, sets: entry.sets.map((set, j) => j === setIndex ? { ...set, [key]: value } : set) } : entry);
    setLogs(next);
    persist(next);
  };

  const addSet = () => {
    const next = logs.map((entry, i) => i === index ? { ...entry, sets: [...entry.sets, { reps: '', weight: '' }] } : entry);
    setLogs(next);
    persist(next);
  };

  const applySuggestion = () => {
    const proposed = suggestion[active.exerciseName];
    if (!proposed) return;
    const next = logs.map((entry, i) => i === index
      ? { ...entry, sets: entry.sets.map((set) => proposed.weight === 0 ? { ...set, reps: proposed.reps, weight: '' } : { ...set, reps: proposed.reps, weight: proposed.weight }) }
      : entry);
    setLogs(next);
    persist(next);
  };

  const goTo = (nextIndex) => {
    const clamped = Math.min(current.length - 1, Math.max(0, nextIndex));
    setIndex(clamped);
    persist(logs, clamped);
  };

  const submit = async () => {
    setSaving(true);
    const payload = {
      date: dashboard.today.date,
      type,
      exerciseLogs: logs
    };
    try {
      const result = await request('/workouts', { method: 'POST', body: JSON.stringify(payload) });
      clearDraft(type, today);
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
      clearDraft(type, today);
      queue({ path: '/workouts', options: { method: 'POST', body: JSON.stringify(payload) } });
      close();
    } finally {
      setSaving(false);
    }
  };

  const isLast = index === current.length - 1;
  const proposed = suggestion[active.exerciseName];
  const bodyweight = proposed?.weight === 0 || active.sets.every((s) => s.weight === 0 || s.weight === '');
  const lastText = lastSetsText(lastEntryFor(active.exerciseName));

  return (
    <div className="sheet-backdrop">
      {celebration && <Celebration {...celebration} onClose={close} />}
      <section className="workout-sheet">
        <header>
          <div>
            <span className="eyebrow">LOG AS YOU GO · {type === 'pushups' ? 'SUNDAY ONLY' : type[0].toUpperCase() + type.slice(1)}</span>
            <h2>{typeTitle[type] || 'Session'}</h2>
          </div>
          <button className="icon-button" onClick={close}><X /></button>
        </header>

        <div className="exercise-progress">
          {current.map((exercise, i) => (
            <button
              key={exercise.exerciseName}
              className={`dot ${i === index ? 'active' : ''} ${isDone(i) ? 'done' : ''}`}
              onClick={() => goTo(i)}
              title={exercise.exerciseName}
              aria-label={`Jump to ${exercise.exerciseName}`}
            >
              {i < index || logs[i].sets.some((s) => Number(s.reps) > 0) ? <Check size={11} /> : i + 1}
            </button>
          ))}
        </div>

        <div className="workout-exercises">
          {active && (
            <div className={`exercise-entry current-exercise ${isSuperset(active.exerciseName) ? 'superset-running' : ''}`}>
              <div className="exercise-title">
                <b>{active.exerciseName}</b>
                <small>Exercise {index + 1} of {current.length} · {isDone(index) ? 'logged' : 'tap to log'}</small>
              </div>
              {lastText && (
                <div className="last-session-note">
                  <History size={13} />
                  <span>Last session: <b>{lastText}</b></span>
                  <em>your numbers are prefilled — beat them today</em>
                </div>
              )}
              {proposed && (
                <button className="suggestion-chip" onClick={applySuggestion}>
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
                {active.sets.map((set, setIndex) => (
                  <div className="set-row" key={setIndex}>
                    <i>{setIndex + 1}</i>
                    <Stepper value={set.reps} step={1} onChange={(v) => change(setIndex, 'reps', v)} />
                    <Stepper value={set.weight} step={weightStepFor(set.weight)} disabled={bodyweight} onChange={(v) => change(setIndex, 'weight', v)} />
                  </div>
                ))}
              </div>
              <button className="add-set" onClick={addSet}><Plus size={13} /> Add another set</button>
            </div>
          )}
        </div>

        <footer>
          <div className="volume-chip">
            <small>LIVE VOLUME</small>
            <strong>{number(volume)} kg</strong>
          </div>
          <div className="sheet-actions">
            {index > 0 && <button className="nav-back" onClick={() => goTo(index - 1)}><ChevronLeft size={16} /> Back</button>}
            {!isLast ? (
              <>
                <button className="skip-exercise" onClick={() => goTo(index + 1)}><SkipForward size={14} /> Skip</button>
                <button className="save-workout" onClick={() => goTo(index + 1)}>Done · Next <ChevronRight size={16} /></button>
              </>
            ) : (
              <button className="save-workout" disabled={saving} onClick={submit}>
                {saving ? 'Saving...' : <><Check size={18} /> Complete session</>}
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}