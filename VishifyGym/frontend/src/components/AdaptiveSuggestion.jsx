import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGym } from '../state/GymContext';

export function AdaptiveSuggestion() {
  const { dashboard, updateProfile } = useGym();
  const [dismissed, setDismissed] = useState(false);
  const adaptive = dashboard.coach?.adaptive;
  if (!adaptive || dismissed) return null;

  const target = dashboard.today;
  const proteinDiff = Math.abs((target.proteinTarget || 0) - (adaptive.protein || 0));
  const cardioDiff = Math.abs((target.cardioTargetMinutes || 0) - (adaptive.cardio || 0));
  const differs = proteinDiff >= 5 || cardioDiff >= 5;

  const apply = async () => {
    await updateProfile({ proteinTarget: adaptive.protein, calorieTarget: adaptive.calories, cardioTargetMinutes: adaptive.cardio });
    setDismissed(true);
    confetti({ particleCount: 130, spread: 80, origin: { y: 0.45 }, colors: ['#71e6f4', '#7CFF6B', '#fff4bd'] });
  };

  if (!differs) return null;

  return (
    <section className="adaptive-suggestion">
      <span className="coach-avatar"><Sparkles size={15} /></span>
      <div>
        <b>Your numbers moved — the coach tuned your goals</b>
        <p>Based on week averages, try <em>{adaptive.protein}g protein</em> · <em>{adaptive.calories} kcal</em> · <em>{adaptive.cardio} min cardio</em>.</p>
      </div>
      <div className="adaptive-actions">
        <button className="apply-targets" onClick={apply}>Apply</button>
        <button className="dismiss-targets" onClick={() => setDismissed(true)} aria-label="Dismiss"><X size={14} /></button>
      </div>
    </section>
  );
}