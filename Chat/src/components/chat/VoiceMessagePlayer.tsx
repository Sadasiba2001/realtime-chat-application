import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Headphones, AlertCircle } from 'lucide-react';

interface VoiceMessagePlayerProps {
  url: string;
  name?: string;
  duration?: string;
  isOutgoing?: boolean;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  url,
  name = 'Voice Message',
  duration,
  isOutgoing = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setHasError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audioRef.current = null;
    };
  }, [url]);

  const togglePlayPause = () => {
    if (!audioRef.current || hasError) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Pause any other playing HTMLAudioElements on the page
      document.querySelectorAll('audio').forEach((el) => {
        if (el !== audioRef.current) el.pause();
      });
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setHasError(true));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (hasError) {
    return (
      <div className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs ${
        isOutgoing ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200'
      }`}>
        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
        <span>Voice message unavailable</span>
      </div>
    );
  }

  const effectiveDuration = audioDuration || (duration ? parseDurationString(duration) : 0);

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs min-w-[220px] transition-colors ${
        isOutgoing
          ? 'bg-white/10 border-white/20 text-white'
          : 'bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200'
      }`}
    >
      <button
        type="button"
        onClick={togglePlayPause}
        className={`p-2 rounded-full flex items-center justify-center transition-transform active:scale-95 flex-shrink-0 ${
          isOutgoing
            ? 'bg-white text-violet-600 hover:bg-slate-100'
            : 'bg-violet-600 text-white hover:bg-violet-700'
        }`}
        title={isPlaying ? 'Pause Voice Note' : 'Play Voice Note'}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold truncate text-[11px] opacity-90 flex items-center gap-1">
            <Headphones className="w-3 h-3 flex-shrink-0" /> {name}
          </span>
          <span className="text-[10px] opacity-75 font-mono">
            {formatTime(currentTime)} / {formatTime(effectiveDuration)}
          </span>
        </div>

        {/* Progress Bar / Seeker */}
        <input
          type="range"
          min={0}
          max={effectiveDuration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
        />
      </div>
    </div>
  );
};

function parseDurationString(durStr: string): number {
  if (!durStr) return 0;
  const parts = durStr.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return Number(durStr) || 0;
}
