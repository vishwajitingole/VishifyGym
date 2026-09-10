import { Egg, Utensils } from 'lucide-react';
import { useGym } from '../state/GymContext';

export function NutritionActions() {
  const { dashboard, quickAdd } = useGym();
  const { eggs, dahiBowls } = dashboard.today;
  return (
    <section className="quick-actions" aria-label="Quick nutrition add">
      <button className="quick-add egg-add" onClick={() => quickAdd('egg')}>
        <span className="action-icon"><Egg /></span>
        <span><b>+1 Egg</b><small>6g protein · 72 kcal</small></span>
        <strong>{eggs}</strong>
      </button>
      <button className="quick-add dahi-add" onClick={() => quickAdd('dahi')}>
        <span className="action-icon"><Utensils /></span>
        <span><b>+1 Bowl Dahi</b><small>300g · 11g protein</small></span>
        <strong>{dahiBowls}</strong>
      </button>
    </section>
  );
}