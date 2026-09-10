import { ChevronRight, Egg, Utensils } from 'lucide-react';
import { Card } from './Card';

export function GroceryForecast({ forecast }) {
  const { eggs, dahiBowls } = forecast;
  const weekAvg = Math.max(1, Math.round((eggs + dahiBowls) / 2));
  return (
    <Card title="Next 7 days" subtitle="Based on your recent intake" className="grocery-card">
      <div className="grocery-row">
        <span className="food-orb egg"><Egg size={23} /></span>
        <div><b>{eggs} eggs</b><small>about {Math.ceil(eggs / 6)} trays</small></div>
        <span className="trend-up">↑ steady</span>
      </div>
      <div className="grocery-row">
        <span className="food-orb dahi"><Utensils size={21} /></span>
        <div><b>{dahiBowls} dahi bowls</b><small>{(dahiBowls * 300 / 1000).toFixed(1)} kg total curd</small></div>
        <span className="trend-up">↑ steady</span>
      </div>
      <div className="grocery-summary">
        <small>projection</small>
        <b>~{Math.round((eggs * 54 + dahiBowls * 150) / weekAvg)} kcal/day</b>
        <ChevronRight size={15} />
      </div>
    </Card>
  );
}