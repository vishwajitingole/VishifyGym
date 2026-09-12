import { useEffect, useState } from 'react';
import { CalendarDays, Flame, HeartPulse, MoveVertical, Trophy } from 'lucide-react';
import { Card } from './Card';
import { request } from '../lib/api';

const typeTitle = { push: 'Push', pull: 'Pull', cardio: 'Cardio', pushups: 'Pushups' };

export function WeeklyReview({ today }) {
  const [review, setReview] = useState(null);

  useEffect(() => {
    request(`/progress/review?date=${today}`)
      .then((data) => setReview(data))
      .catch(() => setReview(null));
  }, [today]);

  if (!review) return null;
  const totals = review.totals || {};
  const hasData = totals.workouts > 0 || totals.cardio > 0 || totals.eggs > 0;

  return (
    <Card
      title="Week in review"
      subtitle={`${new Date(review.start + 'T12:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' })} – ${new Date(review.end + 'T12:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' })}`}
      className="chart-card wide-chart"
    >
      {!hasData ? (
        <p className="empty-state">Nothing logged last week yet — the review writes itself once you show up.</p>
      ) : (
        <>
          <div className="progress-strip review-strip">
            <div className="progress-stat"><span>workouts</span><b>{totals.workouts || 0}</b></div>
            <div className="progress-stat"><span>volume moved</span><b>{Intl.NumberFormat('en-IN').format(totals.volume || 0)} kg</b></div>
            <div className="progress-stat"><span>eggs &amp; curd protein</span><b>{totals.protein || 0} g</b></div>
            <div className="progress-stat"><span>cardio</span><b>{totals.cardioMinutes || 0} min</b></div>
          </div>
          {totals.push > 0 || totals.pull > 0 ? (
            <div className="review-pillars">
              {['Push', 'Pull'].map((title) => {
                const count = totals[title.toLowerCase()] || 0;
                if (!count) return null;
                return (
                  <span className="chip" key={title}><span className="chip-dot" /><div><b>{title}</b><small>{count} session{count > 1 ? 's' : ''}</small></div></span>
                );
              })}
              {totals.cardio > 0 && <span className="chip"><span className="chip-dot" /><div><b>Cardio</b><small>{totals.cardio} session{totals.cardio > 1 ? 's' : ''}</small></div></span>}
            </div>
          ) : null}
          {review.prs?.length > 0 && (
            <div className="review-prs">
              <p className="eyebrow"><Trophy size={12} /> IN THE WEEK'S LOG</p>
              <ul>
                {review.prs.map((pr) => (
                  <li key={pr.exercise + pr.date}><MoveVertical size={13} /> {pr.exercise} — heaviest set <b>{pr.value} kg</b> <small>on {new Date(pr.date + 'T12:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' })}</small></li>
                ))}
              </ul>
            </div>
          )}
          {review.topSession && (
            <p className="review-note"><CalendarDays size={13} /> Best session: <b>{typeTitle[review.topSession.type] || review.topSession.type}</b>, {review.topSession.exerciseCount} exercises · {Intl.NumberFormat('en-IN').format(review.topSession.volume)} kg on {new Date(review.topSession.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'long' })}.</p>
          )}
          <p className="review-note extra"><Flame size={13} /> {totals.eggs || 0} eggs &amp; {totals.dahiBowls || 0} bowls of dahi — that&apos;s the foundation that carries you.</p>
          <p className="review-note"><HeartPulse size={13} /> {totals.cardioMinutes ? `${totals.cardioMinutes} minutes of cardio keeps the engine tuned.` : 'No cardio found in last week — 20 minutes keeps the engine tuned.'}</p>
        </>
      )}
    </Card>
  );
}