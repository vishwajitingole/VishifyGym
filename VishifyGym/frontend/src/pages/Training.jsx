import { useEffect, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { useGym } from '../state/GymContext';
import { request } from '../lib/api';
import { SessionLauncher } from '../components/SessionLauncher';
import { CardioLogger } from '../components/CardioLogger';
import { SundayPushupTracker } from '../components/SundayPushupTracker';

export function Training() {
  const { dashboard } = useGym();
  const sunday = new Date(`${dashboard.today.date}T12:00:00`).getDay() === 0;
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    request('/progress?days=90')
      .then((data) => setMilestones(data.pushupMilestones || []))
      .catch(() => {});
  }, []);

  return (
    <main className="page-content train-view">
      <header className="topbar">
        <div>
          <p className="eyebrow">TRAINING ROOM</p>
          <h1>{sunday ? 'Sunday protocol' : 'Choose your work'}<span>.</span></h1>
        </div>
      </header>

      <section className="train-hero">
        <span className="train-line" />
        <Dumbbell />
        <div>
          <h2>{sunday ? 'Pushups only.' : 'Train with purpose.'}</h2>
          <p>{sunday ? 'Today is for deliberate pushup volume and a new milestone.' : 'Pick a focused session; the past is already loaded into your plan.'}</p>
        </div>
      </section>

      <div className="training-options">
        {sunday ? (
          <SessionLauncher type="pushups" />
        ) : (
          <>
            <SessionLauncher type="push" />
            <SessionLauncher type="pull" />
            <SessionLauncher type="pushups" />
          </>
        )}
      </div>

      <div className="train-grid">
        <section className="card">
          <div className="card-heading"><div><h2>Cardio check-in</h2><p>Log both daily essentials</p></div></div>
          <CardioLogger />
        </section>
        <SundayPushupTracker milestones={milestones} />
      </div>

      <div className="training-tip">
        <Dumbbell size={16} />
        <span>Tip: <b>Dips</b> can be logged any time during a Push session — even during warm-ups, right from the session sheet.</span>
      </div>
    </main>
  );
}