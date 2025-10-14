import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface BackgroundLoaderProps {
  isLoading: boolean;
}

export function BackgroundLoader({ isLoading }: BackgroundLoaderProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          {/* Rotating outer ring */}
          <motion.div
            className="absolute w-48 h-48 rounded-full border-2 border-primary/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          {/* Rotating middle ring */}
          <motion.div
            className="absolute w-36 h-36 rounded-full border-2 border-primary/50"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />

          {/* Rotating inner ring */}
          <motion.div
            className="absolute w-24 h-24 rounded-full border-2 border-primary/70"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />

          {/* Orbiting particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full"
              style={{
                left: '50%',
                top: '50%',
                marginLeft: '-4px',
                marginTop: '-4px',
              }}
              animate={{
                x: [
                  0,
                  Math.cos((i * Math.PI * 2) / 6) * 80,
                  Math.cos((i * Math.PI * 2) / 6 + Math.PI) * 80,
                  0,
                ],
                y: [
                  0,
                  Math.sin((i * Math.PI * 2) / 6) * 80,
                  Math.sin((i * Math.PI * 2) / 6 + Math.PI) * 80,
                  0,
                ],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Center content */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 size={48} className="text-primary" />
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.h3
                className="text-xl font-semibold mb-1"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Loading Background
              </motion.h3>
              <p className="text-sm text-muted-foreground">
                Preparing your space...
              </p>
            </motion.div>

            {/* Pulse effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/10"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
