import { useMemo, useState } from 'react';
import { BarChart3, Dumbbell, Home, LogOut, Settings2 } from 'lucide-react';
import { useGym } from './state/GymContext';
import { Overview } from './pages/Overview';
import { Progress } from './pages/Progress';
import { Training } from './pages/Training';
import { Settings } from './pages/Settings';
import { AuthScreen } from './pages/AuthScreen';

const nav = [
  { id: 'home', icon: Home, label: 'Today' },
  { id: 'progress', icon: BarChart3, label: 'Progress' },
  { id: 'workout', icon: Dumbbell, label: 'Train' },
  { id: 'settings', icon: Settings2, label: 'Settings' }
];

export function App() {
  const { user, authenticating, logout } = useGym();
  const [view, setView] = useState('home');
  const Screen = useMemo(() => ({ home: Overview, progress: Progress, workout: Training, settings: Settings }[view]), [view]);

  if (authenticating) {
    return (
      <div className="auth-loading">
        <Dumbbell size={26} />
        <span className="ring-loader" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

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
          <button className="profile" onClick={logout} title="Log out">
            <span>{user?.name?.charAt(0)?.toUpperCase() || 'G'}</span>
            <div><b>{user?.name || 'Guest'}</b><small>{user?.email || 'signed in'}</small></div>
            <LogOut size={16} className="logout-icon" />
          </button>
        </div>
      </aside>

      <div className="mobile-brand">
        <Dumbbell size={18} /><b>VISHIFY<em>GYM</em></b>
        <button className="mobile-logout" onClick={logout} aria-label="Log out"><LogOut size={16} /></button>
      </div>
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