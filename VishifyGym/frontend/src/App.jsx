import { useMemo, useState } from 'react';
import { BarChart3, Dumbbell, Flame, Home, MoreHorizontal, Settings2 } from 'lucide-react';
import { useGym } from './state/GymContext';
import { Overview } from './pages/Overview';
import { Progress } from './pages/Progress';
import { Training } from './pages/Training';
import { Settings } from './pages/Settings';

const nav = [
  { id: 'home', icon: Home, label: 'Today' },
  { id: 'progress', icon: BarChart3, label: 'Progress' },
  { id: 'workout', icon: Dumbbell, label: 'Train' },
  { id: 'settings', icon: Settings2, label: 'Settings' }
];

export function App() {
  const [view, setView] = useState('home');
  const { dashboard } = useGym();
  const Screen = useMemo(() => ({ home: Overview, progress: Progress, workout: Training, settings: Settings }[view]), [view]);
  const proteinStreak = dashboard?.weekly?.filter((d) => d.protein >= 130).length || 0;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span><Dumbbell size={21} /></span><b>VISHIFY<em>GYM</em></b></div>
        <nav>
          {nav.map(({ id, icon: Icon, label }) => (
            <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>
              <Icon size={20} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="streak"><Flame size={18} /><div><b>{String(proteinStreak).padStart(2, '0')} day</b><small>protein streak</small></div></div>
          <button className="profile">
            <span>VG</span>
            <div><b>Vishwajit</b><small>Level 12</small></div>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>

      <div className="mobile-brand"><Dumbbell size={18} /><b>VISHIFY<em>GYM</em></b></div>
      <Screen />

      <nav className="mobile-nav">
        {nav.map(({ id, icon: Icon, label }) => (
          <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>
            <Icon size={19} /><span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}