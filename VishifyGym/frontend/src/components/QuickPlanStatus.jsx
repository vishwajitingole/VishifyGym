import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, Loader2 } from 'lucide-react';
import { useGym } from '../state/GymContext';
import { request } from '../lib/api';

export function QuickPlanStatus() {
  const { dashboard } = useGym();
  const today = dashboard.today.date;
  const [plans, setPlans] = useState({ push: null, pull: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sunday = new Date(`${today}T12:00:00`).getDay() === 0;
    Promise.all(
      sunday
        ? [request(`/workouts/plan/pushups?date=${today}`)]
        : [request(`/workouts/plan/push?date=${today}`), request(`/workouts/plan/pull?date=${today}`)]
    )
      .then((data) => {
        if (sunday) setPlans({ push: data[0], pull: null });
        else setPlans({ push: data[0], pull: data[1] });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [today]);

  const rows = plans.push || plans.pull
    ? [
        ...(plans.push ? [{ key: 'push', label: 'Push plan', plan: plans.push }] : []),
        ...(plans.pull ? [{ key: 'pull', label: 'Pull plan', plan: plans.pull }] : [])
      ]
    : [];

  if (loading) return null;

  return (
    <section className="quick-status card">
      <div className="card-heading">
        <div><h2>Today's plan</h2><p>Tap a plan to log exercises one at a time</p></div>
        {rows.length > 0 && (
          <Link to="/train" className="green-chip"><span>Open train room <ArrowRight size={13} /></span></Link>
        )}
      </div>
      <div className="quick-status-body">
        {rows.map(({ key, label, plan }) => {
          const total = plan.exercises?.length || 0;
          const done = plan.logged?.length || 0;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <Link key={key} to="/train" className="quick-plan">
              <div className="quick-plan-text">
                <b>{label}</b>
                <span>{done}/{total} {done === total ? '· all done ✓' : `· ${total - done} left`}</span>
              </div>
              <div className="quick-plan-bar"><i style={{ width: `${pct}%` }} /></div>
            </Link>
          );
        })}
        {!rows.length && !loading && <p className="empty-state">No plans loaded. Visit the train room to get started.</p>}
      </div>
      <Link to="/logs" className="quick-logs-link"><ClipboardList size={14} /> Open your full log book <ArrowRight size={13} /></Link>
    </section>
  );
}