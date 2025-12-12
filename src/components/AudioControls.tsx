import { Play, Pause } from 'lucide-react';

interface AudioControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  disabled?: boolean;
}

export default function AudioControls({ isPlaying, onPlayPause, disabled = false }: AudioControlsProps) {
  return (
    <button
      onClick={onPlayPause}
      disabled={disabled}
      className="disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-opacity hover:opacity-80"
    >
      {isPlaying ? (
        <Pause className="w-6 h-6 text-gray-800 dark:text-gray-200" fill="currentColor" />
      ) : (
        <Play className="w-6 h-6 text-gray-800 dark:text-gray-200 ml-1" fill="currentColor" />
      )}
    </button>
  );
}

