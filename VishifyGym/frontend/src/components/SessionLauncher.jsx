import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { WorkoutSheet } from './WorkoutSheet';

const labels = { push: 'Push', pull: 'Pull', pushups: 'Log pushups', cardio: 'Cardio' };

export function SessionLauncher({ type }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && <WorkoutSheet type={type} close={() => setOpen(false)} />}
      <button className={`session-button ${type}`} onClick={() => setOpen(true)}>
        <Dumbbell size={16} />{labels[type]}
      </button>
    </>
  );
}