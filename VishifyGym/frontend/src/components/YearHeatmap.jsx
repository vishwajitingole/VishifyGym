import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card } from './Card';
import { request } from '../lib/api';

const levelFor = (count) => (count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : 3);
const CELL = 12;
const GAP = 4;

export function YearHeatmap({ today }) {
  const [heatmap, setHeatmap] = useState([]);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    request(`/progress/heatmap?days=365&date=${today}`)
      .then((data) => setHeatmap(data.heatmap || []))
      .catch(() => setHeatmap([]));
  }, [today]);

  const months = useMemo(() => {
    if (!heatmap.length) return [];
    const counts = Object.fromEntries(heatmap.map((cell) => [cell.date, cell.count]));
    const end = new Date(`${today}T12:00:00`);
    const start = new Date(end);
    start.setDate(end.getDate() - 364);
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - start.getDay());
    const minId = gridStart.toLocaleDateString('en-CA');

    const result = [];
    let cursor = new Date(gridStart.getFullYear(), gridStart.getMonth(), 1);
    while (cursor.getFullYear() < end.getFullYear() || (cursor.getFullYear() === end.getFullYear() && cursor.getMonth() <= end.getMonth())) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const firstWeekday = new Date(y, m, 1).getDay();
      const columns = [];
      const dayCursor = new Date(y, m, 1 - firstWeekday);
      for (let week = 0; week < Math.ceil((firstWeekday + daysInMonth) / 7); week++) {
        const column = [];
        for (let row = 0; row < 7; row++) {
          const id = dayCursor.toLocaleDateString('en-CA');
          const inMonth = dayCursor.getMonth() === m;
          const none = !inMonth || id < minId || id > today;
          column.push({ date: id, none, count: none ? 0 : (counts[id] || 0) });
          dayCursor.setDate(dayCursor.getDate() + 1);
        }
        columns.push(column);
      }
      result.push({ key: `${y}-${m}`, label: new Date(y, m, 1).toLocaleDateString('en', { month: 'short' }), columns });
      cursor = new Date(y, m + 1, 1);
    }
    return result;
  }, [heatmap, today]);

  const activeDays = heatmap.filter((cell) => cell.count > 0).length;

  const showTooltip = (event, cell) => {
    if (cell.none) return;
    const flip = event.clientX > window.innerWidth - 190;
    const below = event.clientY < 150;
    setHover({
      x: event.clientX,
      y: event.clientY,
      fullDate: new Date(`${cell.date}T12:00:00`).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' }),
      count: cell.count,
      flip,
      below,
      level: levelFor(cell.count)
    });
  };

  return (
    <Card title="A year of consistency" subtitle={`${activeDays} day${activeDays === 1 ? '' : 's'} trained in the last 365`} className="chart-card wide-chart">
      <div className="heatmap" onMouseLeave={() => setHover(null)}>
        {createPortal(
          hover ? (
            <div className={`heatmap-tooltip level-${hover.level} ${hover.flip ? 'flip' : ''} ${hover.below ? 'below' : ''}`} style={{ left: hover.x + 12, top: hover.y + 12 }}>
              <b>{hover.fullDate}</b>
              <span>{hover.count > 0 ? `${hover.count} session${hover.count === 1 ? '' : 's'}` : 'Rest day'}</span>
            </div>
          ) : null,
          document.body
        )}
        <div className="heatmap-month-blocks">
          {months.map((month) => (
            <div className="heatmap-month" key={month.key}>
              <div className="heatmap-month-grid">
                {month.columns.map((column, i) => (
                  <div className="heatmap-column" key={i}>
                    {column.map((cell) => cell.none ? (
                      <span className="heatmap-cell none" key={cell.date} aria-hidden="true" />
                    ) : (
                      <span
                        className={`heatmap-cell level-${levelFor(cell.count)}`}
                        key={cell.date}
                        role="img"
                        aria-label={`${cell.date} — ${cell.count} session${cell.count === 1 ? '' : 's'}`}
                        onMouseEnter={(event) => showTooltip(event, cell)}
                        onMouseMove={(event) => showTooltip(event, cell)}
                        onMouseLeave={() => setHover(null)}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <span className="heatmap-month-label">{month.label}</span>
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