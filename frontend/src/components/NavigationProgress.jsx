import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const timersCleanup = (timers) => {
  timers.current.forEach((id) => clearTimeout(id));
  timers.current = [];
};

export const NavigationProgress = ({ height = 3 }) => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    timersCleanup(timers);
    setVisible(true);
    setProgress(0);

    const steps = [
      { delay: 0, value: 15 },
      { delay: 120, value: 45 },
      { delay: 300, value: 70 },
      { delay: 500, value: 90 },
      { delay: 700, value: 100 },
    ];

    steps.forEach(({ delay, value }) => {
      const id = setTimeout(() => setProgress(value), delay);
      timers.current.push(id);
    });

    const hideId = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 950);
    timers.current.push(hideId);

    return () => timersCleanup(timers);
  }, [location]);

  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-0">
      <div
        className="mx-auto w-full max-w-7xl px-4 sm:px-6"
      >
        <div
          className="h-full"
          style={{ height }}
        >
          <div
            className="h-full rounded-b-full bg-gradient-to-r from-primary via-primary/70 to-primary/40 transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
