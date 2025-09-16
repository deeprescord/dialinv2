import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

export function CelebrationAnimation({ isVisible, onComplete }: CelebrationAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (isVisible) {
      // Generate confetti particles
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        delay: Math.random() * 0.5
      }));
      setParticles(newParticles);

      // Auto-complete after animation
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
          />

          {/* Central celebration content */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
            className="relative bg-gradient-to-br from-dialin-purple to-dialin-gold rounded-2xl p-8 shadow-2xl"
          >
            {/* +1 Point Text */}
            <div className="text-center">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-6xl font-bold text-white mb-2"
              >
                +1
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-white/90 font-medium"
              >
                Point Earned!
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-white/70 mt-2"
              >
                Dial saved successfully
              </motion.div>
            </div>

            {/* Confetti Particles */}
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0,
                  rotate: 0 
                }}
                animate={{ 
                  x: particle.x * 4, 
                  y: particle.y * 4, 
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360] 
                }}
                transition={{ 
                  duration: 2, 
                  delay: particle.delay,
                  ease: "easeOut"
                }}
                className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                style={{
                  backgroundColor: Math.random() > 0.5 ? '#8B5CF6' : '#F59E0B'
                }}
              />
            ))}

            {/* Sparkle Effects */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1, 0], 
                  opacity: [0, 1, 0],
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 1.5, 
                  delay: 0.5 + i * 0.1,
                  repeat: 1
                }}
                className="absolute w-2 h-2 bg-white rounded-full"
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`
                }}
              />
            ))}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}