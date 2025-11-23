import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioReactiveBackgroundProps {
  isHighEnergy: boolean;
  energy: number;
  videoUrl?: string;
}

export function AudioReactiveBackground({ 
  isHighEnergy, 
  energy,
  videoUrl = '/media/default-home-bg.mp4'
}: AudioReactiveBackgroundProps) {
  const [currentScene, setCurrentScene] = useState<'burning' | 'calm'>('burning');

  useEffect(() => {
    setCurrentScene(isHighEnergy ? 'burning' : 'calm');
  }, [isHighEnergy]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="wait">
        {currentScene === 'burning' ? (
          <motion.div
            key="burning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0"
          >
            {/* Burning building aesthetic */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ 
                filter: `brightness(${0.7 + energy * 0.5}) saturate(${1 + energy * 0.5}) hue-rotate(${energy * 30}deg)` 
              }}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
            
            {/* Fire overlay effect */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-red-900/30 via-orange-500/20 to-transparent"
              animate={{ 
                opacity: [0.3, 0.5 + energy * 0.3, 0.3],
              }}
              transition={{ 
                duration: 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="calm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0"
          >
            {/* Calm sunset/aurora aesthetic */}
            <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-950" />
            
            {/* Aurora effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-purple-500/30 to-pink-500/20"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Ambient particles */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/40 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -100],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
