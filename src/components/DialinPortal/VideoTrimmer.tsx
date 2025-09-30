import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Scissors } from 'lucide-react';

interface VideoTrimmerProps {
  videoFile: File;
  onTrimmed: (trimmedFile: File) => void;
  onCancel: () => void;
}

export const VideoTrimmer: React.FC<VideoTrimmerProps> = ({
  videoFile,
  onTrimmed,
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(60); // Max 1 minute
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = Math.min(videoRef.current.duration, 60); // Cap at 1 minute
      setDuration(videoDuration);
      setEndTime(videoDuration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Auto-pause when reaching end time
      if (videoRef.current.currentTime >= endTime) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.currentTime = startTime;
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTrim = async () => {
    try {
      // Create a trimmed video file (simplified approach - in production you'd use FFmpeg or similar)
      // For now, we'll just pass the original file with metadata about trim times
      const trimmedFile = new File([videoFile], videoFile.name, {
        type: videoFile.type,
        lastModified: Date.now(),
      });
      
      // Add trim metadata as a property (this would be handled differently in production)
      (trimmedFile as any).trimStart = startTime;
      (trimmedFile as any).trimEnd = endTime;
      
      onTrimmed(trimmedFile);
    } catch (error) {
      console.error('Error trimming video:', error);
    }
  };

  const handleRangeChange = (values: number[]) => {
    setStartTime(values[0]);
    setEndTime(values[1]);
    
    // Update video position to start time
    if (videoRef.current) {
      videoRef.current.currentTime = values[0];
    }
  };

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold">Trim Video (Max 1 minute)</h3>
      
      <div className="relative">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full max-h-64 rounded-lg"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
        />
        
        <Button
          onClick={togglePlayPause}
          className="absolute bottom-2 left-2"
          size="sm"
          variant="secondary"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Trim Range: {startTime.toFixed(1)}s - {endTime.toFixed(1)}s
        </label>
        <Slider
          value={[startTime, endTime]}
          onValueChange={handleRangeChange}
          max={duration}
          min={0}
          step={0.1}
          className="w-full"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleTrim} className="flex items-center gap-2">
          <Scissors className="w-4 h-4" />
          Trim & Use
        </Button>
      </div>
    </div>
  );
};