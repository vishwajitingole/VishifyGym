import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from './Card';

const tooltipStyle = { background: '#151a23', border: '1px solid #2b3442', borderRadius: 12, fontSize: 12 };

export function ProgressCharts({ daily, exerciseMax }) {
  const [exerciseFocus, setExerciseFocus] = useState(null);
  const names = useMemo(() => Object.keys(exerciseMax || {}).slice(0, 6), [exerciseMax]);

  return (
    <>
      <div className="chart-grid">
        <Card title="Nutrition rhythm" subtitle="Daily protein from eggs & curd" className="chart-card">
          <ResponsiveContainer width="100%" height={235}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="proteinFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#7CFF6B" stopOpacity="0.42" />
                  <stop offset="1" stopColor="#7CFF6B" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="calorieFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#f5c85a" stopOpacity="0.3" />
                  <stop offset="1" stopColor="#f5c85a" stopOpacity="0" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#77818e', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="protein" stroke="#7CFF6B" strokeWidth={3} fill="url(#proteinFill)" />
              <Area type="monotone" dataKey="calories" stroke="#f5c85a" strokeWidth={2} fill="url(#calorieFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Eggs & curd" subtitle="Daily count of your two foundation foods" className="chart-card">
          <ResponsiveContainer width="100%" height={235}>
            <BarChart data={daily}>
              <CartesianGrid stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#77818e', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis hide allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#ffffff0a' }} />
              <Bar dataKey="eggs" name="eggs" fill="#7CFF6B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="dahiBowls" name="curd bowls" fill="#a992ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="chart-key">
            <span><i className="green" /> Eggs</span>
            <span><i className="purple" /> Dahi bowls</span>
          </div>
        </Card>

        <Card title="Training volume" subtitle="Total weight lifted per day (sets × reps × kg)" className="chart-card wide-chart">
          <ResponsiveContainer width="100%" height={225}>
            <BarChart data={daily}>
              <defs>
                <linearGradient id="volumeFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#a992ff" stopOpacity="0.9" />
                  <stop offset="1" stopColor="#a992ff" stopOpacity="0.25" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#77818e', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#ffffff0a' }} />
              <Bar dataKey="volume" fill="url(#volumeFill)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Exercise PRs" subtitle="Heaviest weight logged per exercise" className="chart-card wide-chart">
          {names.length ? (
            <>
              <div className="pr-selector">
                {names.map((name) => (
                  <button key={name} className={exerciseFocus === name ? 'selected' : ''} onClick={() => setExerciseFocus(exerciseFocus === name ? null : name)}>
                    <small>{name}</small><b>{exerciseMax[name]} kg</b>
                  </button>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={names.map((name) => ({ name, max: exerciseMax[name] }))}>
                  <CartesianGrid stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#77818e', fontSize: 9 }} interval={0} angle={-18} textAnchor="end" height={46} />
                  <YAxis hide />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#ffffff0a' }} />
                  <Bar dataKey="max" name="max kg" fill="#f5c85a" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <p className="empty-state">Log weighted sets and your lifetime PRs will appear here.</p>
          )}
        </Card>
      </div>
    </>
  );
}