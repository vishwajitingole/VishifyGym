import { CloudOff, Loader2, Trophy, Waves } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGym } from '../state/GymContext';
import { dateLabel } from '../data';
import { TodayChecklist } from '../components/TodayChecklist';
import { CoachNote } from '../components/CoachNote';
import { FuelPanel } from '../components/FuelPanel';
import { ConsistencyCalendar } from '../components/ConsistencyCalendar';
import { RecoveryMap } from '../components/RecoveryMap';
import { GroceryForecast } from '../components/GroceryForecast';
import { SessionLauncher } from '../components/SessionLauncher';
import { QuickPlanStatus } from '../components/QuickPlanStatus';
import { MissionCard } from '../components/MissionCard';
import { AdaptiveSuggestion } from '../components/AdaptiveSuggestion';
import { WaterCard } from '../components/WaterCard';

export function Overview() {
  const { dashboard, offline, syncing, pending } = useGym();
  const { today, weekly, workouts, forecast, streaks, coach, mission } = dashboard;
  const isSunday = new Date(`${today.date}T12:00:00`).getDay() === 0;
  const proteinStreak = streaks?.protein ?? weekly.filter((d) => d.protein >= (today.proteinTarget || 50)).length;

  return (
    <main className="page-content home-view">
      <header className="topbar">
        <div>
          <p className="eyebrow">{dateLabel(today.date)}</p>
          <h1>Stay in motion<span>.</span></h1>
        </div>
        <div className="connection">
          <span className={offline ? 'offline' : 'online'}>{syncing ? <Loader2 className="spin" size={14} /> : offline ? <CloudOff size={14} /> : <Waves size={14} />}</span>
          <small>{offline ? `${pending} saved offline` : 'Synced'}</small>
        </div>
      </header>

      <TodayChecklist />

      <CoachNote coach={coach} />

      <AdaptiveSuggestion />

      <div className="mission-row">
        <MissionCard mission={mission} />
      </div>

      <FuelPanel />

      <QuickPlanStatus />

      <section className="today-workout">
        <div>
          <span className="eyebrow">TRAINING PLANS</span>
          <h2>{isSunday ? 'Sunday pushup focus' : 'Pick your load'}</h2>
          <p>{isSunday ? 'The only scheduled movement today: Pushups.' : 'One exercise at a time. Your last numbers are prefilled — beat them.'}</p>
        </div>
        <div className="workout-buttons">
          {isSunday ? <SessionLauncher type="pushups" /> : <><SessionLauncher type="push" /><SessionLauncher type="pull" /></>}
        </div>
      </section>

      <div className="content-grid">
        <div className="stack">
          <ConsistencyCalendar weekly={weekly} streak={proteinStreak} target={today.proteinTarget || 50} />
          <WaterCard />
        </div>
        <div className="stack">
          <GroceryForecast forecast={forecast} />
          <RecoveryMap workouts={workouts} />
        </div>
      </div>

      <Link to="/logs" className="home-logs-link"><Trophy size={14} /> Review every workout, cardio session, and meal in your log book →</Link>
    </main>
  );
}