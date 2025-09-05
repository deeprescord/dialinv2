import React, { useState, useRef, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { SkyboxViewer } from './SkyboxViewer';

interface HeroHeaderVideoProps {
  videoSrc?: string;
  posterSrc: string;
  title: string;
  subtitle: string;
  backgroundImage?: string;
  showVideo?: boolean;
  show360?: boolean;
  xAxisOffset?: number;
  yAxisOffset?: number;
  volume?: number;
  isMuted?: boolean;
}

export function HeroHeaderVideo({ 
  videoSrc, 
  posterSrc, 
  title, 
  subtitle, 
  backgroundImage, 
  showVideo = true, 
  show360 = false,
  xAxisOffset,
  yAxisOffset,
  volume,
  isMuted
}: HeroHeaderVideoProps) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
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

    // Set a timeout to fall back to poster if video doesn't load
    const fallbackTimeout = setTimeout(() => {
      if (!videoLoaded) {
        setVideoError(true);
      }
    }, 3000);

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      clearTimeout(fallbackTimeout);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [videoLoaded]);

  return (
    <div className="relative h-[85vh] lg:h-[90vh] w-full overflow-hidden rounded-2xl mt-24 lg:mt-20">
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
          poster={posterSrc}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* 360° Skybox View - for special floors */}
      {show360 && backgroundImage && (
        <div className="absolute inset-0 w-full h-full z-10">
          <Suspense fallback={
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
          }>
            <SkyboxViewer 
              mediaUrl={backgroundImage} 
              className="w-full h-full"
              xAxisOffset={xAxisOffset}
              yAxisOffset={yAxisOffset}
              volume={volume}
              isMuted={isMuted}
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

      {/* Background Image - for floors or fallback */}
      {!show360 && (
        <div 
          className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-500 ${
            !showVideo || videoError || !videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${backgroundImage || posterSrc})` }}
        />
      )}

      {/* Gradient Overlay - don't interfere with 360° view */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent ${show360 ? 'pointer-events-none z-20' : ''}`} />

      {/* Content */}
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
    </div>
  );
}