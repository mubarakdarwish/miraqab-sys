
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  url: string;
  duration?: number;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    if (audioRef.current) {
      const newTime = (newProgress / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(newProgress);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 bg-black/5 p-2 rounded-xl mt-1 mb-1 min-w-[220px] group">
      <audio ref={audioRef} src={url} />
      
      <button 
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-600 shadow-sm hover:scale-105 transition-transform"
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-0.5" fill="currentColor" />}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={progress || 0} 
          onChange={handleProgressChange}
          className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-500 hover:h-1.5 transition-all"
        />
        <div className="flex justify-between items-center px-0.5">
          <span className="text-[9px] font-black text-slate-500 tabular-nums">
            {formatTime(currentTime)}
          </span>
          <span className="text-[9px] font-black text-slate-400 tabular-nums">
            {duration ? formatTime(duration) : formatTime(audioRef.current?.duration || 0)}
          </span>
        </div>
      </div>

      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
        <Volume2 size={12} />
      </div>
    </div>
  );
};

export default AudioPlayer;
