import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, ArrowDownToLine, BarChart3, Check, ChevronRight, CirclePlus, CloudOff, Droplets, Dumbbell, Egg, Flame, Gauge, Home, Leaf, Loader2, MoreHorizontal, Plus, Settings2, Sparkles, Target, Trophy, Utensils, Waves, X, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGym } from './state/GymContext';
import { dateLabel, todayId } from './data';
import { queue, request } from './lib/api';

const nav = [{ id: 'home', icon: Home, label: 'Today' }, { id: 'progress', icon: BarChart3, label: 'Progress' }, { id: 'workout', icon: Dumbbell, label: 'Train' }, { id: 'settings', icon: Settings2, label: 'Settings' }];
const pct = (value, total) => Math.min(100, Math.round((value / total) * 100));
const number = (value) => new Intl.NumberFormat('en-IN').format(Math.round(value));

function RingGauge({ value, target, label, unit, color = '#7CFF6B', icon: Icon }) {
  const progress = pct(value, target); const radius = 43; const circumference = 2 * Math.PI * radius;
  return <article className="gauge-card">
    <div className="gauge-title"><span className="icon-dot" style={{ '--dot': color }}><Icon size={15} /></span>{label}</div>
    <div className="gauge-wrap"><svg viewBox="0 0 112 112" aria-label={`${label}: ${value} of ${target}`}><circle className="gauge-track" cx="56" cy="56" r={radius}/><circle className="gauge-value" cx="56" cy="56" r={radius} style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: circumference - (circumference * progress) / 100 }}/></svg><div className="gauge-number"><b>{number(value)}</b><span>/{number(target)} {unit}</span></div></div>
    <div className="gauge-footer"><span>{progress}% complete</span><span className="tiny-pulse" style={{ background: color }} /></div>
  </article>;
}

function Card({ title, subtitle, action, children, className = '' }) {
  return <section className={`card ${className}`}><div className="card-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}

function WaterCard() {
  const { dashboard, quickAdd } = useGym(); const { today, weekly } = dashboard;
  return <Card title="Hydration" subtitle="A little often wins" action={<button className="icon-button aqua" onClick={() => quickAdd('water')} aria-label="Add a glass of water"><Plus size={19}/></button>} className="water-card">
    <div className="water-main"><div className="water-bubble"><Droplets size={28}/></div><div><strong>{today.waterGlasses}<small> / 10 glasses</small></strong><p>{Math.max(0, 10 - today.waterGlasses)} to your daily flow</p></div><button className="outline-mini" onClick={() => quickAdd('water')}>+ Glass</button></div>
    <div className="water-bars">{weekly.map((day) => <div className="water-day" key={day.date}><i style={{ height: `${Math.min(100, day.waterGlasses * 10)}%` }} /><span>{day.label[0]}</span></div>)}</div>
  </Card>;
}

function NutritionActions() {
  const { dashboard, quickAdd } = useGym(); const { eggs, dahiBowls } = dashboard.today;
  return <section className="quick-actions" aria-label="Quick nutrition add">
    <button className="quick-add egg-add" onClick={() => quickAdd('egg')}><span className="action-icon"><Egg /></span><span><b>+1 Egg</b><small>6g protein · 72 kcal</small></span><strong>{eggs}</strong></button>
    <button className="quick-add dahi-add" onClick={() => quickAdd('dahi')}><span className="action-icon"><Utensils /></span><span><b>+1 Bowl Dahi</b><small>300g · 11g protein</small></span><strong>{dahiBowls}</strong></button>
  </section>;
}

function Consistency({ weekly }) {
  return <Card title="Consistency" subtitle="Protein goal · training logged" action={<span className="green-chip"><Flame size={14}/> 5 day run</span>}>
    <div className="consistency-grid">{weekly.map((day) => { const proteinDone = day.protein >= 130; return <div className="consistency-day" key={day.date}><div className={`contribution ${day.workedOut ? 'trained' : ''} ${proteinDone ? 'fed' : ''}`}><span>{day.workedOut && <Dumbbell size={13}/>}</span></div><small>{day.label.slice(0, 2)}</small></div>; })}</div>
    <div className="legend"><span><i className="contribution"/> Rest</span><span><i className="contribution trained"/> Training</span><span><i className="contribution fed"/> Protein hit</span></div>
  </Card>;
}

function RecoveryMap({ workouts }) {
  const latest = workouts.at(0); const active = latest?.type === 'pull' ? 'pull' : latest?.type === 'push' || latest?.type === 'pushups' ? 'push' : null;
  return <Card title="Recovery status" subtitle={active ? `${active === 'push' ? 'Chest & triceps' : 'Back & biceps'} are recovering` : 'Ready for your next session'} action={<span className={`recovery-status ${active ? 'healing' : 'ready'}`}>{active ? '42h' : 'Ready'}</span>} className="recovery-card">
    <div className="recovery-content"><svg className="body-map" viewBox="0 0 150 176" role="img" aria-label="Muscle recovery map"><circle cx="75" cy="18" r="13" className="body-base"/><path className="body-base" d="M55 37 Q75 29 95 37L109 64 96 73 95 134 55 134 54 73 41 64Z"/><path className="body-base" d="M54 42L33 81 42 87 60 57M96 42L117 81 108 87 90 57M58 132L49 168M92 132L101 168" fill="none" strokeWidth="14" strokeLinecap="round"/>{active === 'push' && <><path className="muscle-hot" d="M56 48L75 41 94 48 91 68 59 68Z"/><path className="muscle-hot" d="M48 54L38 79M102 54L112 79"/></>}{active === 'pull' && <><path className="muscle-hot" d="M60 45L75 39 90 45 95 75 55 75Z"/><path className="muscle-hot" d="M49 57L40 80M101 57L110 80"/></>}</svg><div className="recovery-copy"><b>{active ? 'Active recovery' : 'Fully restored'}</b><p>{active ? 'Your heat fades from red to green across 48 hours.' : 'No recent muscle stress detected.'}</p><div className="recovery-scale"><i/><i/><i/><i/></div><small>stressed <span/> recovered</small></div></div>
  </Card>;
}

function GroceryForecast() {
  const { dashboard } = useGym(); const { eggs, dahiBowls } = dashboard.forecast;
  return <Card title="Next 7 days" subtitle="Based on your recent intake" action={<button className="text-button">Details <ChevronRight size={15}/></button>} className="grocery-card">
    <div className="grocery-row"><span className="food-orb egg"><Egg size={23}/></span><div><b>{eggs} eggs</b><small>about {Math.ceil(eggs / 6)} trays</small></div><span className="trend-up">↑ steady</span></div><div className="grocery-row"><span className="food-orb dahi"><Utensils size={21}/></span><div><b>{dahiBowls} dahi bowls</b><small>{dahiBowls * 300 / 1000}kg total curd</small></div><span className="trend-up">↑ steady</span></div>
  </Card>;
}

function Overview() {
  const { dashboard, offline, syncing, pending } = useGym(); const { today, weekly, workouts } = dashboard;
  const isSunday = new Date(`${today.date}T12:00:00`).getDay() === 0;
  return <main className="page-content home-view">
    <header className="topbar"><div><p className="eyebrow">{dateLabel(today.date)}</p><h1>Stay in motion<span>.</span></h1></div><div className="connection"><span className={offline ? 'offline' : 'online'}>{syncing ? <Loader2 className="spin" size={14}/> : offline ? <CloudOff size={14}/> : <Waves size={14}/>}</span><small>{offline ? `${pending} saved offline` : 'Synced'}</small></div></header>
    <section className="hero"><div className="hero-grid"/><div className="hero-copy"><span className="hero-pill"><Sparkles size={14}/> Daily command center</span><h2>Small logs.<br/><em>Big momentum.</em></h2><p>Fuel with intention and make every rep count.</p></div><div className="hero-figure"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="lift-icon"><Dumbbell size={58}/></div><span className="hero-float f-one">+6g <small>protein</small></span><span className="hero-float f-two">PR <Trophy size={13}/></span></div></section>
    <NutritionActions />
    <section className="gauge-grid"><RingGauge value={today.nutrition.protein} target={today.proteinTarget} label="Protein" unit="g" icon={Target}/><RingGauge value={today.nutrition.calories} target={today.calorieTarget} label="Calories" unit="kcal" color="#71e6f4" icon={Flame}/></section>
    <section className="today-workout"><div><span className="eyebrow">TRAINING PLAN</span><h2>{isSunday ? 'Sunday pushup focus' : 'What are we training?'}</h2><p>{isSunday ? 'The only scheduled movement today: Pushups.' : 'Start a focused session. Your last numbers are ready.'}</p></div><div className="workout-buttons">{isSunday ? <SessionLauncher type="pushups" /> : <><SessionLauncher type="push"/><SessionLauncher type="pull"/></>}</div></section>
    <div className="content-grid"><div className="stack"><WaterCard /><Consistency weekly={weekly}/></div><div className="stack"><GroceryForecast /><RecoveryMap workouts={workouts}/></div></div>
  </main>;
}

function SessionLauncher({ type }) {
  const [open, setOpen] = useState(false); const labels = { push: 'Push', pull: 'Pull', pushups: 'Log pushups' };
  return <>{open && <WorkoutSheet type={type} close={() => setOpen(false)}/>}<button className={`session-button ${type}`} onClick={() => setOpen(true)}><Dumbbell size={16}/>{labels[type]}</button></>;
}

function WorkoutSheet({ type, close }) {
  const { exercises, dashboard, refresh } = useGym(); const [saving, setSaving] = useState(false); const [dips, setDips] = useState(0);
  const isSunday = new Date(`${dashboard.today.date}T12:00:00`).getDay() === 0;
  const current = type === 'pushups' ? exercises.filter((e) => e.name === 'Pushups') : exercises.filter((e) => e.category === type && e.name !== 'Dips' && !(isSunday && type === 'push'));
  const [logs, setLogs] = useState(() => current.map((exercise) => ({ exercise: exercise._id, exerciseName: exercise.name, sets: [{ reps: '', weight: '' }, { reps: '', weight: '' }, { reps: '', weight: '' }] })));
  useEffect(() => {
    request(`/workouts/last/${type}`).then((last) => {
      if (!last) return;
      setLogs(current.map((exercise) => {
        const previous = last.exerciseLogs.find((entry) => entry.exerciseName === exercise.name);
        return previous ? { ...previous, sets: [...previous.sets.map((set) => ({ reps: set.reps, weight: set.weight })), ...Array.from({ length: Math.max(0, 3 - previous.sets.length) }, () => ({ reps: '', weight: '' }))] } : { exercise: exercise._id, exerciseName: exercise.name, sets: [{ reps: '', weight: '' }, { reps: '', weight: '' }, { reps: '', weight: '' }] };
      }));
    }).catch(() => {});
  // The exercise selection is intentionally captured when this sheet opens.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);
  const volume = logs.reduce((total, log) => total + log.sets.reduce((sum, set) => sum + (+set.reps || 0) * (+set.weight || 0), 0), 0);
  const change = (entryIndex, setIndex, key, value) => setLogs((all) => all.map((entry, i) => i === entryIndex ? { ...entry, sets: entry.sets.map((set, j) => j === setIndex ? { ...set, [key]: value } : set) } : entry));
  const submit = async () => { setSaving(true); const payload = { date: dashboard.today.date, type, exerciseLogs: [...logs, ...(dips ? [{ exerciseName: 'Dips', sets: [{ reps: dips, weight: 0 }], maxReps: +dips }] : [])] }; try { const result = await request('/workouts', { method: 'POST', body: JSON.stringify(payload) }); if (result.personalRecords?.length) confetti({ particleCount: 140, spread: 75, origin: { y: .8 }, colors: ['#7CFF6B', '#f5c85a', '#71e6f4'] }); await refresh(); close(); } catch { queue({ path: '/workouts', options: { method: 'POST', body: JSON.stringify(payload) } }); close(); } finally { setSaving(false); } };
  return <div className="sheet-backdrop"><section className="workout-sheet"><header><div><span className="eyebrow">{type === 'pushups' ? 'SUNDAY ONLY' : 'SESSION BUILDER'}</span><h2>{type === 'pushups' ? 'Pushup milestone' : `${type[0].toUpperCase() + type.slice(1)} session`}</h2></div><button className="icon-button" onClick={close}><X/></button></header>{type === 'pull' && <div className="superset-note"><Zap size={16}/> Close Grip EZ Curls + Seated Preacher Curls are paired as a superset.</div>}<div className="workout-exercises">{logs.map((log, entryIndex) => <div className={`exercise-entry ${log.exerciseName.includes('Close Grip') || log.exerciseName.includes('Preacher') ? 'superset' : ''}`} key={log.exerciseName}><div className="exercise-title"><b>{log.exerciseName}</b><small>{log.exerciseName.includes('Close Grip') || log.exerciseName.includes('Preacher') ? 'Superset A' : 'Last session auto-fills when API history is available'}</small></div><div className="sets-grid"><span>SET</span><span>REPS</span><span>KG</span>{log.sets.map((set, setIndex) => <div className="set-row" key={setIndex}><i>{setIndex + 1}</i><input inputMode="numeric" aria-label={`${log.exerciseName} set ${setIndex + 1} reps`} value={set.reps} onChange={(e) => change(entryIndex, setIndex, 'reps', e.target.value)} placeholder="—"/><input inputMode="decimal" aria-label={`${log.exerciseName} set ${setIndex + 1} weight`} value={set.weight} onChange={(e) => change(entryIndex, setIndex, 'weight', e.target.value)} placeholder="—"/></div>)}</div></div>)}</div>{type === 'push' && <div className="dips-dock"><div><Dumbbell size={18}/><b>Log Dips</b><small>Any time, including warm-up</small></div><input inputMode="numeric" value={dips} onChange={(e) => setDips(e.target.value)} placeholder="reps"/></div>}<footer><div><small>SESSION VOLUME</small><strong>{number(volume)} kg</strong></div><button className="save-workout" disabled={saving} onClick={submit}>{saving ? 'Saving...' : <><Check size={18}/> Complete session</>}</button></footer></section></div>;
}

function Progress() {
  const { dashboard } = useGym(); const [range, setRange] = useState(7); const data = dashboard.weekly;
  return <main className="page-content"><header className="topbar"><div><p className="eyebrow">YOUR METRICS</p><h1>Progress, visualized<span>.</span></h1></div><TimeRange value={range} change={setRange}/></header><section className="pr-banner"><div className="trophy-orb"><Trophy/></div><div><span>PERSONAL RECORD</span><h2>Barbell Chest Press <b>70 kg</b></h2><p>Up 5 kg from your previous best.</p></div><button onClick={() => confetti({ particleCount: 150, spread: 90 })}>Celebrate <Sparkles size={15}/></button></section><div className="chart-grid"><Card title="Nutrition rhythm" subtitle="Daily protein intake" className="chart-card"><ResponsiveContainer width="100%" height={235}><AreaChart data={data}><defs><linearGradient id="proteinFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#7CFF6B" stopOpacity=".42"/><stop offset="1" stopColor="#7CFF6B" stopOpacity="0"/></linearGradient></defs><CartesianGrid stroke="#ffffff10" vertical={false}/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#77818e', fontSize: 12 }}/><YAxis hide/><Tooltip contentStyle={{ background: '#151a23', border: '1px solid #2b3442', borderRadius: 12 }}/><Area type="monotone" dataKey="protein" stroke="#7CFF6B" strokeWidth={3} fill="url(#proteinFill)"/></AreaChart></ResponsiveContainer></Card><Card title="Bodyweight × calories" subtitle="Morning check-in" className="chart-card"><ResponsiveContainer width="100%" height={235}><LineChart data={data.map((x, i) => ({ ...x, weight: 74.9 - i * .1 + (i === 4 ? .35 : 0), calories: x.eggs * 72 + x.dahiBowls * 180 }))}><CartesianGrid stroke="#ffffff10" vertical={false}/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#77818e', fontSize: 12 }}/><YAxis hide/><Tooltip contentStyle={{ background: '#151a23', border: '1px solid #2b3442', borderRadius: 12 }}/><Line type="monotone" dataKey="weight" stroke="#71e6f4" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="calories" stroke="#f5c85a" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer><div className="chart-key"><span><i className="cyan"/> Bodyweight</span><span><i className="gold"/> Calories</span></div></Card></div><Card title="Training volume" subtitle={`Total kg lifted · last ${range} days`} className="wide-chart"><ResponsiveContainer width="100%" height={260}><BarChart data={data.map((d, i) => ({ ...d, volume: [0, 3420, 0, 4680, 2940, 5200, 0][i] }))}><CartesianGrid stroke="#ffffff0d" vertical={false}/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#77818e', fontSize: 12 }}/><YAxis hide/><Tooltip cursor={{ fill: '#ffffff08' }} contentStyle={{ background: '#151a23', border: '1px solid #2b3442', borderRadius: 12 }}/><Bar dataKey="volume" radius={[8, 8, 2, 2]} fill="#a992ff"/></BarChart></ResponsiveContainer></Card></main>;
}

function TimeRange({ value, change }) { return <div className="time-range">{[7, 30, 90].map((day) => <button key={day} className={value === day ? 'active' : ''} onClick={() => change(day)}>{day}D</button>)}</div>; }

function Training() {
  const { dashboard } = useGym(); const sunday = new Date(`${dashboard.today.date}T12:00:00`).getDay() === 0;
  return <main className="page-content train-view"><header className="topbar"><div><p className="eyebrow">TRAINING ROOM</p><h1>{sunday ? 'Sunday protocol' : 'Choose your work'}<span>.</span></h1></div></header><section className="train-hero"><span className="train-line"/><Dumbbell/><div><h2>{sunday ? 'Pushups only.' : 'Train with purpose.'}</h2><p>{sunday ? 'Today is for deliberate pushup volume and a new milestone.' : 'Pick a focused session; the past is already loaded into your plan.'}</p></div></section><div className="training-options">{sunday ? <SessionLauncher type="pushups"/> : <><SessionLauncher type="push"/><SessionLauncher type="pull"/><SessionLauncher type="pushups"/></>}</div><Card title="Cardio check-in" subtitle="Log both daily essentials"><CardioLogger /></Card><Card title="Sunday pushup milestones" subtitle="Your dedicated weekly effort"><div className="milestone"><b>186 <small>best reps</small></b><div><i style={{ width: '75%' }}/></div><span>Target 250</span></div></Card></main>;
}

function CardioLogger() {
  const { dashboard, refresh } = useGym(); const [minutes, setMinutes] = useState(''); const [speed, setSpeed] = useState(''); const [saved, setSaved] = useState(false);
  const save = async () => { if (!minutes || !speed) return; const operation = { path: '/workouts', options: { method: 'POST', body: JSON.stringify({ date: dashboard.today.date, type: 'cardio', durationMinutes: +minutes, speed: +speed, exerciseLogs: [] }) } }; try { await request(operation.path, operation.options); await refresh(); } catch { queue(operation); } setSaved(true); };
  return <div className="cardio-form"><label>Minutes<input type="number" value={minutes} onChange={(event) => setMinutes(event.target.value)} placeholder="20"/></label><label>Speed<input type="number" value={speed} onChange={(event) => setSpeed(event.target.value)} step=".1" placeholder="6.0"/></label><button className="save-workout" onClick={save}>{saved ? <><Check size={16}/> Logged</> : 'Save cardio'}</button></div>;
}

function Settings() {
  const { exercises, editExercise } = useGym(); const [name, setName] = useState(''); const [category, setCategory] = useState('push'); const [filter, setFilter] = useState('all');
  const displayed = exercises.filter((exercise) => filter === 'all' || exercise.category === filter);
  const submit = (event) => { event.preventDefault(); if (!name.trim()) return; editExercise('add', { name: name.trim(), category }); setName(''); };
  const download = () => { window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/export/csv`; };
  return <main className="page-content settings-view"><header className="topbar"><div><p className="eyebrow">MAKE IT YOURS</p><h1>Routine settings<span>.</span></h1></div><button className="outline-mini" onClick={download}><ArrowDownToLine size={15}/> Export CSV</button></header><Card title="Exercise library" subtitle="Your exact routine, editable whenever it changes"><div className="filter-tabs">{['all', 'cardio', 'push', 'pull'].map((item) => <button className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div><div className="exercise-list">{displayed.map((exercise) => <div className="exercise-item" key={exercise._id}><span className={`category-icon ${exercise.category}`}><Dumbbell size={15}/></span><div><b>{exercise.name}</b><small>{exercise.category}</small></div><button className="remove-exercise" onClick={() => editExercise('remove', exercise)} aria-label={`Remove ${exercise.name}`}><X size={16}/></button></div>)}</div><form className="add-exercise" onSubmit={submit}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="New exercise name"/><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="push">Push</option><option value="pull">Pull</option><option value="cardio">Cardio</option></select><button><CirclePlus size={17}/> Add</button></form></Card><Card title="Daily targets" subtitle="Set the baseline for your streaks"><div className="target-settings"><label><Target/> Protein<input defaultValue="130" type="number"/><small>grams</small></label><label><Flame/> Calories<input defaultValue="2400" type="number"/><small>kcal</small></label><label><Activity/> Cardio<input defaultValue="20" type="number"/><small>minutes</small></label></div></Card></main>;
}

export function App() {
  const [view, setView] = useState('home'); const Screen = useMemo(() => ({ home: Overview, progress: Progress, workout: Training, settings: Settings }[view]), [view]);
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span><Dumbbell size={21}/></span><b>VISHIFY<em>GYM</em></b></div><nav>{nav.map(({ id, icon: Icon, label }) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}><Icon size={20}/><span>{label}</span></button>)}</nav><div className="sidebar-bottom"><div className="streak"><Flame size={18}/><div><b>05 day</b><small>protein streak</small></div></div><button className="profile"><span>VG</span><div><b>Vishwajit</b><small>Level 12</small></div><MoreHorizontal size={18}/></button></div></aside><div className="mobile-brand"><Dumbbell size={18}/><b>VISHIFY<em>GYM</em></b></div><Screen/><nav className="mobile-nav">{nav.map(({ id, icon: Icon, label }) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}><Icon size={19}/><span>{label}</span></button>)}</nav></div>;
}
