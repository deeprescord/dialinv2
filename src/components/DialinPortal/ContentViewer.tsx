import React, { useState, useRef, useEffect, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, X, Maximize, Settings, Edit, Share2, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { SkyboxViewer } from './SkyboxViewer';
import audioVisualizer from '@/assets/audio-visualizer.gif';

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
  onMediaEnded?: () => void;
  onVideoStateChange?: (state: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    hasVideo: boolean;
    isLooping: boolean;
  }) => void;
}

export type ContentViewerHandle = {
  playPause: () => void;
  seek: (value: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  toggleLoop: () => void;
};

export const ContentViewer = React.forwardRef<ContentViewerHandle, ContentViewerProps>(({ content, onClose, onEditMetadata, onShare, onDelete, onMediaEnded, onVideoStateChange }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLooping, setIsLooping] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [zoom, setZoom] = useState(1);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const isVideo = content.file_type === 'video' || content.mime_type?.startsWith('video/');
  const isAudio = content.file_type === 'audio' || content.mime_type?.startsWith('audio/');
  const isImage = content.file_type === 'image' || content.mime_type?.startsWith('image/');
  const isPDF = content.mime_type === 'application/pdf';
  const is360 = content.metadata?.is_360 || content.original_name.toLowerCase().includes('360');
  const isScrollableVideo = isVideo && videoDimensions ? videoDimensions.height > window.innerHeight * 1.1 : false;

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
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');

  useEffect(() => {
    getPublicUrl(content.storage_path).then(url => {
      console.log('Content URL loaded:', url);
      setContentUrl(url);
    });
    if (content.thumbnail_path) {
      getPublicUrl(content.thumbnail_path).then(url => {
        console.log('Thumbnail URL loaded:', url);
        setThumbnailUrl(url);
      });
    } else {
      console.log('No thumbnail_path provided:', content);
    }
  }, [content.storage_path, content.thumbnail_path]);

  useEffect(() => {
    const mediaRef = isVideo ? videoRef.current : audioRef.current;
    if (!mediaRef) return;

    const handleTimeUpdate = () => {
      setCurrentTime(mediaRef.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(mediaRef.duration);
      // Try to autoplay with sound
      if (mediaRef instanceof HTMLVideoElement || mediaRef instanceof HTMLAudioElement) {
        mediaRef.volume = 0.7;
        mediaRef.muted = false;
        setIsMuted(false);
        setVolume(0.7);
        mediaRef.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          // If autoplay with sound fails, try muted
          mediaRef.muted = true;
          setIsMuted(true);
          mediaRef.play().then(() => {
            setIsPlaying(true);
          }).catch(e => console.log('Autoplay prevented:', e));
        });
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onMediaEnded?.();
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    mediaRef.addEventListener('timeupdate', handleTimeUpdate);
    mediaRef.addEventListener('loadedmetadata', handleLoadedMetadata);
    mediaRef.addEventListener('ended', handleEnded);
    mediaRef.addEventListener('play', handlePlay);
    mediaRef.addEventListener('pause', handlePause);

    return () => {
      mediaRef.removeEventListener('timeupdate', handleTimeUpdate);
      mediaRef.removeEventListener('loadedmetadata', handleLoadedMetadata);
      mediaRef.removeEventListener('ended', handleEnded);
      mediaRef.removeEventListener('play', handlePlay);
      mediaRef.removeEventListener('pause', handlePause);
    };
  }, [isVideo, isAudio, contentUrl]);

  // Propagate state to parent controls
  useEffect(() => {
    onVideoStateChange?.({
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      hasVideo: isVideo || isAudio,
      isLooping,
    });
  }, [isPlaying, currentTime, duration, volume, isMuted, isVideo, isAudio, isLooping, onVideoStateChange]);

  const togglePlay = () => {
    const mediaRef = isVideo ? videoRef.current : audioRef.current;
    if (!mediaRef) return;

    if (isPlaying) {
      mediaRef.pause();
      setIsPlaying(false);
    } else {
      mediaRef.play().then(() => {
        setIsPlaying(true);
      }).catch(e => console.log('Play prevented:', e));
    }
  };

  const toggleMute = () => {
    const mediaRef = isVideo ? videoRef.current : audioRef.current;
    if (!mediaRef) return;

    mediaRef.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleLoop = () => {
    const mediaRef = isVideo ? videoRef.current : audioRef.current;
    if (!mediaRef) return;

    const newLooping = !isLooping;
    mediaRef.loop = newLooping;
    setIsLooping(newLooping);
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    const mediaRef = isVideo ? videoRef.current : audioRef.current;
    if (mediaRef) {
      mediaRef.volume = newVolume;
      if (newVolume > 0 && isMuted) {
        mediaRef.muted = false;
        setIsMuted(false);
      }
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

  // Expose controls via ref for space bar control
  useImperativeHandle(ref, () => ({
    playPause: togglePlay,
    seek: (value: number) => handleSeek([value]),
    setVolume: (value: number) => handleVolumeChange([value]),
    toggleMute: toggleMute,
    toggleLoop: toggleLoop
  }));

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

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  // Mouse wheel zoom for images
  useEffect(() => {
    if (!isImage || !imageContainerRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.5, Math.min(5, prev + delta)));
      }
    };

    const container = imageContainerRef.current;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [isImage]);

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
      className={`relative w-full ${isVideo && isScrollableVideo ? 'h-screen overflow-y-auto rounded-none' : 'h-[85vh] lg:h-[90vh] overflow-hidden rounded-2xl'} mt-24 lg:mt-20`}
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
        <div className={isScrollableVideo ? 'w-full h-screen overflow-y-auto' : 'absolute inset-0'}>
          <video
            ref={videoRef}
            src={contentUrl}
            className={`${isScrollableVideo ? 'w-full h-auto object-contain block bg-black' : 'w-full h-full object-contain bg-black'}`}
            poster={content.thumbnail_path ? contentUrl.replace(content.storage_path, content.thumbnail_path) : undefined}
            playsInline
            loop
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.videoWidth && v.videoHeight) {
                setVideoDimensions({ width: v.videoWidth, height: v.videoHeight });
              }
            }}
            onClick={togglePlay}
          />
        </div>
      )}

      {/* Audio Content */}
      {isAudio && contentUrl && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
          <audio ref={audioRef} src={contentUrl} loop />
          {/* Show thumbnail if available, or fallback to audio visualizer GIF */}
          {thumbnailUrl ? (
            <div className="w-full h-full relative">
              <img
                src={thumbnailUrl}
                alt={content.original_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Thumbnail failed to load:', thumbnailUrl);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <img
                src={audioVisualizer}
                alt="Audio visualizer"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      )}

      {/* Regular Image Content */}
      {!is360 && isImage && contentUrl && (
        <>
          <div 
            ref={imageContainerRef}
            className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-auto"
          >
            <img
              src={contentUrl}
              alt={content.original_name}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
          
          {/* Zoom Controls */}
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-black/60 backdrop-blur-sm rounded-lg p-4 min-w-[280px]">
            <ZoomOut className="w-4 h-4 text-white flex-shrink-0" />
            <Slider
              value={[zoom]}
              onValueChange={(values) => setZoom(values[0])}
              min={0.5}
              max={5}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-white flex-shrink-0" />
            <button
              onClick={handleResetZoom}
              className="px-3 py-1 text-white text-sm hover:bg-white/20 rounded transition-colors flex-shrink-0"
            >
              {Math.round(zoom * 100)}%
            </button>
          </div>
        </>
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
    </div>
  );
});
