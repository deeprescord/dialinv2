import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, X, Maximize, Settings, Edit, Share2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { SkyboxViewer } from './SkyboxViewer';

interface ContentViewerProps {
  content: {
    id: string;
    storage_path: string;
    file_type: string;
    mime_type?: string;
    original_name: string;
    thumbnail_path?: string;
    duration?: number;
    metadata?: {
      is_360?: boolean;
      x_axis_offset?: number;
      y_axis_offset?: number;
    };
  };
  onClose?: () => void;
  onEditMetadata?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}

export function ContentViewer({ content, onClose, onEditMetadata, onShare, onDelete }: ContentViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isVideo = content.file_type === 'video' || content.mime_type?.startsWith('video/');
  const isAudio = content.file_type === 'audio' || content.mime_type?.startsWith('audio/');
  const isImage = content.file_type === 'image' || content.mime_type?.startsWith('image/');
  const isPDF = content.mime_type === 'application/pdf';
  const is360 = content.metadata?.is_360 || content.original_name.toLowerCase().includes('360');

  // Get the public URL for the content
  const getPublicUrl = async (path: string): Promise<string> => {
    if (path.startsWith('http')) return path;
    
    // For user-files bucket (private), we need to get a signed URL
    const { data, error } = await supabase.storage
      .from('user-files')
      .createSignedUrl(path, 3600); // 1 hour expiry
    
    if (error || !data) {
      console.error('Error getting signed URL:', error);
      // Fallback to public URL attempt
      return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/user-files/${path}`;
    }
    
    return data.signedUrl;
  };

  const [contentUrl, setContentUrl] = useState<string>('');

  useEffect(() => {
    getPublicUrl(content.storage_path).then(setContentUrl);
  }, [content.storage_path]);

  useEffect(() => {
    const mediaRef = isVideo ? videoRef.current : audioRef.current;
    if (!mediaRef) return;

    const handleTimeUpdate = () => {
      setCurrentTime(mediaRef.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(mediaRef.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    mediaRef.addEventListener('timeupdate', handleTimeUpdate);
    mediaRef.addEventListener('loadedmetadata', handleLoadedMetadata);
    mediaRef.addEventListener('ended', handleEnded);

    return () => {
      mediaRef.removeEventListener('timeupdate', handleTimeUpdate);
      mediaRef.removeEventListener('loadedmetadata', handleLoadedMetadata);
      mediaRef.removeEventListener('ended', handleEnded);
    };
  }, [isVideo, isAudio]);

  const togglePlay = () => {
    const mediaRef = isVideo ? videoRef.current : audioRef.current;
    if (!mediaRef) return;

    if (isPlaying) {
      mediaRef.pause();
    } else {
      mediaRef.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const mediaRef = isVideo ? videoRef.current : audioRef.current;
    if (!mediaRef) return;

    mediaRef.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    const mediaRef = isVideo ? videoRef.current : audioRef.current;
    if (mediaRef) {
      mediaRef.volume = newVolume;
    }
  };

  const handleSeek = (values: number[]) => {
    const newTime = values[0];
    setCurrentTime(newTime);
    const mediaRef = isVideo ? videoRef.current : audioRef.current;
    if (mediaRef) {
      mediaRef.currentTime = newTime;
    }
  };

  const handleFullscreen = () => {
    const elem = videoRef.current;
    if (elem) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        (elem as any).mozRequestFullScreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Press and hold handlers
  const handlePressStart = () => {
    const timer = setTimeout(() => {
      setShowContextMenu(true);
    }, 500); // 500ms hold to show menu
    setPressTimer(timer);
  };

  const handlePressEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showContextMenu && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContextMenu]);

  // Show loading state while fetching signed URL
  if (!contentUrl) {
    return (
      <div className="relative h-[85vh] lg:h-[90vh] w-full overflow-hidden rounded-2xl mt-24 lg:mt-20 bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative h-[85vh] lg:h-[90vh] w-full overflow-hidden rounded-2xl mt-24 lg:mt-20"
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      {/* Close Button */}
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 bg-black/60 backdrop-blur-sm hover:bg-black/80"
          onClick={onClose}
        >
          <X className="w-5 h-5 text-white" />
        </Button>
      )}

      {/* Context Menu */}
      <AnimatePresence>
        {showContextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-20 right-4 z-50 bg-background/95 backdrop-blur-lg rounded-xl shadow-2xl border border-border overflow-hidden"
          >
            <div className="p-2 space-y-1 min-w-[200px]">
              {onEditMetadata && (
                <button
                  onClick={() => {
                    setShowContextMenu(false);
                    onEditMetadata();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm font-medium">Edit Metadata</span>
                </button>
              )}
              {onShare && (
                <button
                  onClick={() => {
                    setShowContextMenu(false);
                    onShare();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Share</span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    setShowContextMenu(false);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Delete</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 360° Video/Image Content */}
      {is360 && (isVideo || isImage) && contentUrl && (
        <div className="absolute inset-0">
          <SkyboxViewer
            mediaUrl={contentUrl}
            enableGyroscope={true}
            xAxisOffset={content.metadata?.x_axis_offset || 0}
            yAxisOffset={content.metadata?.y_axis_offset || 0}
            volume={volume * 100}
            isMuted={isMuted}
          />
        </div>
      )}

      {/* Regular Video Content */}
      {!is360 && isVideo && contentUrl && (
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            src={contentUrl}
            className="w-full h-full object-contain bg-black"
            poster={content.thumbnail_path ? contentUrl.replace(content.storage_path, content.thumbnail_path) : undefined}
            playsInline
            onClick={togglePlay}
          />
        </div>
      )}

      {/* Audio Content */}
      {isAudio && contentUrl && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center">
          <audio ref={audioRef} src={contentUrl} />
          <div className="text-center space-y-4">
            <motion.div
              animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 1, repeat: isPlaying ? Infinity : 0 }}
              className="w-48 h-48 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
            >
              <Volume2 className="w-24 h-24 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground">{content.original_name}</h2>
          </div>
        </div>
      )}

      {/* Regular Image Content */}
      {!is360 && isImage && contentUrl && (
        <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
          <img
            src={contentUrl}
            alt={content.original_name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {/* PDF Content */}
      {isPDF && contentUrl && (
        <div className="absolute inset-0 w-full h-full bg-background">
          <iframe
            src={contentUrl}
            className="w-full h-full"
            title={content.original_name}
          />
        </div>
      )}

      {/* Other Content Types - Fallback */}
      {!isVideo && !isAudio && !isImage && !isPDF && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-muted via-background to-muted flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <h2 className="text-2xl font-bold text-foreground">{content.original_name}</h2>
            <p className="text-muted-foreground">Preview not available for this file type</p>
            {contentUrl && (
              <Button asChild>
                <a href={contentUrl} download={content.original_name}>
                  Download File
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Media Controls */}
      {!is360 && (isVideo || isAudio) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 space-y-4"
        >
          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-xs text-white/80 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-12 w-12"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
              
              {isVideo && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={handleFullscreen}
                >
                  <Maximize className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Content Info */}
      <div className="absolute bottom-32 left-8 z-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-2 drop-shadow-lg">
            {content.original_name}
          </h1>
          <p className="text-lg lg:text-xl text-white/80 capitalize drop-shadow-md">
            {content.file_type}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
