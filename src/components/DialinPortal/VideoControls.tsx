import React from 'react';
import { Play, Pause, Volume2, VolumeX, Repeat, Repeat1, ListVideo, SkipForward, SkipBack, RotateCcw, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

type RepeatMode = "off" | "one" | "all";

interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode?: RepeatMode;
  isAutoplay?: boolean;
  onPlayPause: () => void;
  onSeek: (value: number) => void;
  onVolumeChange: (value: number) => void;
  onMuteToggle: () => void;
  onRepeatToggle?: () => void;
  onAutoplayToggle?: () => void;
  onSkipForward10?: () => void;
  onSkipBackward10?: () => void;
  onNextItem?: () => void;
  onPreviousItem?: () => void;
}

export function VideoControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  repeatMode = "off",
  isAutoplay = false,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onRepeatToggle,
  onAutoplayToggle,
  onSkipForward10,
  onSkipBackward10,
  onNextItem,
  onPreviousItem
}: VideoControlsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {onPreviousItem && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreviousItem}
          className="h-7 px-2 text-xs hover:bg-white/10"
          title="Previous item"
        >
          <SkipBack size={14} />
        </Button>
      )}

      {onSkipBackward10 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkipBackward10}
          className="h-7 px-1.5 text-xs hover:bg-white/10 relative"
          title="Skip back 10s"
        >
          <RotateCcw size={14} />
          <span className="absolute text-[8px] font-bold" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>10</span>
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onPlayPause}
        className="h-7 px-2 text-xs hover:bg-white/10"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </Button>

      {onSkipForward10 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkipForward10}
          className="h-7 px-1.5 text-xs hover:bg-white/10 relative"
          title="Skip forward 10s"
        >
          <RotateCw size={14} />
          <span className="absolute text-[8px] font-bold" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>10</span>
        </Button>
      )}

      {onNextItem && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onNextItem}
          className="h-7 px-2 text-xs hover:bg-white/10"
          title="Next item"
        >
          <SkipForward size={14} />
        </Button>
      )}

      {onRepeatToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRepeatToggle}
          className={`h-7 px-2 text-xs hover:bg-white/10 ${repeatMode !== "off" ? 'text-primary' : 'text-foreground/50'}`}
          title={
            repeatMode === "off" 
              ? "Repeat Off" 
              : repeatMode === "one" 
              ? "Repeat One" 
              : "Repeat All"
          }
        >
          {repeatMode === "one" ? <Repeat1 size={14} /> : <Repeat size={14} />}
        </Button>
      )}

      {onAutoplayToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAutoplayToggle}
          className={`h-7 px-2 text-xs hover:bg-white/10 ${isAutoplay ? 'text-primary' : 'text-foreground/50'}`}
          title={isAutoplay ? 'Autoplay On' : 'Autoplay Off'}
        >
          <ListVideo size={14} />
        </Button>
      )}

      <div className="flex items-center gap-1 px-2">
        <span className="text-xs text-foreground/80 font-medium min-w-[35px]">{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:h-2 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0"
        />
        <span className="text-xs text-foreground/80 font-medium min-w-[35px]">{formatTime(duration)}</span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onMuteToggle}
        className="h-7 px-2 text-xs hover:bg-white/10"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </Button>

      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        className="w-12 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:h-2 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0"
        title="Volume"
      />
    </>
  );
}
