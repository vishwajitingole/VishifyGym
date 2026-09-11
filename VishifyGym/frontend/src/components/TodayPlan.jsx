import { useEffect, useState } from 'react';
import { Check, Clock, Dumbbell, Loader2, Play, TrendingUp } from 'lucide-react';
import { useGym } from '../state/GymContext';
import { request } from '../lib/api';
import { WorkoutSheet } from './WorkoutSheet';

const formatWeight = (v) => (Math.round((Number(v) || 0) * 100) / 100).toFixed(Number(v) % 1 ? 1 : 0);
const lastTextFor = (sets) => {
  const worth = (sets || []).filter((s) => Number(s.reps) > 0);
  if (!worth.length) return null;
  return worth.map((s) => {
    const w = Number(s.weight) || 0;
    const r = Number(s.reps) || 0;
    return w > 0 ? `${formatWeight(w)} kg × ${r}` : `${r} rep${r > 1 ? 's' : ''}`;
  }).join(' · ');
};

const typeLabel = { push: 'Push', pull: 'Pull', pushups: 'Pushups' };

export function TodayPlan({ type, title, subtitle, quickAccess }) {
  const { dashboard } = useGym();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheetExercise, setSheetExercise] = useState(null);
  const today = dashboard.today.date;

  const loadPlan = async () => {
    try {
      const data = await request(`/workouts/plan/${type}?date=${today}`);
      setPlan(data);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlan(); }, [type, today]);

  const openSheet = (startWith) => setSheetExercise(startWith || null);

  const logged = plan?.exercises?.filter((ex) => (plan.logged || []).some((l) => l.exerciseName === ex.exerciseName)) || [];
  const pending = plan?.exercises?.filter((ex) => !logged.some((l) => l.exerciseName === ex.exerciseName)) || [];

  return (
    <>
      {sheetExercise && <WorkoutSheet type={type} startWith={sheetExercise} close={() => { setSheetExercise(null); loadPlan(); }} />}
      <section className="today-plan card">
        <div className="card-heading">
          <div><h2>{title || `${typeLabel[type]} plan`}</h2><p>{subtitle || `${pending.length} to go today · ${logged.length} logged`}</p></div>
          {pending.length > 0 && (
            <button className="green-chip" onClick={() => openSheet(null)}><Play size={14} /> {logged.length ? 'Continue' : 'Start'}</button>
          )}
          {logged.length > 0 && pending.length === 0 && (
            <span className="green-chip done-chip"><Check size={14} /> Done</span>
          )}
        </div>

        {loading ? (
          <div className="plan-loading"><Loader2 className="spin" size={18} /> Loading…</div>
        ) : !plan?.exercises?.length ? (
          <p className="empty-state">No exercises configured for {typeLabel[type].toLowerCase()} yet. Add some in Settings.</p>
        ) : (
          <div className="plan-list">
            {plan.exercises.map((ex) => {
              const isLogged = logged.some((l) => l.exerciseName === ex.exerciseName);
              const entry = isLogged ? plan.logged.find((l) => l.exerciseName === ex.exerciseName) : null;
              return (
                <div key={ex.exerciseName} className={`plan-exercise ${isLogged ? 'logged' : 'pending'}`}>
                  <div className="plan-exercise-info">
                    <b>{ex.exerciseName}</b>
                    <span>
                      {isLogged ? (
                        <><Check size={13} /> logged — {lastTextFor(entry?.sets) || 'done'}</>
                      ) : ex.last ? (
                        <><Clock size={13} /> last: {lastTextFor(ex.last.sets)}{ex.suggested ? ` → suggested ${ex.suggested.weight === 0 ? `${ex.suggested.reps} reps` : `${formatWeight(ex.suggested.weight)} kg × ${ex.suggested.reps}`}` : ''}</>
                      ) : (
                        <><Clock size={13} /> not yet tracked</>
                      )}
                    </span>
                  </div>
                  {isLogged ? (
                    <span className="logged-check"><Check size={16} /></span>
                  ) : (
                    <button className="plan-log-button" onClick={() => openSheet(ex.exerciseName)}>
                      <Dumbbell size={14} /> Log
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {quickAccess}
      </section>
    </>
  );
}