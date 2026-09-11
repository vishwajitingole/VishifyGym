import { HashRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { BarChart3, ClipboardList, Dumbbell, Home, LogOut, Settings2 } from 'lucide-react';
import { useGym } from './state/GymContext';
import { Overview } from './pages/Overview';
import { Progress } from './pages/Progress';
import { Training } from './pages/Training';
import { Logs } from './pages/Logs';
import { Settings } from './pages/Settings';
import { AuthScreen } from './pages/AuthScreen';

const nav = [
  { to: '/', icon: Home, label: 'Today' },
  { to: '/progress', icon: BarChart3, label: 'Progress' },
  { to: '/train', icon: Dumbbell, label: 'Train' },
  { to: '/logs', icon: ClipboardList, label: 'Logs' },
  { to: '/settings', icon: Settings2, label: 'Settings' }
];

function AppShell() {
  const { user, logout } = useGym();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand"><span><Dumbbell size={21} /></span><b>VISHIFY<em>GYM</em></b></NavLink>
        <nav>
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''} end={to === '/'}>
              <Icon size={20} /><span>{label}</span>
            </NavLink>
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

      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/train" element={<Training />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <nav className="mobile-nav">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''} end={to === '/'}>
            <Icon size={19} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function App() {
  const { user, authenticating } = useGym();
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
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}