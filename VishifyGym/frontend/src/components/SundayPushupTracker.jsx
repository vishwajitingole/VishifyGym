import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Dumbbell, Flag, TrendingUp } from 'lucide-react';
import { Card } from './Card';

export function SundayPushupTracker({ milestones, best, target = 250 }) {
  const [focused, setFocused] = useState(null);
  const data = useMemo(() => {
    if (!milestones?.length) return [];
    const sorted = [...milestones].sort((a, b) => a.date.localeCompare(b.date));
    const max = Math.max(...sorted.map((m) => m.reps), target);
    return sorted.map((m) => ({ ...m, label: new Date(`${m.date}T12:00:00`).toLocaleDateString('en', { day: 'numeric', month: 'short' }) }));
  }, [milestones, target]);

  const recent = data.at(-1);
  const bestReps = Math.max(0, ...(milestones || []).map((m) => m.reps));
  const progressToTarget = bestReps ? Math.min(100, Math.round((bestReps / target) * 100)) : 0;

  return (
    <Card
      title="Sunday pushup milestones"
      subtitle="One tracker for your weekly pushup-only protocol"
      action={<span className="green-chip"><Flag size={14} /> Week {data.length || 0}</span>}
      className="pushup-tracker"
    >
      <div className="pushup-stats">
        <div className="pushup-stat">
          <span className="stat-icon"><Dumbbell size={18} /></span>
          <div><b>{bestReps || '—'}</b><small>best reps</small></div>
        </div>
        <div className="pushup-stat">
          <span className="stat-icon gold"><TrendingUp size={18} /></span>
          <div><b>{recent?.reps || '—'}</b><small>this week</small></div>
        </div>
        <div className="pushup-stat">
          <span className="stat-icon aqua"><Flag size={18} /></span>
          <div><b>{target}</b><small>target</small></div>
        </div>
      </div>

      <div className="milestone">
        <div><i style={{ width: `${progressToTarget}%` }} /></div>
        <span>{progressToTarget}% toward {target}</span>
      </div>

      <div className="pushup-chart">
        <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={data} onMouseMove={(e) => setFocused(e?.activeTooltipIndex ?? null)} onMouseLeave={() => setFocused(null)}>
            <defs>
              <linearGradient id="pushupFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#7CFF6B" stopOpacity="0.45" />
                <stop offset="1" stopColor="#7CFF6B" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#77818e', fontSize: 11 }} />
            <YAxis hide />
            <ReferenceLine y={target} stroke="#f5c85a" strokeDasharray="5 5" label={{ value: 'Target', fill: '#f5c85a', fontSize: 10, position: 'insideTopRight' }} />
            <Tooltip contentStyle={{ background: '#151a23', border: '1px solid #2b3442', borderRadius: 12 }} labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''} />
            <Area type="monotone" dataKey="reps" stroke="#7CFF6B" strokeWidth={3} fill="url(#pushupFill)" dot={{ r: 4, fill: '#7CFF6B' }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {!data.length && <p className="empty-state">No Sunday pushup sessions logged yet. Sunday is yours — set a milestone.</p>}
    </Card>
  );
}