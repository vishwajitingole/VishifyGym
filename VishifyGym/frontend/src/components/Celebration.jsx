import { useEffect } from 'react';
import { Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

export function Celebration({ title, message, colors = ['#7CFF6B', '#f5c85a', '#71e6f4', '#ffffff'], onClose }) {
  useEffect(() => {
    const bursts = [
      { particleCount: 140, spread: 100, origin: { y: 0.6 }, zIndex: 1200 },
      { particleCount: 60, spread: 140, origin: { y: 0.35 }, zIndex: 1200 }
    ];
    setTimeout(() => bursts.forEach((burst) => confetti({ ...burst, colors })), 80);
    const timer = setTimeout(onClose, 3600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="celebration" role="dialog" aria-label={title}>
      <div className="celebration-card">
        <div className="celebration-ring" />
        <div className="celebration-trophy"><Trophy size={32} /></div>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
    </div>
  );
}