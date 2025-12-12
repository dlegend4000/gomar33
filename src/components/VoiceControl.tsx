import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceControlProps {
  isListening: boolean;
  isProcessing: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  disabled?: boolean;
}

export default function VoiceControl({
  isListening,
  isProcessing,
  onStartListening,
  onStopListening,
  disabled = false,
}: VoiceControlProps) {
  return (
    <button
      onClick={isListening ? onStopListening : onStartListening}
      disabled={disabled || isProcessing}
      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
        isListening
          ? 'bg-red-500 hover:bg-red-600 animate-pulse'
          : isProcessing
          ? 'bg-yellow-500 hover:bg-yellow-600'
          : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isListening ? 'Stop listening' : isProcessing ? 'Processing...' : 'Start voice control'}
    >
      {isProcessing ? (
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      ) : isListening ? (
        <MicOff className="w-6 h-6 text-white" />
      ) : (
        <Mic className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      )}
    </button>
  );
}

