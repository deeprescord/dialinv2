import React, { useState, useRef, useEffect, Suspense, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { SkyboxViewer } from './SkyboxViewer';
import { supabase } from '@/integrations/supabase/client';

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
  webUrl?: string; // New prop for displaying web pages
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
  webUrl,
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
  const [lastUnmutedVolume, setLastUnmutedVolume] = useState(1); // Track last volume before mute
  const [skyboxSeekTo, setSkyboxSeekTo] = useState<number | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [proxyAttempted, setProxyAttempted] = useState(false);
  const [proxiedHtml, setProxiedHtml] = useState<string | null>(null);
  const [proxyError, setProxyError] = useState<string | null>(null);
  const [isBlurred, setIsBlurred] = useState(false);
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

    // Pause video when switching spaces
    video.pause();
    
    // Reset state when source/display changes
    setVideoLoaded(false);
    setVideoError(false);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    const handleCanPlay = () => {
      setVideoLoaded(true);
      // Autoplay video when loaded
      video.play().catch(err => console.log('Autoplay prevented:', err));
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
      if (!isVideoMuted) {
        // Muting: save current volume
        setLastUnmutedVolume(videoVolume > 0 ? videoVolume : 1);
        setIsVideoMuted(true);
      } else {
        // Unmuting: restore last volume
        setVideoVolume(lastUnmutedVolume);
        setIsVideoMuted(false);
      }
      return;
    }
    const activeVideo = getActiveVideo();
    if (activeVideo) {
      if (!isVideoMuted) {
        // Muting: save current volume
        setLastUnmutedVolume(activeVideo.volume > 0 ? activeVideo.volume : 1);
        activeVideo.muted = true;
        setIsVideoMuted(true);
      } else {
        // Unmuting: restore last volume
        activeVideo.muted = false;
        activeVideo.volume = lastUnmutedVolume;
        setVideoVolume(lastUnmutedVolume);
        setIsVideoMuted(false);
      }
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (show360) {
      const vol = value[0];
      setVideoVolume(vol);
      if (vol > 0) {
        setLastUnmutedVolume(vol); // Save as last unmuted volume
        setIsVideoMuted(false);
      }
      return;
    }
    const activeVideo = getActiveVideo();
    if (activeVideo) {
      activeVideo.volume = value[0];
      setVideoVolume(value[0]);
      if (value[0] > 0) {
        setLastUnmutedVolume(value[0]); // Save as last unmuted volume
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

    // Pause video when switching spaces
    bgVideo.pause();
    
    // Reset state when source changes
    setVideoLoaded(false);
    setVideoError(false);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    const handleCanPlay = () => {
      setVideoLoaded(true);
      // Autoplay background video when loaded
      bgVideo.play().catch(err => console.log('Autoplay prevented:', err));
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

  // Auto-fallback to proxy embed if direct iframe doesn't load
  useEffect(() => {
    setIframeLoaded(false);
    setProxyAttempted(false);
    setProxiedHtml(null);
    setProxyError(null);
    if (!webUrl) return;
    
    console.log('Loading web URL:', webUrl);
    
    const t = setTimeout(async () => {
      if (proxyAttempted || iframeLoaded) return;
      console.log('Direct iframe timed out, trying proxy...');
      try {
        setProxyAttempted(true);
        const response = await fetch(
          `https://dkhpfwgejjyheixkpvpr.supabase.co/functions/v1/embed-proxy`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
            },
            body: JSON.stringify({ url: webUrl })
          }
        );
        
        if (!response.ok) {
          throw new Error(`Proxy failed: ${response.status} ${response.statusText}`);
        }
        
        const html = await response.text();
        console.log('Proxy response received, html length:', html?.length);
        if (html) setProxiedHtml(html);
      } catch (e) {
        console.error('Proxy error:', e);
        setProxyError(e instanceof Error ? e.message : 'Proxy failed');
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [webUrl]);

  // Screenshot protection - detect when user might be capturing content
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
        // Pause any playing video
        const activeVideo = getActiveVideo();
        if (activeVideo && isPlaying) {
          activeVideo.pause();
        }
        setTimeout(() => setIsBlurred(false), 300);
      }
    };

    const handleBlur = () => {
      setIsBlurred(true);
      setTimeout(() => setIsBlurred(false), 200);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect common screenshot shortcuts
      const isScreenshotShortcut = 
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) || // Mac
        (e.key === 'PrintScreen') || // Windows
        (e.metaKey && e.key === 'PrintScreen'); // Windows with Cmd
      
      if (isScreenshotShortcut) {
        setIsBlurred(true);
        setTimeout(() => setIsBlurred(false), 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying]);

  return (
    <div 
      className="relative h-[85vh] lg:h-[90vh] w-full overflow-hidden rounded-2xl cursor-pointer select-none"
      style={{ 
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      } as React.CSSProperties}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      {/* Screenshot Protection Overlay */}
      {isBlurred && (
        <div className="absolute inset-0 bg-black z-50 flex items-center justify-center">
          <div className="text-white text-xl font-semibold">🔒 Content Protected</div>
        </div>
      )}

      {/* Web Page Iframe - highest priority */}
      {webUrl && (
        <div className="absolute inset-0 w-full h-full z-20 bg-black">
          {/* Loading indicator */}
          {!iframeLoaded && !proxiedHtml && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent mb-4"></div>
                <p className="text-white text-sm">Loading webpage...</p>
              </div>
            </div>
          )}
          
          {proxiedHtml ? (
            <iframe
              srcDoc={proxiedHtml}
              className="w-full h-full border-0"
              title="Web Content (proxied)"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
              scrolling="yes"
              style={{ overflow: 'auto' }}
            />
          ) : (
            <iframe
              src={webUrl}
              className="w-full h-full border-0"
              title="Web Content"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
              scrolling="yes"
              style={{ overflow: 'auto' }}
              onLoad={() => {
                console.log('Iframe loaded successfully');
                setIframeLoaded(true);
              }}
              onError={(e) => {
                console.error('Iframe error:', e);
              }}
            />
          )}
          
          {/* Web indicator + actions */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-medium pointer-events-none">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${proxiedHtml ? 'bg-emerald-400' : 'bg-blue-500'} rounded-full animate-pulse`} />
                {proxiedHtml ? 'Web (proxied)' : 'Web'}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); window.open(webUrl, '_blank', 'noopener'); }}
              className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs hover:opacity-90"
            >
              Open
            </button>
          </div>
          
          {proxyError && (
            <div className="absolute bottom-4 right-4 bg-red-500/80 text-white text-xs px-2 py-1 rounded-md">
              {proxyError}
            </div>
          )}
        </div>
      )}

      {/* Video Background - only show for lobby */}
      {!webUrl && showVideo && videoSrc && !videoError && (
        <video
          ref={videoRef}
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
      {!webUrl && show360 && (skyboxSrc || backgroundImage) && (
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
      {!webUrl && !show360 && (
        <>
          {isBackgroundVideo ? (
            <video
              ref={bgVideoRef}
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

      {/* Gradient Overlay - don't show for web view or 360° view */}
      {!webUrl && <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent ${show360 ? 'pointer-events-none z-20' : ''}`} />}


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
