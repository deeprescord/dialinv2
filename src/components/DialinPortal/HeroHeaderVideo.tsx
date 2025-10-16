import React, { useState, useRef, useEffect, Suspense, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { SkyboxViewer } from './SkyboxViewer';

interface HeroHeaderVideoProps {
  videoSrc?: string;
  posterSrc: string;
  title: string;
  subtitle: string;
  backgroundImage?: string;
  skyboxSrc?: string;
  showVideo?: boolean;
  show360?: boolean;
  xAxisOffset?: number;
  yAxisOffset?: number;
  volume?: number;
  isMuted?: boolean;
  rotationEnabled?: boolean;
  rotationSpeed?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  onOpenAddPanel?: () => void;
  onVideoStateChange?: (state: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    hasVideo: boolean;
  }) => void;
}

export type HeroHeaderVideoHandle = {
  playPause: () => void;
  seek: (value: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
};

export const HeroHeaderVideo = React.forwardRef<HeroHeaderVideoHandle, HeroHeaderVideoProps>(({ 
  videoSrc, 
  posterSrc, 
  title, 
  subtitle, 
  backgroundImage, 
  skyboxSrc,
  showVideo = true, 
  show360 = false,
  xAxisOffset,
  yAxisOffset,
  volume,
  isMuted,
  rotationEnabled,
  rotationSpeed,
  flipHorizontal,
  flipVertical,
  onOpenAddPanel,
  onVideoStateChange
}: HeroHeaderVideoProps, ref) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoVolume, setVideoVolume] = useState(1);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [skyboxSeekTo, setSkyboxSeekTo] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);

  // Determine which video element is active (foreground vs background)
  const getActiveVideo = (): HTMLVideoElement | null => {
    if (showVideo && videoRef.current) return videoRef.current;
    if (!showVideo && bgVideoRef.current) return bgVideoRef.current;
    // Fallback to whichever exists
    return videoRef.current || bgVideoRef.current;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset state when source/display changes
    setVideoLoaded(false);
    setVideoError(false);
    setCurrentTime(0);
    setDuration(0);

    const handleCanPlay = () => {
      setVideoLoaded(true);
    };

    const handleError = () => {
      setVideoError(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    // Set a timeout to fall back to poster if video doesn't load
    const fallbackTimeout = setTimeout(() => {
      if (!videoLoaded) {
        setVideoError(true);
      }
    }, 3000);

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      clearTimeout(fallbackTimeout);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoSrc, showVideo]);

  const handleMouseDown = () => {
    if (!onOpenAddPanel || show360) return;
    const timer = setTimeout(() => {
      onOpenAddPanel();
    }, 800);
    setPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleMouseLeave = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const togglePlayPause = () => {
    if (show360) {
      setIsPlaying((prev) => !prev);
      return;
    }
    const activeVideo = getActiveVideo();
    if (activeVideo) {
      if (isPlaying) {
        activeVideo.pause();
      } else {
        activeVideo.play();
      }
    }
  };

  const toggleMute = () => {
    if (show360) {
      setIsVideoMuted(!isVideoMuted);
      return;
    }
    const activeVideo = getActiveVideo();
    if (activeVideo) {
      activeVideo.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (show360) {
      const vol = value[0];
      setVideoVolume(vol);
      if (vol > 0) setIsVideoMuted(false);
      return;
    }
    const activeVideo = getActiveVideo();
    if (activeVideo) {
      activeVideo.volume = value[0];
      setVideoVolume(value[0]);
      if (value[0] > 0) {
        setIsVideoMuted(false);
        activeVideo.muted = false;
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (show360) {
      setSkyboxSeekTo(value[0]);
      setCurrentTime(value[0]);
      setTimeout(() => setSkyboxSeekTo(null), 100);
      return;
    }
    const activeVideo = getActiveVideo();
    if (activeVideo) {
      activeVideo.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  useImperativeHandle(ref, () => ({
    playPause: togglePlayPause,
    seek: (value: number) => handleSeek([value]),
    setVolume: (value: number) => handleVolumeChange([value]),
    toggleMute: toggleMute
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if backgroundImage is a video (handle URLs with query params)
  const getIsVideo = (url?: string) => {
    if (!url) return false;
    const clean = url.split('?')[0].split('#')[0];
    return /\.(mp4|webm|ogg|mov)$/i.test(clean);
  };
  const isBackgroundVideo = getIsVideo(backgroundImage);

  // Setup event listeners for background video
  useEffect(() => {
    const bgVideo = bgVideoRef.current;
    if (!bgVideo || !isBackgroundVideo) return;

    // Reset state when source changes
    setVideoLoaded(false);
    setVideoError(false);
    setCurrentTime(0);
    setDuration(0);

    const handleCanPlay = () => {
      setVideoLoaded(true);
    };

    const handleError = () => {
      setVideoError(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(bgVideo.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(bgVideo.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    bgVideo.addEventListener('canplay', handleCanPlay);
    bgVideo.addEventListener('error', handleError);
    bgVideo.addEventListener('timeupdate', handleTimeUpdate);
    bgVideo.addEventListener('loadedmetadata', handleLoadedMetadata);
    bgVideo.addEventListener('play', handlePlay);
    bgVideo.addEventListener('pause', handlePause);

    return () => {
      bgVideo.removeEventListener('canplay', handleCanPlay);
      bgVideo.removeEventListener('error', handleError);
      bgVideo.removeEventListener('timeupdate', handleTimeUpdate);
      bgVideo.removeEventListener('loadedmetadata', handleLoadedMetadata);
      bgVideo.removeEventListener('play', handlePlay);
      bgVideo.removeEventListener('pause', handlePause);
    };
  }, [isBackgroundVideo, backgroundImage]);

  const isSkyboxVideo = show360 && getIsVideo(skyboxSrc || backgroundImage);
  const hasVideoPlaying = (
    (showVideo && !!videoSrc && !videoError && videoLoaded) ||
    (isBackgroundVideo && !videoError && (!show360 ? videoLoaded : true)) ||
    (isSkyboxVideo && !videoError)
  );

  // Notify parent of video state changes
  useEffect(() => {
    if (onVideoStateChange) {
      onVideoStateChange({
        isPlaying,
        currentTime,
        duration,
        volume: videoVolume,
        isMuted: isVideoMuted,
        hasVideo: hasVideoPlaying
      });
    }
  }, [isPlaying, currentTime, duration, videoVolume, isVideoMuted, hasVideoPlaying, onVideoStateChange]);
  return (
    <div 
      className="relative h-[85vh] lg:h-[90vh] w-full overflow-hidden rounded-2xl mt-24 lg:mt-20 cursor-pointer select-none"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      {/* Video Background - only show for lobby */}
      {showVideo && videoSrc && !videoError && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transform: 'scaleY(1)' }}
          poster={posterSrc}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* 360° Skybox View - for special floors */}
      {show360 && (skyboxSrc || backgroundImage) && (
        <div className="absolute inset-0 w-full h-full z-10">
          <Suspense fallback={
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${backgroundImage || posterSrc})` }}
            />
          }>
            <SkyboxViewer 
              mediaUrl={(skyboxSrc || backgroundImage)!} 
              className="w-full h-full"
              xAxisOffset={xAxisOffset}
              yAxisOffset={yAxisOffset}
              volume={videoVolume}
              isMuted={isVideoMuted}
              isPlaying={isPlaying}
              seekTo={skyboxSeekTo ?? undefined}
              rotationEnabled={rotationEnabled}
              rotationSpeed={rotationSpeed}
              flipHorizontal={flipHorizontal}
              flipVertical={flipVertical}
              onStateChange={({ currentTime, duration, isPlaying, volume, isMuted }) => {
                setCurrentTime(currentTime);
                setDuration(duration);
                setIsPlaying(isPlaying);
                setVideoVolume(volume);
                setIsVideoMuted(isMuted);
              }}
            />
          </Suspense>
          {/* 360° Indicator */}
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-medium pointer-events-none z-30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              360° View - Click & Drag
            </div>
          </div>
        </div>
      )}

      {/* Background - Video or Image */}
      {!show360 && (
        <>
          {isBackgroundVideo ? (
            <video
              ref={bgVideoRef}
              autoPlay
              muted
              playsInline
              loop
              preload="auto"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                !showVideo || videoError || !videoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ transform: 'scaleY(1)' }}
            >
              <source src={backgroundImage} />
            </video>
          ) : (
            <div 
              className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-500 ${
                !showVideo || videoError || !videoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ backgroundImage: `url(${backgroundImage || posterSrc})` }}
            />
          )}
        </>
      )}

      {/* Gradient Overlay - don't interfere with 360° view */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent ${show360 ? 'pointer-events-none z-20' : ''}`} />


      {/* Content - Only show for non-lobby spaces */}
      {title && subtitle && (
        <div className={`absolute bottom-32 left-8 ${show360 ? 'z-30' : ''}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-2">
              {title}
            </h1>
            <p className="text-lg lg:text-xl text-white/80">
              {subtitle}
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
);
