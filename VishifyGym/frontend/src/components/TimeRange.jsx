export function TimeRange({ value, change }) {
  return (
    <div className="time-range" role="tablist" aria-label="Time frame">
      {[7, 30, 90].map((day) => (
        <button key={day} role="tab" aria-selected={value === day} className={value === day ? 'active' : ''} onClick={() => change(day)}>
          {day}D
        </button>
      ))}
    </div>
  );
}