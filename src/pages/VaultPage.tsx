import { useState, useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation, Keyboard } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';

interface Album {
  id: string;
  name: string;
  artist: string;
  cover: string;
  backgroundVideo?: string;
  backgroundColor: string;
  audioUrl?: string;
  lyrics?: string[];
  mood: 'energetic' | 'calm' | 'dramatic';
}

const VaultPage = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Sample albums - user will replace with real data
  const albums: Album[] = [
    {
      id: '1',
      name: 'Burning Desire',
      artist: 'Artist Name',
      cover: '/media/grand-theater-thumb.jpg',
      backgroundVideo: '/media/default-home-bg.mp4',
      backgroundColor: '#ff4500',
      mood: 'energetic',
      lyrics: ['Line 1 of lyrics', 'Line 2 of lyrics', 'Line 3 of lyrics']
    },
    {
      id: '2',
      name: 'Calm Waters',
      artist: 'Artist Name',
      cover: '/media/starbuds-thumb.jpg',
      backgroundVideo: '/media/lobby2.mp4',
      backgroundColor: '#4169e1',
      mood: 'calm',
      lyrics: ['Verse 1', 'Verse 2', 'Chorus']
    },
    {
      id: '3',
      name: 'Electric Dreams',
      artist: 'Artist Name',
      cover: '/media/grand-theater-thumb.jpg',
      backgroundVideo: '/media/elton-john-360.mp4',
      backgroundColor: '#9370db',
      mood: 'dramatic',
      lyrics: ['Opening verse', 'Building energy', 'Peak moment']
    },
  ];

  const currentAlbum = albums[activeIndex];

  const handleAlbumClick = () => {
    setIsImmersiveMode(true);
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const exitImmersiveMode = () => {
    setIsImmersiveMode(false);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <>
      <Helmet>
        <title>The Harmonic Vault - Dialin</title>
        <meta name="description" content="Immersive album experience" />
      </Helmet>

      <div className="h-screen w-full overflow-hidden relative bg-black">
        {/* Background Layer - Cross-fading videos */}
        <div className="absolute inset-0 z-0">
          {albums.map((album, index) => (
            <motion.div
              key={album.id}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: index === activeIndex ? 1 : 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            >
              {album.backgroundVideo ? (
                <video
                  src={album.backgroundVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full"
                  style={{
                    background: `radial-gradient(circle at center, ${album.backgroundColor}40 0%, #000000 100%)`
                  }}
                />
              )}
              {/* Overlay gradient for depth */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
            </motion.div>
          ))}
        </div>

        {/* Hidden audio element */}
        <audio ref={audioRef} loop />

        {/* Floating Glass Top Bar */}
        <motion.div 
          className="absolute top-5 left-5 right-5 z-30"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isImmersiveMode ? 0 : 1, y: isImmersiveMode ? -20 : 0 }}
          transition={{ duration: 0.6 }}
        >
          <div 
            className="rounded-3xl border border-white/10 px-8 py-4 mx-auto max-w-2xl"
            style={{
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              background: 'rgba(0, 0, 0, 0.2)',
              boxShadow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.1), 0 8px 32px 0 rgba(0, 0, 0, 0.4)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">The Harmonic Vault</h1>
                <p className="text-sm text-white/60">Immersive Album Experience</p>
              </div>
              <div className="text-right">
                <p className="text-white/80 font-medium">{currentAlbum.name}</p>
                <p className="text-xs text-white/50">{currentAlbum.artist}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3D Coverflow Carousel */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center z-20"
          animate={{ scale: isImmersiveMode ? 1.5 : 1, opacity: isImmersiveMode ? 0 : 1 }}
          transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
        >
          <div className="w-full max-w-6xl px-20">
            <Swiper
              effect="coverflow"
              grabCursor
              centeredSlides
              slidesPerView="auto"
              initialSlide={activeIndex}
              coverflowEffect={{
                rotate: 50,
                stretch: 0,
                depth: 100,
                modifier: 1,
                slideShadows: true,
              }}
              keyboard={{
                enabled: true,
              }}
              modules={[EffectCoverflow, Navigation, Keyboard]}
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              className="vault-swiper"
            >
              {albums.map((album) => (
                <SwiperSlide key={album.id} className="!w-[400px]">
                  <motion.div
                    className="relative cursor-pointer group"
                    onClick={handleAlbumClick}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src={album.cover}
                      alt={album.name}
                      className="w-full aspect-square object-cover rounded-2xl shadow-2xl"
                      style={{
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(118, 51, 204, 0.3)'
                      }}
                    />
                    {/* Hover glow */}
                    <div 
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle at center, rgba(118, 51, 204, 0.4) 0%, transparent 70%)',
                        filter: 'blur(20px)'
                      }}
                    />
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </motion.div>

        {/* Floating Glass Bottom Player Controls */}
        <motion.div 
          className="absolute bottom-5 left-5 right-5 z-30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isImmersiveMode ? 0 : 1, y: isImmersiveMode ? 20 : 0 }}
          transition={{ duration: 0.6 }}
        >
          <div 
            className="rounded-3xl border border-white/10 px-8 py-6 mx-auto max-w-2xl"
            style={{
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              background: 'rgba(0, 0, 0, 0.2)',
              boxShadow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.1), 0 8px 32px 0 rgba(0, 0, 0, 0.4)'
            }}
          >
            <div className="flex items-center justify-center gap-6">
              <button 
                className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                onClick={() => setActiveIndex((prev) => (prev - 1 + albums.length) % albums.length)}
              >
                <SkipBack size={24} />
              </button>
              
              <button 
                onClick={handlePlayPause}
                className="p-4 rounded-full bg-primary hover:bg-primary/80 text-white transition-all shadow-lg hover:shadow-xl"
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
              </button>
              
              <button 
                className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                onClick={() => setActiveIndex((prev) => (prev + 1) % albums.length)}
              >
                <SkipForward size={24} />
              </button>
            </div>

            {/* Track info */}
            <div className="text-center mt-4">
              <p className="text-sm text-white/50">
                Swipe or use arrow keys to navigate
              </p>
            </div>
          </div>
        </motion.div>

        {/* Immersive Mode - Lyrics/Visualizer Overlay */}
        <AnimatePresence>
          {isImmersiveMode && (
            <motion.div
              className="absolute inset-0 z-40 flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
              
              {/* Exit button */}
              <button
                onClick={exitImmersiveMode}
                className="absolute top-8 right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all z-50"
              >
                <X size={24} />
              </button>

              {/* Lyrics display */}
              <div className="relative z-10 max-w-3xl px-8">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center space-y-6"
                >
                  <h2 className="text-6xl font-bold text-white mb-8 drop-shadow-2xl">
                    {currentAlbum.name}
                  </h2>
                  {currentAlbum.lyrics?.map((line, index) => (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.2 }}
                      className="text-2xl text-white/90 font-light tracking-wide drop-shadow-lg"
                    >
                      {line}
                    </motion.p>
                  ))}
                </motion.div>

                {/* Visualizer placeholder */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring' }}
                  className="mt-16 h-32 rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(118, 51, 204, 0.3), transparent)',
                  }}
                >
                  {/* Audio waveform would go here */}
                  <div className="h-full flex items-center justify-center gap-1 px-4">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-primary rounded-full"
                        animate={{
                          height: ['20%', '80%', '20%'],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.02,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .vault-swiper {
          width: 100%;
          padding: 50px 0;
        }
        
        .vault-swiper .swiper-slide {
          background-position: center;
          background-size: cover;
        }
      `}</style>
    </>
  );
};

export default VaultPage;
