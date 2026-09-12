import { useEffect, useState } from 'react';
import { ArrowDownToLine, Bell, CheckCircle2, ChevronDown, ChevronUp, CirclePlus, Dumbbell, Flame, LogOut, Target, X, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGym } from '../state/GymContext';
import { Card } from '../components/Card';
import { API_BASE, getToken } from '../lib/api';

export function Settings() {
  const { exercises, editExercise, reorderExercises, updateProfile, user, logout, dashboard } = useGym();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('push');
  const [filter, setFilter] = useState('all');
  const [justRemoved, setJustRemoved] = useState(null);
  const [targets, setTargets] = useState({
    proteinTarget: dashboard.today.proteinTarget ?? 50,
    calorieTarget: dashboard.today.calorieTarget ?? 900,
    cardioTargetMinutes: dashboard.today.cardioTargetMinutes ?? 20
  });
  const [savedTargets, setSavedTargets] = useState(false);
  const [schedule, setSchedule] = useState(() => ({ ...(user?.schedule || {}) }));
  const [scheduleSaved, setScheduleSaved] = useState(false);
  const [nudges, setNudges] = useState(() => localStorage.getItem('vishify-nudge-enabled') === '1');

  const DAYS = [
    { id: 0, short: 'S', full: 'Sun' },
    { id: 1, short: 'M', full: 'Mon' },
    { id: 2, short: 'T', full: 'Tue' },
    { id: 3, short: 'W', full: 'Wed' },
    { id: 4, short: 'T', full: 'Thu' },
    { id: 5, short: 'F', full: 'Fri' },
    { id: 6, short: 'S', full: 'Sat' }
  ];

  const cycleDay = (dayId) => {
    const key = String(dayId);
    const current = schedule[key];
    const nextType = current === 'push' ? 'pull' : current === 'pull' ? 'rest' : current === 'rest' ? undefined : 'push';
    setSchedule((prev) => {
      const copy = { ...prev };
      if (nextType) copy[key] = nextType; else delete copy[key];
      return copy;
    });
  };

  const saveSchedule = async (event) => {
    event.preventDefault();
    const updated = await updateProfile({ schedule });
    if (updated) {
      setScheduleSaved(true);
      setTimeout(() => setScheduleSaved(false), 2200);
    }
  };

  const toggleNudges = (event) => {
    const on = event.target.checked;
    setNudges(on);
    if (on) {
      localStorage.setItem('vishify-nudge-enabled', '1');
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    } else {
      localStorage.removeItem('vishify-nudge-enabled');
      localStorage.removeItem('vishify-nudge-last');
    }
  };

  useEffect(() => {
    setTargets({
      proteinTarget: dashboard.today.proteinTarget ?? 50,
      calorieTarget: dashboard.today.calorieTarget ?? 900,
      cardioTargetMinutes: dashboard.today.cardioTargetMinutes ?? 20
    });
  }, [dashboard.today.proteinTarget, dashboard.today.calorieTarget, dashboard.today.cardioTargetMinutes]);

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

  const move = async (id, direction) => {
    const target = exercises.find((e) => e._id === id);
    if (!target) return;
    const sameCategory = exercises.filter((e) => e.category === target.category);
    const from = sameCategory.findIndex((e) => e._id === id);
    const to = from + direction;
    if (to < 0 || to >= sameCategory.length) return;
    const next = [...sameCategory];
    [next[from], next[to]] = [next[to], next[from]];
    await reorderExercises(target.category, next.map((e) => e._id));
  };

  const saveTargets = async (event) => {
    event.preventDefault();
    const updated = await updateProfile({
      proteinTarget: Math.max(0, Number(targets.proteinTarget) || 0),
      calorieTarget: Math.max(0, Number(targets.calorieTarget) || 0),
      cardioTargetMinutes: Math.max(0, Math.round(Number(targets.cardioTargetMinutes) || 0))
    });
    if (updated) {
      setSavedTargets(true);
      setTimeout(() => setSavedTargets(false), 2200);
    }
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

      <Card title="Exercise library" subtitle="Reorder the sequence with ↑/↓ — it controls your plan order">
        <div className="filter-tabs">
          {['all', 'cardio', 'push', 'pull'].map((item) => (
            <button className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>
          ))}
        </div>
        <div className="exercise-list">
          {displayed.map((exercise) => (
            <div className="exercise-item" key={exercise._id}>
              <span className="exercise-order">{exercises.filter((e) => e.category === exercise.category).findIndex((e) => e._id === exercise._id) + 1}</span>
              <span className={`category-icon ${exercise.category}`}><Dumbbell size={15} /></span>
              <div><b>{exercise.name}</b><small>{exercise.category}{exercise.isSeeded ? ' · seeded' : ''}</small></div>
              {filter !== 'all' && (
                <div className="move-exercise">
                  <button onClick={() => move(exercise._id, -1)} aria-label="Move up"><ChevronUp size={15} /></button>
                  <button onClick={() => move(exercise._id, 1)} aria-label="Move down"><ChevronDown size={15} /></button>
                </div>
              )}
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
        <Card title="Daily targets" subtitle="Set the bar — then just log and let the coach nudge you">
          <form className="target-settings" onSubmit={saveTargets}>
            <label><Target /> Protein<input type="number" value={targets.proteinTarget} onChange={(e) => setTargets({ ...targets, proteinTarget: e.target.value })} /></label>
            <label><Flame /> Calories<input type="number" value={targets.calorieTarget} onChange={(e) => setTargets({ ...targets, calorieTarget: e.target.value })} /></label>
            <label><Activity /> Cardio<input type="number" value={targets.cardioTargetMinutes} onChange={(e) => setTargets({ ...targets, cardioTargetMinutes: e.target.value })} /></label>
            <button className={savedTargets ? 'target-saved' : ''}>{savedTargets ? <><CheckCircle2 size={15} /> Saved</> : 'Save targets'}</button>
          </form>
        </Card>
        <Card title="Weekly schedule" subtitle="The coach plans your week around these days — tap a day to cycle Push → Pull → Rest → Off">
          <form className="schedule-form" onSubmit={saveSchedule}>
            <div className="schedule-editor">
              {DAYS.map((day) => {
                const type = schedule[String(day.id)];
                return (
                  <button type="button" className={`schedule-day ${type || 'off'}`} onClick={() => cycleDay(day.id)} key={day.id} title={`${day.full} — tap to change`}>
                    <span>{day.short}</span>
                    <em>{type ? (type === 'rest' ? 'Rest' : type === 'push' ? 'Push' : 'Pull') : 'Off'}</em>
                  </button>
                );
              })}
            </div>
            <button className={scheduleSaved ? 'target-saved' : ''}>{scheduleSaved ? <><CheckCircle2 size={15} /> Schedule saved</> : 'Save schedule'}</button>
          </form>
        </Card>
        <Card title="Check-in reminders" subtitle="Gentle browser nudges when a pillar is still open">
          <div className="nudge-setting">
            <div><Bell size={15} /><span><b>Remind me to check in</b><small>While the app is open, get a nudge if fuel, training, or cardio is still pending.</small></span></div>
            <label className="switch"><input type="checkbox" checked={nudges} onChange={toggleNudges} /><span /></label>
          </div>
        </Card>
        <Card title="Offline sync" subtitle="Your logs go with you">
          <div className="privacy-note">
            <p>Three pillars, zero excuses — the app caches your dashboard in your browser and queues any input made without a connection. When the network returns, everything flushes to your backend automatically.</p>
            <span className="sync-status"><i /> Queue protected</span>
          </div>
        </Card>
      </div>
    </main>
  );
}