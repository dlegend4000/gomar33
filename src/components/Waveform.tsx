import { useMemo, useRef, useEffect, useState } from 'react';

interface WaveformProps {
  progress?: number;
}

export default function Waveform({ progress = 0 }: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  const totalBars = 200; // More bars for smoother scrolling
  const barWidth = 4;
  const barSpacing = 1;
  const barFullWidth = barWidth + barSpacing;
  const totalWaveformWidth = totalBars * barFullWidth;
  
  const bars = useMemo(() => {
    return Array.from({ length: totalBars }, () => Math.floor(Math.random() * 20) + 8);
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate translateX to scroll waveform left as progress increases
  const centerPosition = containerWidth / 2;
  const translateX = centerPosition - (progress * totalWaveformWidth);

  return (
    <div 
      ref={containerRef}
      className="waveform-container relative h-12 sm:h-14 md:h-16 w-full overflow-hidden opacity-90"
    >
      {/* Fixed yellow cursor line in center */}
      <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-yellow-500 z-10" 
        style={{ transform: 'translateX(-50%)' }} 
      />
      
      {/* Scrolling waveform */}
      <div className="flex items-center justify-center h-full relative w-full">
        <div 
          ref={waveformRef}
          className="flex items-center h-full absolute"
          style={{ 
            transform: `translateX(${translateX}px)`,
            transition: 'transform 75ms ease-linear',
            width: `${totalWaveformWidth}px`
          }}
        >
          {bars.map((height, index) => {
            const isActive = index < progress * totalBars;
            return (
              <div
                key={`bar-${index}`}
                className={`waveform-bar transition-all duration-75 ${
                  isActive 
                    ? "bg-white dark:bg-gray-200" 
                    : "bg-gray-300 dark:bg-gray-600 opacity-50"
                }`}
                style={{ 
                  height: `${height}px`, 
                  width: `${barWidth}px`,
                  margin: `0 ${barSpacing / 2}px`
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
