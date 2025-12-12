import { useState, useRef, useEffect, useCallback } from 'react';

interface UseAudioPlayerReturn {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  audioFile: File | null;
  playbackRate: number;
  pitch: number;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  loadAudio: (file: File) => void;
  waveformData: number[];
  setPlaybackRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [playbackRate, setPlaybackRateState] = useState(1.0);
  const [pitch, setPitchState] = useState(1.0);

  // Update current time as audio plays
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioFile]);

  // Generate waveform data from audio file
  const generateWaveform = useCallback(async (file: File) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const rawData = audioBuffer.getChannelData(0);
      const samples = 60; // Number of bars in waveform
      const blockSize = Math.floor(rawData.length / samples);
      const filteredData = [];

      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[i * blockSize + j]);
        }
        filteredData.push(sum / blockSize);
      }

      // Normalize to 0-1 range
      const max = Math.max(...filteredData);
      const normalized = filteredData.map(n => (n / max) * 0.8 + 0.2);
      setWaveformData(normalized);
      
      // Clean up audio context
      audioContext.close();
    } catch (error) {
      console.error('Error generating waveform:', error);
      // Fallback to random data if analysis fails
      setWaveformData(Array.from({ length: 60 }, () => Math.random() * 0.5 + 0.3));
    }
  }, []);

  const loadAudio = useCallback((file: File) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Clean up previous URL if exists
    if (audio.src && audio.src.startsWith('blob:')) {
      URL.revokeObjectURL(audio.src);
    }

    const url = URL.createObjectURL(file);
    audio.src = url;
    setAudioFile(file);
    setIsPlaying(false);
    setCurrentTime(0);
    generateWaveform(file);
  }, [generateWaveform]);

  const play = useCallback(() => {
    audioRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clampedRate = Math.max(0.5, Math.min(2.0, rate));
    audio.playbackRate = clampedRate;
    setPlaybackRateState(clampedRate);
  }, []);

  const setPitch = useCallback((pitchValue: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    // Note: HTML5 audio doesn't support pitch directly
    // For true pitch shifting, we'd need Web Audio API
    // For now, we'll use playbackRate as an approximation
    // This changes both pitch and tempo together
    const clampedPitch = Math.max(0.5, Math.min(2.0, pitchValue));
    audio.playbackRate = clampedPitch;
    setPitchState(clampedPitch);
  }, []);

  // Update playback rate when it changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const progress = duration > 0 ? currentTime / duration : 0;

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    progress,
    audioFile,
    playbackRate,
    pitch,
    play,
    pause,
    togglePlayPause,
    seek,
    loadAudio,
    waveformData,
    setPlaybackRate,
    setPitch,
  };
}

