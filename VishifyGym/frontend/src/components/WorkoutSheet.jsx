import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, HeartPulse, History, Loader2, Minus, PartyPopper, Plus, X, Zap } from 'lucide-react';
import { useGym } from '../state/GymContext';
import { queue, request } from '../lib/api';
import { Celebration } from './Celebration';

const chime = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.2, 0.4].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.15);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.16);
    });
  } catch { /* audio unavailable */ }
};

const number = (value) => new Intl.NumberFormat('en-IN').format(Math.round(value || 0));
const formatWeight = (value) => (Math.round((Number(value) || 0) * 100) / 100).toFixed(Number(value) % 1 ? 1 : 0);
const weightStepFor = (value) => (Number(value) || 0) >= 20 ? 2.5 : 1.25;
const blankSets = () => [{ reps: '', weight: '' }, { reps: '' }];
const typeTitle = { push: 'Push', pull: 'Pull', pushups: 'Pushups' };
const draftKey = (type, name, date) => `vishify-exercise-draft-${type}-${name}-${date}`;

const lastTextFor = (sets) => {
  const worth = (sets || []).filter((s) => Number(s.reps) > 0);
  if (!worth.length) return null;
  return worth.map((s) => {
    const weight = Number(s.weight) || 0;
    const reps = Number(s.reps) || 0;
    return weight > 0 ? `${formatWeight(weight)} kg × ${reps}` : `${reps} rep${reps > 1 ? 's' : ''}`;
  }).join('  ·  ');
};

function Stepper({ value, onChange, step, min = 0, max = 300, disabled }) {
  const clamp = (v) => Math.min(max, Math.max(min, Math.round(v * 100) / 100));
  return (
    <div className={`stepper ${disabled ? 'disabled' : ''}`}>
      <button type="button" disabled={disabled} onClick={() => onChange(String(clamp((Number(value) || 0) - step)))} aria-label="Decrease"><Minus size={13} /></button>
      <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="—" />
      <button type="button" disabled={disabled} onClick={() => onChange(String(clamp((Number(value) || 0) + step)))} aria-label="Increase"><Plus size={13} /></button>
    </div>
  );
}

export function WorkoutSheet({ type, startWith, close }) {
  const { exercises, dashboard, refresh } = useGym();
  const today = dashboard.today.date;

  const plan = useMemo(() => {
    if (type === 'pushups') return [{ _id: 'pushups', exerciseName: 'Pushups' }];
    return exercises.filter((e) => e.category === type && e.name !== 'Pushups').map((e) => ({ _id: e._id, exerciseName: e.name }));
  }, [exercises, type]);

  const [logged, setLogged] = useState([]);
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const [allDone, setAllDone] = useState(false);
  const [resting, setResting] = useState(null);

  useEffect(() => {
    if (resting === null || resting <= 0) return;
    const timer = setTimeout(() => {
      setResting((r) => {
        if (r <= 1) { chime(); return null; }
        return r - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [resting]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await request(`/workouts/today/${type}?date=${today}`);
        if (!mounted) return;
        const entries = res.session?.exerciseLogs || [];
        const names = entries.map((e) => e.exerciseName);
        setLogged(entries);
        let pending = plan.filter((p) => !names.includes(p.exerciseName));
        if (startWith) pending = [...pending.filter((p) => p.exerciseName === startWith), ...pending.filter((p) => p.exerciseName !== startWith)];
        if (!pending.length) setAllDone(true);
        else { setQueue(pending); setIndex(0); }
        setLoading(false);
      } catch {
        if (!mounted) return;
        setLoading(false);
        setError('Could not load your plan. Check your connection.');
      }
    })();
    return () => { mounted = false; };
    // The plan is captured when the sheet opens; this intentionally does not depend on `exercises` updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = queue[index];

  useEffect(() => {
    if (!active) return;
    let mounted = true;
    setCurrent(null);
    setLoading(true);
    const dKey = draftKey(type, active.exerciseName, today);
    request(`/workouts/exercise/${encodeURIComponent(active.exerciseName)}`)
      .then(({ last, suggested }) => {
        if (!mounted) return;
        const draft = JSON.parse(localStorage.getItem(dKey) || 'null');
        setCurrent({
          ...active,
          last,
          suggested,
          sets: draft?.sets
            ?? (last?.sets?.length ? [...last.sets.map((s) => ({ reps: String(s.reps), weight: String(s.weight) }))] : blankSets())
        });
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setCurrent({ ...active, last: null, suggested: null, sets: blankSets() });
        setLoading(false);
      });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.exerciseName]);

  const persistDraft = (sets) => {
    if (!active) return;
    try { localStorage.setItem(draftKey(type, active.exerciseName, today), JSON.stringify({ sets })); } catch { /* ignore */ }
  };

  const setSet = (setIndex, key, value) => {
    if (!current) return;
    const next = current.sets.map((set, j) => (j === setIndex ? { ...set, [key]: value } : set));
    setCurrent({ ...current, sets: next });
    persistDraft(next);
  };

  const addSet = () => {
    if (!current) return;
    const next = [...current.sets, { reps: '', weight: '' }];
    setCurrent({ ...current, sets: next });
    persistDraft(next);
  };

  const applySuggestion = () => {
    if (!current?.suggested) return;
    const next = current.sets.map((set) => current.suggested.weight === 0
      ? { ...set, reps: String(current.suggested.reps), weight: '' }
      : { ...set, reps: String(current.suggested.reps), weight: String(current.suggested.weight) });
    setCurrent({ ...current, sets: next });
    persistDraft(next);
  };

  const copyLast = () => {
    if (!current?.last?.sets?.length) return;
    const next = current.last.sets.map((set) => ({
      reps: String(set.reps || ''),
      weight: set.weight !== undefined && set.weight !== null && String(set.weight) !== '' ? String(set.weight) : ''
    }));
    setCurrent((c) => ({ ...c, sets: next }));
    persistDraft(next);
  };

  const advance = (extraLogged = []) => {
    const remaining = queue.filter((p, i) => i !== index && !extraLogged.includes(p.exerciseName));
    if (!remaining.length) {
      setQueue([]);
      setAllDone(true);
      return;
    }
    setQueue(remaining);
    setIndex(0);
  };

  const save = async () => {
    if (!current) return;
    setError(null);
    setSaving(true);
    const payload = { date: today, type, exerciseName: current.exerciseName, exercise: current._id || undefined, sets: current.sets };
    const operation = { path: '/workouts/exercise', options: { method: 'POST', body: JSON.stringify(payload) } };
    try {
      const result = await request(operation.path, operation.options);
      try { localStorage.removeItem(draftKey(type, current.exerciseName, today)); } catch { /* ignore */ }
      await refresh();
      const extraLogged = (result.session?.exerciseLogs || []).map((e) => e.exerciseName);
      setLogged((prev) => [...prev.filter((e) => !extraLogged.includes(e.exerciseName)), ...(result.session?.exerciseLogs || [])]);
      const records = result.personalRecords || [];
      const celebration = records.length
        ? { title: 'New personal best!', message: `${records[0].exercise}: ${records[0].value} ${records[0].metric === 'reps' ? 'reps' : 'kg'} — you just beat your previous max.`, colors: ['#7CFF6B', '#f5c85a', '#71e6f4'] }
        : result.volumeRecord?.broke
          ? { title: 'Volume record for the day!', message: `${number(result.volumeRecord.current)} kg moved in this session — a new best.`, colors: ['#a992ff', '#f5c85a', '#ffffff'] }
          : result.pushupRecord?.broke
            ? { title: 'Pushup milestone!', message: `${result.pushupRecord.reps} reps this Sunday — a new weekly record.`, colors: ['#7CFF6B', '#ffffff'] }
            : null;
      const remaining = queue.filter((p, i) => i !== index && !extraLogged.includes(p.exerciseName));
      if (celebration) {
        setCelebration(celebration);
      } else {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1400);
        if (remaining.length) setResting(90);
      }
      advance(extraLogged);
    } catch (err) {
      if (!navigator.onLine) {
        queue(operation);
        try { localStorage.removeItem(draftKey(type, current.exerciseName, today)); } catch { /* ignore */ }
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1400);
        advance([current.exerciseName]);
      } else {
        setSaving(false);
        setError(err?.message || 'Could not save. Please retry.');
      }
    }
  };

  const volume = (current?.sets || []).reduce((sum, s) => sum + (+s.reps || 0) * (+s.weight || 0), 0);
  const bodyweight = (() => {
    if (current?.suggested?.weight === 0) return true;
    const someWeight = (current?.sets || []).some((s) => Number(s.weight) > 0);
    return !someWeight;
  })();
  const lastText = current ? lastTextFor(current?.last?.sets) : null;
  const upcoming = queue.slice(index + 1, index + 4).map((p) => p.exerciseName);

  return (
    <div className="sheet-backdrop">
      {celebration && <Celebration {...celebration} onClose={() => setCelebration(null)} />}
      {resting !== null && (
        <div className="rest-backdrop">
          <div className="rest-card">
            <span className="rest-icon"><HeartPulse size={22} /></span>
            <span className="eyebrow">RECOVERY</span>
            <b>{resting}s</b>
            <p>Rest between sets is part of the set. Breathe, sip water, come back fresh.</p>
            <button onClick={() => setResting(null)}>Skip rest · continue <ChevronRight size={15} /></button>
          </div>
        </div>
      )}
      <section className="workout-sheet">
        <header>
          <div>
            <span className="eyebrow">LOG AS YOU GO · {typeTitle[type]?.toUpperCase()}</span>
            <h2>{typeTitle[type]} session{allDone ? ' — complete' : ''}</h2>
          </div>
          <button className="icon-button" onClick={close}><X /></button>
        </header>

        {allDone ? (
          <div className="sheet-done">
            <span className="done-icon"><PartyPopper size={26} /></span>
            <h3>Today's {typeTitle[type].toLowerCase()} is fully logged.</h3>
            <p>Every exercise is checked in for today. Come back tomorrow — or close this and go get stronger.</p>
            {logged.length > 0 && (
              <div className="done-summary">
                {logged.map((entry) => (
                  <div key={entry.exerciseName}>
                    <b><Check size={13} /> {entry.exerciseName}</b>
                    <span>{lastTextFor(entry.sets) || '—'}</span>
                  </div>
                ))}
              </div>
            )}
            <button className="save-workout" onClick={close}>Close <ChevronRight size={16} /></button>
          </div>
        ) : loading || !active ? (
          <div className="sheet-loading"><Loader2 className="spin" size={20} /> Loading your log…</div>
        ) : error && !current ? (
          <div className="sheet-error">
            <b>{error}</b>
            <button className="save-workout" onClick={close}>Close</button>
          </div>
        ) : current && (
          <>
            <div className="exercise-progress">
              {plan.map((exercise, i) => (
                <button
                  key={exercise.exerciseName}
                  className={`dot ${active.exerciseName === exercise.exerciseName ? 'active' : ''} ${logged.some((e) => e.exerciseName === exercise.exerciseName) ? 'done' : ''}`}
                  onClick={() => { if (!logged.some((e) => e.exerciseName === exercise.exerciseName)) { setIndex(queue.findIndex((p) => p.exerciseName === exercise.exerciseName)); } }}
                  title={exercise.exerciseName}
                  aria-label={exercise.exerciseName}
                >
                  {logged.some((e) => e.exerciseName === exercise.exerciseName) ? <Check size={11} /> : plan.findIndex((p) => p.exerciseName === exercise.exerciseName) + 1}
                </button>
              ))}
            </div>

            <div className="workout-exercises">
              <div className="exercise-entry current-exercise">
                <div className="exercise-title">
                  <b>{current.exerciseName}</b>
                  <small>{logged.some((e) => e.exerciseName === current.exerciseName) ? <><Check size={11} /> already logged today</> : <>tap to log · still open</>}</small>
                </div>

                {lastText && (
                  <div className="last-session-note">
                    <History size={13} />
                    <span>Last time{current.last?.date ? ` (${new Date(`${current.last.date}T12:00:00`).toLocaleDateString('en', { day: 'numeric', month: 'short' })})` : ''}: <b>{lastText}</b></span>
                    <em>{current?.suggested ? `${current.suggested.note}` : 'your numbers are prefilled — beat them'}</em>
                  </div>
                )}

                {current.last?.sets?.length > 0 && (
                  <button className="copy-last" onClick={copyLast}><History size={12} /> Copy last time</button>
                )}

                {current.suggested && (
                  <button className="suggestion-chip" onClick={applySuggestion}>
                    <Zap size={13} />
                    <span>
                      <b>{current.suggested.weight === 0 ? `${current.suggested.reps} reps` : `${formatWeight(current.suggested.weight)} kg × ${current.suggested.reps}`}</b>
                      <small>{current.suggested.note}</small>
                    </span>
                    <em>Apply</em>
                  </button>
                )}

                <div className="sets-grid">
                  <span>SET</span>
                  <span>REPS</span>
                  <span>KG</span>
                  {current.sets.map((set, setIndex) => (
                    <div className="set-row" key={setIndex}>
                      <i>{setIndex + 1}</i>
                      <Stepper value={set.reps} step={1} onChange={(v) => setSet(setIndex, 'reps', v)} />
                      <Stepper value={set.weight} step={weightStepFor(set.weight)} disabled={bodyweight} onChange={(v) => setSet(setIndex, 'weight', v)} />
                    </div>
                  ))}
                </div>
                <button className="add-set" onClick={addSet}><Plus size={13} /> Add another set</button>

                {error && <p className="sheet-error-inline">{error}</p>}
              </div>
            </div>

            <footer>
              <div className="volume-chip">
                <small>{savedFlash ? 'SAVED' : 'VOLUME'}</small>
                <strong>{savedFlash ? '✓ Logged' : `${number(volume)} kg`}</strong>
              </div>
              <div className="sheet-actions">
                {upcoming.length > 0 && <span className="volume-chip upcoming-hint">next: {upcoming.join(', ')}{queue.slice(index + 4).length ? ` +${queue.slice(index + 4).length} more` : ''}</span>}
                <button className="save-workout" disabled={saving} onClick={save}>
                  {saving ? <><Loader2 className="spin" size={16} /> Saving…</> : <>Done · Next <ChevronRight size={16} /></>}
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}