import { Dumbbell } from 'lucide-react';
import { Card } from './Card';

const PROTEIN_TARGET = 130;

export function ConsistencyCalendar({ weekly, streak }) {
  return (
    <Card
      title="Consistency"
      subtitle="Protein goal · training logged"
      action={<span className="green-chip"><Dumbbell size={14} /> {streak || 0} day run</span>}
    >
      <div className="consistency-grid">
        {weekly.map((day) => {
          const proteinDone = day.protein >= PROTEIN_TARGET;
          return (
            <div className="consistency-day" key={day.date}>
              <div className={`contribution ${day.workedOut ? 'trained' : ''} ${proteinDone ? 'fed' : ''}`} title={`${day.date}: ${day.workedOut ? 'trained' : 'no training'}, ${proteinDone ? 'protein hit' : 'protein not hit'}`}>
                {day.workedOut && <span><Dumbbell size={13} /></span>}
              </div>
              <small>{day.label.slice(0, 2)}</small>
            </div>
          );
        })}
      </div>
      <div className="legend">
        <span><i className="contribution" /> Rest</span>
        <span><i className="contribution trained" /> Training</span>
        <span><i className="contribution fed" /> Protein hit</span>
      </div>
    </Card>
  );
}