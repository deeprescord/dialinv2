import React, { useState, useRef, useEffect, Suspense, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { SkyboxViewer } from './SkyboxViewer';
import { supabase } from '@/integrations/supabase/client';
import { useAudioContext } from '@/contexts/AudioContext';

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
  const [videoVolume, setVideoVolume] = useState(0.7);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [lastUnmutedVolume, setLastUnmutedVolume] = useState(0.7); // Track last volume before mute
  const [skyboxSeekTo, setSkyboxSeekTo] = useState<number | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [proxyAttempted, setProxyAttempted] = useState(false);
  const [proxiedHtml, setProxiedHtml] = useState<string | null>(null);
  const [proxyError, setProxyError] = useState<string | null>(null);
  const [isBlurred, setIsBlurred] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const audioContext = useAudioContext();
  // Use stable ID based on route/space instead of random
  const audioIdRef = useRef<string>('hero-home');

  // Register this component's pause function with the audio context
  useEffect(() => {
    const pauseAudio = () => {
      const fg = videoRef.current;
      const bg = bgVideoRef.current;
      if (fg) { fg.pause(); fg.muted = true; }
      if (bg) { bg.pause(); bg.muted = true; }
      setIsPlaying(false);
    };
    
    audioContext.registerAudioSource(audioIdRef.current, pauseAudio);
    
    return () => {
      audioContext.unregisterAudioSource(audioIdRef.current);
    };
  }, [audioContext]);

  // Push progress updates to AudioContext via timeupdate (more consistent than interval)
  useEffect(() => {
    const activeVideo = getActiveVideo();
    if (!activeVideo) return;

    const handleTimeUpdate = () => {
      if (!activeVideo.paused) {
        audioContext.pushProgress(audioIdRef.current, {
          currentTime: activeVideo.currentTime || 0,
          duration: activeVideo.duration || 0,
          volume: isVideoMuted ? 0 : (videoVolume > 1 ? videoVolume / 100 : videoVolume),
          isMuted: isVideoMuted,
          isPlaying: !activeVideo.paused
        });
      }
    };

    activeVideo.addEventListener('timeupdate', handleTimeUpdate);
    return () => activeVideo.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isPlaying, isVideoMuted, videoVolume, audioContext, showVideo]);

  // Sync incoming props to internal state (volume/mute)
  useEffect(() => {
    if (typeof volume === 'number') {
      const norm = volume > 1 ? volume / 100 : volume;
      setVideoVolume(norm);
      setLastUnmutedVolume(norm || 0.7);
      // Apply to active HTML5 video if not in 360 mode
      if (!show360) {
        const v = getActiveVideo();
        if (v) {
          v.volume = norm;
          v.muted = !!isVideoMuted;
        }
      }
    }
  }, [volume, show360, isVideoMuted]);

  useEffect(() => {
    if (typeof isMuted === 'boolean') {
      setIsVideoMuted(isMuted);
      // Apply to active HTML5 video if not in 360 mode
      if (!show360) {
        const v = getActiveVideo();
        if (v) {
          v.muted = isMuted;
          if (!isMuted) {
            const norm = videoVolume > 1 ? videoVolume / 100 : videoVolume;
            v.volume = norm;
          }
        }
      }
    }
  }, [isMuted, show360, videoVolume]);

  // Determine which video element is active (foreground vs background)
  const getActiveVideo = (): HTMLVideoElement | null => {
    if (showVideo && videoRef.current) return videoRef.current;
    if (!showVideo && bgVideoRef.current) return bgVideoRef.current;
    // Fallback to whichever exists
    return videoRef.current || bgVideoRef.current;
  };

  // Immediately mute/pause the inactive element to prevent dual audio
  useEffect(() => {
    const fg = videoRef.current;
    const bg = bgVideoRef.current;
    const norm = videoVolume > 1 ? videoVolume / 100 : videoVolume;
    if (showVideo) {
      if (bg) { try { bg.pause(); bg.muted = true; } catch {} }
      if (fg) {
        fg.muted = !!isVideoMuted;
        fg.volume = isVideoMuted ? 0 : norm;
      }
    } else {
      if (fg) { try { fg.pause(); fg.muted = true; } catch {} }
      if (bg) {
        bg.muted = !!isVideoMuted;
        bg.volume = isVideoMuted ? 0 : norm;
      }
    }
  }, [showVideo, isVideoMuted, videoVolume]);

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
      // Do not autoplay; wait for explicit user control
      const norm = videoVolume > 1 ? videoVolume / 100 : videoVolume;
      video.volume = isVideoMuted ? 0 : norm;
      video.muted = !!isVideoMuted;
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
      video.pause();
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
    // 360 content uses internal video texture
    if (show360) {
      const newPlayingState = !isPlaying;
      setIsPlaying(newPlayingState);
      if (newPlayingState && !isVideoMuted && videoVolume > 0) {
        audioContext.playAudio(audioIdRef.current);
      }
      return;
    }

    const fg = videoRef.current;
    const bg = bgVideoRef.current;
    const norm = videoVolume > 1 ? videoVolume / 100 : videoVolume;

    if (isPlaying) {
      try { fg?.pause(); } catch {}
      try { bg?.pause(); } catch {}
      setIsPlaying(false);
      return;
    }

    // Play path: ensure exclusivity, unmute and play only the active element
    audioContext.playAudio(audioIdRef.current);

    if (showVideo) {
      try { bg?.pause(); } catch {}
      if (fg) {
        fg.muted = !!isVideoMuted;
        fg.volume = isVideoMuted ? 0 : norm;
        fg.play().catch(() => {});
      }
    } else {
      try { fg?.pause(); } catch {}
      if (bg) {
        bg.muted = !!isVideoMuted;
        bg.volume = isVideoMuted ? 0 : norm;
        bg.play().catch(() => {});
      }
    }

    setIsPlaying(true);
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
      // Do not autoplay; wait for explicit user control
      const norm = videoVolume > 1 ? videoVolume / 100 : videoVolume;
      bgVideo.volume = isVideoMuted ? 0 : norm;
      bgVideo.muted = !!isVideoMuted;
    };

    const handleError = () => {
      setVideoError(true);
    };

    const handleTimeUpdate = () => {
      if (!showVideo) {
        setCurrentTime(bgVideo.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (!showVideo) {
        setDuration(bgVideo.duration);
      }
    };

    const handlePlay = () => {
      if (!showVideo) {
        setIsPlaying(true);
      }
    };

    const handlePause = () => {
      if (!showVideo) {
        setIsPlaying(false);
      }
    };

    bgVideo.addEventListener('canplay', handleCanPlay);
    bgVideo.addEventListener('error', handleError);
    bgVideo.addEventListener('timeupdate', handleTimeUpdate);
    bgVideo.addEventListener('loadedmetadata', handleLoadedMetadata);
    bgVideo.addEventListener('play', handlePlay);
    bgVideo.addEventListener('pause', handlePause);

    return () => {
      bgVideo.pause();
      bgVideo.removeEventListener('canplay', handleCanPlay);
      bgVideo.removeEventListener('error', handleError);
      bgVideo.removeEventListener('timeupdate', handleTimeUpdate);
      bgVideo.removeEventListener('loadedmetadata', handleLoadedMetadata);
      bgVideo.removeEventListener('play', handlePlay);
      bgVideo.removeEventListener('pause', handlePause);
    };
  }, [isBackgroundVideo, backgroundImage, showVideo]);

  // Ensure only one medium plays at a time - if 360 is active, pause HTML5 videos and claim audio focus if playing with sound
  useEffect(() => {
    if (show360) {
      try { videoRef.current?.pause(); } catch {}
      try { bgVideoRef.current?.pause(); } catch {}
      // Also ensure both are muted when 360 is active
      if (videoRef.current) videoRef.current.muted = true;
      if (bgVideoRef.current) bgVideoRef.current.muted = true;
      
      // If 360 is playing with sound, claim audio focus
      if (isPlaying && !isVideoMuted && videoVolume > 0) {
        console.log('[HeroHeader] 360 mode activated with sound - claiming audio focus');
        audioContext.playAudio(audioIdRef.current);
      }
    }
  }, [show360, isPlaying, isVideoMuted, videoVolume, audioContext]);

  // If a web page is displayed, pause and mute all internal videos to avoid dual audio
  useEffect(() => {
    if (webUrl) {
      try { videoRef.current?.pause(); } catch {}
      try { bgVideoRef.current?.pause(); } catch {}
      if (videoRef.current) videoRef.current.muted = true;
      if (bgVideoRef.current) bgVideoRef.current.muted = true;
      setIsVideoMuted(true);
      setIsPlaying(false);
    }
  }, [webUrl]);

  const isSkyboxVideo = show360 && getIsVideo(skyboxSrc || backgroundImage);
  const hasVideoPlaying = !webUrl && (
    show360
      ? (isSkyboxVideo && isPlaying)
      : showVideo
        ? (!!videoSrc && !videoError && videoLoaded)
        : (isBackgroundVideo && !videoError && videoLoaded)
  );

  // Remove old onVideoStateChange callback - now using AudioContext
  // Propagate state to parent controls (Spaces bar) via AudioContext
  // The progress push happens either via:
  // - The interval in useEffect for HTML5 videos
  // - The onStateChange callback for 360 SkyboxViewer

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

  // Screenshot deterrents - add right-click prevention and context menu blocking
  useEffect(() => {
    const heroElement = document.querySelector('.hero-protected-content');
    if (!heroElement) return;

    const preventContextMenu = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const preventDragStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    heroElement.addEventListener('contextmenu', preventContextMenu);
    heroElement.addEventListener('dragstart', preventDragStart);

    return () => {
      heroElement.removeEventListener('contextmenu', preventContextMenu);
      heroElement.removeEventListener('dragstart', preventDragStart);
    };
  }, []);

  return (
    <div 
      className="relative h-[85vh] lg:h-[90vh] w-full overflow-hidden rounded-2xl hero-protected-content"
      style={{ 
        userSelect: webUrl ? 'auto' : 'none',
        WebkitUserSelect: webUrl ? 'auto' : 'none',
        WebkitTouchCallout: webUrl ? 'auto' : 'none',
        pointerEvents: 'auto',
        cursor: webUrl ? 'auto' : 'pointer'
      } as React.CSSProperties}
      onMouseDown={webUrl ? undefined : handleMouseDown}
      onMouseUp={webUrl ? undefined : handleMouseUp}
      onMouseLeave={webUrl ? undefined : handleMouseLeave}
      onTouchStart={webUrl ? undefined : handleMouseDown}
      onTouchEnd={webUrl ? undefined : handleMouseUp}
    >
      {/* Web Page Iframe - highest priority */}
      {webUrl && (
        <div className="absolute inset-0 w-full h-full z-20 bg-black" style={{ pointerEvents: 'auto' }}>
          {/* Loading indicator */}
          {!iframeLoaded && !proxiedHtml && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-modals allow-downloads"
              scrolling="yes"
              style={{ overflow: 'auto', pointerEvents: 'auto' }}
              allow="autoplay; fullscreen; picture-in-picture"
            />
          ) : (
            <iframe
              src={webUrl}
              className="w-full h-full border-0"
              title="Web Content"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-modals allow-downloads"
              scrolling="yes"
              style={{ overflow: 'auto', pointerEvents: 'auto' }}
              allow="autoplay; fullscreen; picture-in-picture"
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
          {showVideo && <source src={videoSrc} type="video/mp4" />}
        </video>
      )}

      {/* 360° Skybox View - for special floors */}
      {!webUrl && show360 && (skyboxSrc || backgroundImage) && (
        <div className="absolute inset-0 w-full h-full z-10">
          {/* Fallback layer underneath to avoid black while 360 loads or fails */}
          <div className="absolute inset-0 w-full h-full z-0">
            {isSkyboxVideo ? (
              <video
                src={(skyboxSrc || backgroundImage)!}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                muted
                autoPlay
                playsInline
                preload="auto"
                poster={posterSrc}
              />
            ) : (
              <div 
                className="absolute inset-0 w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImage || posterSrc})` }}
              />
            )}
          </div>
          <Suspense fallback={
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${backgroundImage || posterSrc})` }}
            />
          }>
            <SkyboxViewer 
              mediaUrl={(skyboxSrc || backgroundImage)!} 
              className="w-full h-full relative z-10"
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
              onStateChange={({ currentTime, duration, isPlaying: skyboxPlaying, volume, isMuted }) => {
                setCurrentTime(currentTime);
                setDuration(duration);
                setIsPlaying(skyboxPlaying);
                setVideoVolume(volume);
                setIsVideoMuted(isMuted);
                
                // Push progress to AudioContext for 360 videos
                audioContext.pushProgress(audioIdRef.current, {
                  currentTime,
                  duration,
                  isPlaying: skyboxPlaying,
                  volume,
                  isMuted
                });
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

      {!webUrl && !show360 && !showVideo && (
        <>
          {isBackgroundVideo ? (
            <video
              ref={bgVideoRef}
              playsInline
              loop
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-100"
              style={{ transform: 'scaleY(1)' }}
            >
              <source src={backgroundImage} />
            </video>
          ) : (
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-500 opacity-100"
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
