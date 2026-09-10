import { useState } from 'react';
import { ArrowDownToLine, CirclePlus, Dumbbell, Flame, Target, X, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGym } from '../state/GymContext';
import { Card } from '../components/Card';

export function Settings() {
  const { exercises, editExercise } = useGym();
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/export/csv`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'vishify-gym-history.csv';
      link.click();
      URL.revokeObjectURL(url);
      confetti({ particleCount: 90, spread: 60, origin: { y: 0.2 }, colors: ['#71e6f4', '#7CFF6B'] });
    } catch {
      window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/export/csv`;
    }
  };

  return (
    <main className="page-content settings-view">
      <header className="topbar">
        <div>
          <p className="eyebrow">MAKE IT YOURS</p>
          <h1>Routine settings<span>.</span></h1>
        </div>
        <button className="outline-mini" onClick={download}><ArrowDownToLine size={15} /> Export CSV</button>
      </header>

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