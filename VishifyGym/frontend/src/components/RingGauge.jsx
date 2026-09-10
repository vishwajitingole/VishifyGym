const pct = (value, total) => Math.min(100, Math.max(0, Math.round((value / total) * 100)));
const number = (value) => new Intl.NumberFormat('en-IN').format(Math.round(value));

export function RingGauge({ value, target, label, unit, color = '#7CFF6B', icon: Icon, subtitle }) {
  const progress = pct(value, target);
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  return (
    <article className="gauge-card">
      <div className="gauge-title">
        <span className="icon-dot" style={{ '--dot': color }}>{Icon && <Icon size={15} />}</span>
        {label}
      </div>
      <div className="gauge-wrap">
        <svg viewBox="0 0 112 112" aria-label={`${label}: ${value} of ${target}`}>
          <circle className="gauge-track" cx="56" cy="56" r={radius} />
          <circle
            className="gauge-value"
            cx="56"
            cy="56"
            r={radius}
            style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: circumference - (circumference * progress) / 100 }}
          />
        </svg>
        <div className="gauge-number">
          <b>{number(value)}</b>
          <span>/{number(target)} {unit}</span>
        </div>
      </div>
      <div className="gauge-footer">
        <span>{progress}% complete{subtitle && ` · ${subtitle}`}</span>
        <span className="tiny-pulse" style={{ background: color }} />
      </div>
    </article>
  );
}