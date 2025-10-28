import { createContext, useContext, ReactNode, useRef, useCallback } from 'react';

interface AudioContextType {
  registerAudioSource: (id: string, pauseFn: () => void) => void;
  unregisterAudioSource: (id: string) => void;
  playAudio: (id: string) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioSourcesRef = useRef<Map<string, () => void>>(new Map());
  const currentPlayingRef = useRef<string | null>(null);

  const registerAudioSource = useCallback((id: string, pauseFn: () => void) => {
    audioSourcesRef.current.set(id, pauseFn);
  }, []);

  const unregisterAudioSource = useCallback((id: string) => {
    audioSourcesRef.current.delete(id);
    if (currentPlayingRef.current === id) {
      currentPlayingRef.current = null;
    }
  }, []);

  const playAudio = useCallback((id: string) => {
    // Pause all other audio sources
    audioSourcesRef.current.forEach((pauseFn, sourceId) => {
      if (sourceId !== id) {
        pauseFn();
      }
    });
    currentPlayingRef.current = id;
  }, []);

  return (
    <AudioContext.Provider value={{ registerAudioSource, unregisterAudioSource, playAudio }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudioContext() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
}
