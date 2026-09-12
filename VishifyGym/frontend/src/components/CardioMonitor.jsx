import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from './Card';

const tooltipStyle = { background: '#151a23', border: '1px solid #2b3442', borderRadius: 12, fontSize: 12 };

export function CardioMonitor({ daily, cardio }) {
  const stats = cardio || { sessions: [], totalMinutes: 0, avgMinutes: 0, best: 0, target: 20 };
  const base = stats.target || 20;
  const sessions = (stats.sessions || []).slice().reverse().slice(-8).reverse();
  const best = stats.best || 0;
  const paced = (stats.sessions || []).filter((s) => s.speed > 0);
  const topPace = paced.length ? Math.max(...paced.map((s) => s.speed)) : 0;

  return (
    <>
      <div className="progress-strip">
        <div className="progress-stat"><span>total cardio</span><b>{stats.totalMinutes} min</b></div>
        <div className="progress-stat"><span>avg / day</span><b>{stats.avgMinutes.toFixed(1)} min</b></div>
        <div className="progress-stat"><span>best session (PB)</span><b>{best} min</b></div>
        <div className="progress-stat"><span>top pace</span><b>{topPace > 0 ? `${topPace.toFixed(1)} km/h` : '—'}</b></div>
      </div>

      <Card title="Cardio stamina" subtitle={`Minutes logged vs your ${base} min daily target`} className="chart-card wide-chart">
        <ResponsiveContainer width="100%" height={225}>
          <BarChart data={daily} margin={{ top: 16, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cardioFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#71e6f4" stopOpacity="0.9" />
                <stop offset="1" stopColor="#71e6f4" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#77818e', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis hide />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#ffffff0a' }} formatter={(value) => [`${value} min`, 'cardio']} />
            <ReferenceLine y={base} stroke="#7CFF6B" strokeDasharray="4 4" label={{ value: `${base} min goal`, fill: '#7CFF6B', fontSize: 9, position: 'insideTopRight' }} />
            {best > 0 && <ReferenceLine y={best} stroke="#a992ff" strokeDasharray="6 3" label={{ value: `PB ${best}`, fill: '#a992ff', fontSize: 9, position: 'insideBottomRight' }} />}
            <Bar dataKey="cardioMinutes" fill="url(#cardioFill)" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {sessions.length > 0 && (
        <Card title="Cardio sessions" subtitle="Your recent runs and treadmill blocks" className="chart-card wide-chart">
          <div className="session-chips">
            {sessions.map((session) => (
              <div className="chip" key={session.date + session.durationMinutes}>
                <span className="chip-dot" />
                <div>
                  <b>{new Date(session.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric' })}</b>
                  <small>{session.durationMinutes} min{session.speed ? ` · ${session.speed} km/h` : ''}</small>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}