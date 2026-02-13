import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles } from 'lucide-react';

interface UploadLoaderProps {
  isUploading: boolean;
  progress?: number;
  fileCount?: number;
}

export function UploadLoader({ isUploading, progress = 0, fileCount = 0 }: UploadLoaderProps) {
  return (
    <AnimatePresence>
      {isUploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative"
          >
            {/* Outer rotating rings */}
            <motion.div
              className="absolute inset-0 w-64 h-64"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-4 rounded-full border-2 border-primary/30" />
              <div className="absolute inset-8 rounded-full border-2 border-primary/40" />
            </motion.div>

            {/* Counter rotating ring */}
            <motion.div
              className="absolute inset-0 w-64 h-64"
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute inset-12 rounded-full border-2 border-accent/50 border-dashed" />
            </motion.div>

            {/* Orbiting particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-2 h-2"
                style={{
                  originX: 0.5,
                  originY: 0.5,
                }}
                animate={{
                  rotate: 360,
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  rotate: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.5,
                  },
                  scale: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.5,
                  },
                }}
              >
                <div 
                  className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50"
                  style={{
                    transform: `translateX(${100 + i * 8}px)`,
                  }}
                />
              </motion.div>
            ))}

            {/* Center content */}
            <div className="relative w-64 h-64 flex flex-col items-center justify-center">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="mb-4"
              >
                <div className="relative">
                  <Upload className="w-16 h-16 text-primary" />
                  <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-accent" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.h3 
                className="text-xl font-semibold text-foreground mb-2"
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Uploading{fileCount > 0 ? ` ${fileCount} file${fileCount > 1 ? 's' : ''}` : '...'}
              </motion.h3>

              {/* Progress bar */}
              <div className="w-48 space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {Math.round(progress)}%
                </p>
              </div>

              <motion.p 
                className="text-sm text-muted-foreground mt-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {progress < 100 ? 'Uploading files...' : 'Processing...'}
              </motion.p>
            </div>

            {/* Floating particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-1 h-1 rounded-full bg-primary/40"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
