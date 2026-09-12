import { useEffect, useMemo, useState } from 'react';
import { Card } from './Card';
import { request } from '../lib/api';

const levelFor = (count) => (count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : 3);

export function YearHeatmap({ today }) {
  const [heatmap, setHeatmap] = useState([]);

  useEffect(() => {
    request(`/progress/heatmap?days=365&date=${today}`)
      .then((data) => setHeatmap(data.heatmap || []))
      .catch(() => setHeatmap([]));
  }, [today]);

  const grid = useMemo(() => {
    if (!heatmap.length) return [];
    const counts = Object.fromEntries(heatmap.map((cell) => [cell.date, cell.count]));
    const end = new Date(`${today}T12:00:00`);
    const start = new Date(end);
    start.setDate(end.getDate() - 364);
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - start.getDay());
    const weeks = [];
    const cursor = new Date(gridStart);
    while (cursor <= end) {
      const column = [];
      for (let row = 0; row < 7; row++) {
        const id = cursor.toLocaleDateString('en-CA');
        column.push({ date: id, count: id <= today && id >= gridStart.toLocaleDateString('en-CA') ? (counts[id] || 0) : -1 });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(column);
    }
    return weeks;
  }, [heatmap, today]);

  const months = useMemo(() => {
    const marks = [];
    const end = new Date(`${today}T12:00:00`);
    const start = new Date(end);
    start.setDate(end.getDate() - 364);
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - start.getDay());
    let cursor = new Date(gridStart);
    let prevMonth = -1;
    while (cursor <= end) {
      const m = cursor.getMonth();
      if (m !== prevMonth) {
        const mid = new Date(cursor);
        mid.setDate(mid.getDate() + 3);
        marks.push({ label: mid.toLocaleDateString('en', { month: 'short' }), offset: (cursor - gridStart) / 86400000 });
        prevMonth = m;
      }
      cursor.setDate(cursor.getDate() + 7);
    }
    return marks;
  }, [today]);

  const activeDays = heatmap.filter((cell) => cell.count > 0).length;

  return (
    <Card title="A year of consistency" subtitle={`${activeDays} day${activeDays === 1 ? '' : 's'} trained in the last 365`} className="chart-card wide-chart">
      <div className="heatmap">
        <div className="heatmap-months">
          {months.map((mark) => (
            <span key={mark.label + mark.offset} style={{ marginLeft: `${(mark.offset / 7) * 14}px` }}>{mark.label}</span>
          ))}
        </div>
        <div className="heatmap-grid">
          {grid.map((column, i) => (
            <div className="heatmap-column" key={i}>
              {column.map((cell) => {
                if (cell.count < 0) return <span className="heatmap-cell none" key={cell.date} />;
                return (
                  <span
                    className={`heatmap-cell level-${levelFor(cell.count)}`}
                    key={cell.date}
                    title={`${cell.date} — ${cell.count} session${cell.count === 1 ? '' : 's'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="heatmap-legend">
          <span>Less</span>
          {[0, 1, 2, 3].map((level) => <span className={`heatmap-cell level-${level}`} key={level} />)}
          <span>More</span>
        </div>
      </div>
    </Card>
  );
}