import { useMemo } from 'react';

interface WaveformProps {
  progress?: number;
}

export default function Waveform({ progress = 0.3 }: WaveformProps) {
  const leftBars = useMemo(() => {
    return Array.from({ length: 30 }, () => Math.floor(Math.random() * 20) + 8);
  }, []);

  const rightBars = useMemo(() => {
    return Array.from({ length: 30 }, () => Math.floor(Math.random() * 20) + 8);
  }, []);

  return (
    <div className="waveform-container px-4 sm:px-12 opacity-90">
      <div className="flex items-center h-full">
        {leftBars.map((height, index) => (
          <div
            key={`left-${index}`}
            className="waveform-bar bg-white dark:bg-gray-200"
            style={{ height: `${height}px` }}
          />
        ))}
      </div>
      <div className="h-8 w-1 bg-primary mx-1 rounded-full shadow-[0_0_10px_rgba(253,224,71,0.5)]" />
      <div className="flex items-center h-full">
        {rightBars.map((height, index) => (
          <div
            key={`right-${index}`}
            className="waveform-bar bg-gray-300 dark:bg-gray-600 opacity-50"
            style={{ height: `${height}px` }}
          />
        ))}
      </div>
    </div>
  );
}
