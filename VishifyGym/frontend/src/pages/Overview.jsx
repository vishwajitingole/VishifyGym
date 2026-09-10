import { CloudOff, Dumbbell, Flame, Loader2, Sparkles, Target, Trophy, Waves } from 'lucide-react';
import { useGym } from '../state/GymContext';
import { dateLabel } from '../data';
import { RingGauge } from '../components/RingGauge';
import { NutritionActions } from '../components/NutritionActions';
import { WaterCard } from '../components/WaterCard';
import { ConsistencyCalendar } from '../components/ConsistencyCalendar';
import { RecoveryMap } from '../components/RecoveryMap';
import { GroceryForecast } from '../components/GroceryForecast';
import { SessionLauncher } from '../components/SessionLauncher';

export function Overview() {
  const { dashboard, offline, syncing, pending } = useGym();
  const { today, weekly, workouts, forecast } = dashboard;
  const isSunday = new Date(`${today.date}T12:00:00`).getDay() === 0;
  const proteinStreak = weekly.filter((d) => d.protein >= today.proteinTarget).length;

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

      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-copy">
          <span className="hero-pill"><Sparkles size={14} /> Daily command center</span>
          <h2>Small logs.<br /><em>Big momentum.</em></h2>
          <p>Fuel with intention and make every rep count.</p>
        </div>
        <div className="hero-figure">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="lift-icon"><Dumbbell size={58} /></div>
          <span className="hero-float f-one">+6g <small>protein</small></span>
          <span className="hero-float f-two">PR <Trophy size={13} /></span>
        </div>
      </section>

      <NutritionActions />

      <section className="gauge-grid">
        <RingGauge value={today.nutrition.protein} target={today.proteinTarget} label="Protein" unit="g" icon={Target} />
        <RingGauge value={today.nutrition.calories} target={today.calorieTarget} label="Calories" unit="kcal" color="#71e6f4" icon={Flame} />
      </section>

      <section className="today-workout">
        <div>
          <span className="eyebrow">TRAINING PLAN</span>
          <h2>{isSunday ? 'Sunday pushup focus' : 'What are we training?'}</h2>
          <p>{isSunday ? 'The only scheduled movement today: Pushups.' : 'Start a focused session. Your last numbers are ready.'}</p>
        </div>
        <div className="workout-buttons">
          {isSunday ? <SessionLauncher type="pushups" /> : <><SessionLauncher type="push" /><SessionLauncher type="pull" /></>}
        </div>
      </section>

      <div className="content-grid">
        <div className="stack">
          <WaterCard />
          <ConsistencyCalendar weekly={weekly} streak={proteinStreak} />
        </div>
        <div className="stack">
          <GroceryForecast forecast={forecast} />
          <RecoveryMap workouts={workouts} />
        </div>
      </div>
    </main>
  );
}