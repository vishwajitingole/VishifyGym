import { Sparkles, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

export function PRBanner({ records, exerciseMax }) {
  if (!records?.length) return null;
  const headline = records[0];
  const allTimeBest = exerciseMax?.[headline.exercise] || 0;
  const pct = allTimeBest ? Math.min(100, Math.round((headline.value / allTimeBest) * 100)) : null;
  const explainer = pct !== null
    ? (headline.value >= allTimeBest
        ? `Matches your all-time best — history is watching, hold the line.`
        : `You're at ${pct}% of your all-time best on this exercise (${allTimeBest} kg).`)
    : null;
  return (
    <section className="pr-banner">
      <div className="trophy-orb"><Trophy /></div>
      <div>
        <span>PERSONAL RECORD</span>
        <h2>{headline.exercise} <b>{headline.value} {headline.metric}</b></h2>
        <p>New best set on {new Date(headline.date + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}.</p>
        {explainer && <p className="pr-explain">{explainer}</p>}
      </div>
      <button onClick={() => confetti({ particleCount: 170, spread: 105, origin: { y: 0.65 }, colors: ['#7CFF6B', '#f5c85a', '#71e6f4', '#ffffff'] })}>
        Celebrate <Sparkles size={15} />
      </button>
    </section>
  );
}