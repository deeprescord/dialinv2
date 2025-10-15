import React, { useState, useRef, useEffect, Suspense } from 'react';
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
}

export function HeroHeaderVideo({ 
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
  onOpenAddPanel
}: HeroHeaderVideoProps) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoVolume, setVideoVolume] = useState(1);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
  }, [videoLoaded]);

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
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0];
      setVideoVolume(value[0]);
      if (value[0] > 0) {
        setIsVideoMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

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
              volume={volume}
              isMuted={isMuted}
              rotationEnabled={rotationEnabled}
              rotationSpeed={rotationSpeed}
              flipHorizontal={flipHorizontal}
              flipVertical={flipVertical}
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

      {/* Media Controls - show when video is playing */}
      {showVideo && videoSrc && !videoError && videoLoaded && !show360 && (
        <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-end gap-2 px-3 pt-2 pb-1 bg-black/40 backdrop-blur-sm rounded-lg">
          <button
            onClick={togglePlayPause}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            )}
          </button>

          <div className="flex-1 flex items-center gap-3">
            <span className="text-sm text-white font-medium">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => handleSeek([parseFloat(e.target.value)])}
              className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
            />
            <span className="text-sm text-white font-medium">{formatTime(duration)}</span>
          </div>

          <button
            onClick={toggleMute}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isVideoMuted ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
              </svg>
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={videoVolume}
            onChange={(e) => handleVolumeChange([parseFloat(e.target.value)])}
            className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
          />
        </div>
      )}

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