import { useState } from 'react';
import { ArrowDownToLine, CirclePlus, Dumbbell, Flame, LogOut, Target, X, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGym } from '../state/GymContext';
import { Card } from '../components/Card';
import { API_BASE, getToken } from '../lib/api';

export function Settings() {
  const { exercises, editExercise, user, logout } = useGym();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('push');
  const [filter, setFilter] = useState('all');
  const [justRemoved, setJustRemoved] = useState(null);

  const displayed = exercises.filter((exercise) => filter === 'all' || exercise.category === filter);

  const submit = (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    editExercise('add', { name: name.trim(), category });
    setName('');
  };

  const remove = (exercise) => {
    editExercise('remove', exercise);
    setJustRemoved(exercise.name);
    setTimeout(() => setJustRemoved(null), 2200);
  };

  const download = async () => {
    try {
      const response = await fetch(`${API_BASE}/export/csv`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'vishify-gym-history.csv';
      link.click();
      URL.revokeObjectURL(url);
      confetti({ particleCount: 90, spread: 60, origin: { y: 0.2 }, colors: ['#71e6f4', '#7CFF6B'] });
    } catch {
      confetti({ particleCount: 30, spread: 40, origin: { y: 0.2 }, colors: ['#ff6b6b'] });
    }
  };

  return (
    <main className="page-content settings-view">
      <header className="topbar">
        <div>
          <p className="eyebrow">MAKE IT YOURS</p>
          <h1>Routine settings<span>.</span></h1>
        </div>
        <div className="settings-actions">
          <button className="outline-mini" onClick={download}><ArrowDownToLine size={15} /> Export CSV</button>
        </div>
      </header>

      <div className="account-card">
        <span className={`category-icon ${'cardio'}`}>{user?.name?.charAt(0)?.toUpperCase() || 'G'}</span>
        <div><b>{user?.name}</b><small>{user?.email}</small></div>
        <button className="logout-btn" onClick={logout}><LogOut size={15} /> Log out</button>
      </div>

      {justRemoved && <div className="toast-inline"><span /> {justRemoved} removed from your routine.</div>}

      <Card title="Exercise library" subtitle="Your exact routine, editable whenever it changes">
        <div className="filter-tabs">
          {['all', 'cardio', 'push', 'pull'].map((item) => (
            <button className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>
          ))}
        </div>
        <div className="exercise-list">
          {displayed.map((exercise) => (
            <div className="exercise-item" key={exercise._id}>
              <span className={`category-icon ${exercise.category}`}><Dumbbell size={15} /></span>
              <div><b>{exercise.name}</b><small>{exercise.category}{exercise.isSeeded ? ' · seeded' : ''}</small></div>
              <button className="remove-exercise" onClick={() => remove(exercise)} aria-label={`Remove ${exercise.name}`}><X size={16} /></button>
            </div>
          ))}
          {!displayed.length && <p className="empty-state">No exercises in this category.</p>}
        </div>
        <form className="add-exercise" onSubmit={submit}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New exercise name" />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="push">Push</option>
            <option value="pull">Pull</option>
            <option value="cardio">Cardio</option>
          </select>
          <button><CirclePlus size={17} /> Add</button>
        </form>
      </Card>

      <div className="settings-grid">
        <Card title="Daily targets" subtitle="Set the baseline for your streaks">
          <div className="target-settings">
            <label><Target /> Protein<input type="number" defaultValue={130} /></label>
            <label><Flame /> Calories<input type="number" defaultValue={2400} /></label>
            <label><Activity /> Cardio<input type="number" defaultValue={20} /></label>
          </div>
        </Card>
        <Card title="Offline sync" subtitle="Your logs go with you">
          <div className="privacy-note">
            <p>The app caches your dashboard in your browser and queues any input made without a connection. When the network returns, everything flushes to your backend automatically.</p>
            <span className="sync-status"><i /> Queue protected</span>
          </div>
        </Card>
      </div>
    </main>
  );
}