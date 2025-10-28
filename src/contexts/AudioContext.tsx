import { createContext, useContext, ReactNode, useRef, useCallback, useState } from 'react';

interface AudioProgress {
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isPlaying: boolean;
}

interface AudioContextType {
  registerAudioSource: (id: string, pauseFn: () => void) => void;
  unregisterAudioSource: (id: string) => void;
  playAudio: (id: string) => void;
  getActiveId: () => string | null;
  pushProgress: (id: string, progress: AudioProgress) => void;
  activeId: string | null;
  activeProgress: AudioProgress | null;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const DEBUG = false; // Set to true to enable debug logging

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioSourcesRef = useRef<Map<string, () => void>>(new Map());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeProgress, setActiveProgress] = useState<AudioProgress | null>(null);

  const registerAudioSource = useCallback((id: string, pauseFn: () => void) => {
    if (DEBUG) console.debug('[AudioContext] Registered source:', id);
    audioSourcesRef.current.set(id, pauseFn);
  }, []);

  const unregisterAudioSource = useCallback((id: string) => {
    if (DEBUG) console.debug('[AudioContext] Unregistered source:', id);
    audioSourcesRef.current.delete(id);
    if (activeId === id) {
      if (DEBUG) console.debug('[AudioContext] Active source unregistered, clearing focus');
      setActiveId(null);
      setActiveProgress(null);
    }
  }, [activeId]);

  const playAudio = useCallback((id: string) => {
    if (DEBUG) console.debug('[AudioContext] Focus changed to:', id, 'from:', activeId);
    // Pause all other audio sources
    audioSourcesRef.current.forEach((pauseFn, sourceId) => {
      if (sourceId !== id) {
        pauseFn();
      }
    });
    setActiveId(id);
  }, [activeId]);

  const getActiveId = useCallback(() => activeId, [activeId]);

  const pushProgress = useCallback((id: string, progress: AudioProgress) => {
    if (id === activeId) {
      setActiveProgress(progress);
      if (DEBUG) console.debug('[AudioContext] Progress updated from active source:', id, progress.currentTime.toFixed(2));
    } else {
      if (DEBUG) console.debug('[AudioContext] Ignored progress from non-active source:', id);
    }
  }, [activeId]);

  return (
    <AudioContext.Provider value={{ 
      registerAudioSource, 
      unregisterAudioSource, 
      playAudio, 
      getActiveId,
      pushProgress,
      activeId,
      activeProgress
    }}>
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
