import React, { useState, useRef, useEffect, Suspense, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { SkyboxViewer } from './SkyboxViewer';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { PdfViewer } from './PdfViewer';

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
  webUrl?: string;
  allowDynamicHeight?: boolean; // Enable dynamic height for tall content
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
  allowDynamicHeight = false,
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
  const [lastUnmutedVolume, setLastUnmutedVolume] = useState(0.7);
  const [skyboxSeekTo, setSkyboxSeekTo] = useState<number | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [proxyAttempted, setProxyAttempted] = useState(false);
  const [proxiedHtml, setProxiedHtml] = useState<string | null>(null);
  const [proxyError, setProxyError] = useState<string | null>(null);
  const [isBlurred, setIsBlurred] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(1);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [iframeHeight, setIframeHeight] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);

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
    if (showVideo) {
      if (bg) { try { bg.pause(); bg.muted = true; } catch {}
      }
      if (fg) { fg.muted = false; }
    } else {
      if (fg) { try { fg.pause(); fg.muted = true; } catch {}
      }
      if (bg) { bg.muted = false; }
    }
  }, [showVideo]);

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
      // Only autoplay if this is the active video (showVideo is true AND no 360 or web content)
      if (showVideo && !show360 && !webUrl) {
        // Ensure background video is paused
        if (bgVideoRef.current) {
          try { bgVideoRef.current.pause(); } catch {}
        }
        // Set volume and unmute before playing
        video.volume = 0.7;
        video.muted = false;
        setIsVideoMuted(false);
        setVideoVolume(0.7);
        // Autoplay video when loaded
        video.play().catch(err => {
          console.log('Autoplay with sound prevented, trying muted:', err);
          // If autoplay with sound fails, try muted
          video.muted = true;
          setIsVideoMuted(true);
          video.play().catch(e => console.log('Muted autoplay also prevented:', e));
        });
      } else {
        // Not active: ensure paused and muted
        try { video.pause(); } catch {}
        video.muted = true;
      }
    };

    const handleError = () => {
      setVideoError(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      // Capture video dimensions for tall video detection
      if (video.videoWidth && video.videoHeight) {
        setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
      }
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
  
  const getIsPDF = (url?: string) => {
    if (!url) return false;
    const clean = url.split('?')[0].split('#')[0];
    return /\.pdf$/i.test(clean) || url.includes('application/pdf');
  };
  
  const isBackgroundVideo = getIsVideo(backgroundImage);
  const isPDF = getIsPDF(webUrl);
  
  // Determine if video is "tall" (height > 2x width) and should be scrollable
  const isScrollableVideo = allowDynamicHeight && videoDimensions 
    ? videoDimensions.height / videoDimensions.width > 2 
    : false;
  
  // Determine if content needs scrolling
  const needsScrolling = allowDynamicHeight && (isScrollableVideo || isPDF || webUrl);

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
      // Only autoplay if this is the active video (showVideo is false AND show360 is false AND no web)
      if (!showVideo && !show360 && !webUrl) {
        // Ensure foreground video is paused
        if (videoRef.current) {
          try { videoRef.current.pause(); } catch {}
        }
        // Set volume and unmute before playing
        bgVideo.volume = 0.7;
        bgVideo.muted = false;
        setIsVideoMuted(false);
        setVideoVolume(0.7);
        // Autoplay background video when loaded
        bgVideo.play().catch(err => {
          console.log('Background autoplay with sound prevented, trying muted:', err);
          // If autoplay with sound fails, try muted
          bgVideo.muted = true;
          setIsVideoMuted(true);
          bgVideo.play().catch(e => console.log('Muted autoplay also prevented:', e));
        });
      } else {
        // Not active: ensure paused and muted
        try { bgVideo.pause(); } catch {}
        bgVideo.muted = true;
      }
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

  // Ensure only one medium plays at a time - if 360 is active, pause HTML5 videos
  useEffect(() => {
    if (show360) {
      try { videoRef.current?.pause(); } catch {}
      try { bgVideoRef.current?.pause(); } catch {}
      // Also ensure both are muted when 360 is active
      if (videoRef.current) videoRef.current.muted = true;
      if (bgVideoRef.current) bgVideoRef.current.muted = true;
      setIsVideoMuted(true);
      setIsPlaying(false);
    }
  }, [show360]);

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

  // Propagate state to parent controls (Spaces bar)
  React.useEffect(() => {
    onVideoStateChange?.({
      isPlaying,
      currentTime,
      duration,
      volume: videoVolume,
      isMuted: isVideoMuted,
      hasVideo: hasVideoPlaying,
    });
  }, [isPlaying, currentTime, duration, videoVolume, isVideoMuted, hasVideoPlaying, onVideoStateChange]);

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

  const containerContent = (
    <div 
      className={`relative w-full rounded-2xl hero-protected-content ${
        needsScrolling 
          ? 'min-h-[85vh] lg:min-h-[90vh] max-h-[500vh] h-auto' 
          : 'h-[85vh] lg:h-[90vh] overflow-hidden'
      }`}
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
      {/* PDF Viewer - highest priority for PDF content */}
      {webUrl && isPDF && (
        <div className={`w-full z-20 bg-background ${needsScrolling ? 'relative min-h-screen' : 'absolute inset-0 h-full'}`} style={{ pointerEvents: 'auto' }}>
          <div className="w-full">
            <PdfViewer url={webUrl} zoom={pdfZoom} className="w-full" onLoadSuccess={() => setIframeLoaded(true)} onError={(e) => console.error('PDF load error', e)} />
          </div>
          
          {/* PDF Zoom Controls */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-black/60 backdrop-blur-sm rounded-lg p-4 min-w-[280px]">
            <ZoomOut className="w-4 h-4 text-white flex-shrink-0" />
            <Slider
              value={[pdfZoom]}
              onValueChange={(values) => setPdfZoom(values[0])}
              min={0.5}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-white flex-shrink-0" />
            <button
              onClick={() => setPdfZoom(1)}
              className="px-3 py-1 text-white text-sm hover:bg-white/20 rounded transition-colors flex-shrink-0"
            >
              {Math.round(pdfZoom * 100)}%
            </button>
          </div>

          {/* PDF indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-medium pointer-events-none">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                PDF Document
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); window.open(webUrl, '_blank', 'noopener'); }}
              className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs hover:opacity-90"
            >
              Open
            </button>
          </div>
        </div>
      )}

      {/* Web Page Iframe - for non-PDF web content */}
      {webUrl && !isPDF && (
        <div className={`w-full z-20 bg-black ${needsScrolling ? 'relative' : 'absolute inset-0 h-full'}`} style={{ pointerEvents: 'auto', minHeight: needsScrolling ? '85vh' : undefined }}>
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
              className="w-full border-0"
              title="Web Content (proxied)"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-modals allow-downloads"
              scrolling="yes"
              style={{ 
                overflow: 'auto', 
                pointerEvents: 'auto',
                height: needsScrolling ? (iframeHeight ? `${iframeHeight}px` : '200vh') : '100%',
                minHeight: needsScrolling ? '85vh' : undefined
              }}
              allow="autoplay; fullscreen; picture-in-picture"
            />
          ) : (
            <iframe
              src={webUrl}
              className="w-full border-0"
              title="Web Content"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-modals allow-downloads"
              scrolling="yes"
              style={{ 
                overflow: 'auto', 
                pointerEvents: 'auto',
                height: needsScrolling ? (iframeHeight ? `${iframeHeight}px` : '200vh') : '100%',
                minHeight: needsScrolling ? '85vh' : undefined
              }}
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

      {/* Video - dynamic sizing for tall videos */}
      {!webUrl && showVideo && videoSrc && !videoError && (
        <video
          ref={videoRef}
          playsInline
          loop
          preload="auto"
          muted
          className={`transition-opacity duration-500 ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          } ${
            isScrollableVideo 
              ? 'relative w-full h-auto' 
              : 'absolute inset-0 w-full h-full object-cover'
          }`}
          style={{ 
            transform: 'scaleY(1)',
            objectFit: isScrollableVideo ? 'contain' : 'cover'
          }}
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

      {!webUrl && !show360 && !showVideo && (
        <>
          {isBackgroundVideo ? (
            <video
              ref={bgVideoRef}
              playsInline
              loop
              preload="auto"
              muted
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

      {/* Gradient Overlay - don't show for web view, 360° view, or scrollable content */}
      {!webUrl && !needsScrolling && <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent ${show360 ? 'pointer-events-none z-20' : ''}`} />}

      {/* Content - Only show for non-lobby spaces */}
      {title && subtitle && (
        <div className={`${needsScrolling ? 'relative mt-8 px-8' : 'absolute bottom-32 left-8'} ${show360 ? 'z-30' : ''}`}>
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

      {/* Scroll Indicator for tall content */}
      {needsScrolling && (isScrollableVideo || isPDF) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs font-medium">
            {isScrollableVideo ? 'Scrollable Video' : 'Scroll to view document'}
            {videoDimensions && isScrollableVideo && (
              <span className="ml-2 text-white/60">
                {videoDimensions.width}×{videoDimensions.height}
              </span>
            )}
          </div>
          <div className="animate-bounce">
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );

  // Wrap in ScrollArea if content needs scrolling
  return needsScrolling ? (
    <ScrollArea className="w-full max-h-[500vh]">
      {containerContent}
    </ScrollArea>
  ) : (
    containerContent
  );
}
);
