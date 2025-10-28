import { createContext, useContext, ReactNode, useRef, useCallback, useState } from 'react';

interface AudioProgress {
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isPlaying: boolean;
}

export interface MediaController {
  playPause: () => void;
  seek: (value: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  pause: () => void;
  getState: () => AudioProgress;
}

interface AudioContextType {
  registerAudioSource: (id: string, pauseFn: () => void) => void;
  unregisterAudioSource: (id: string) => void;
  playAudio: (id: string) => void;
  getActiveId: () => string | null;
  pushProgress: (id: string, progress: AudioProgress) => void;
  activeId: string | null;
  activeProgress: AudioProgress | null;
  // Phase B: Full controller registry
  registerController: (id: string, controller: MediaController) => void;
  unregisterController: (id: string) => void;
  setActive: (id: string) => void;
  controlActive: (action: keyof MediaController, payload?: any) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const DEBUG = true; // Set to true to enable debug logging

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioSourcesRef = useRef<Map<string, () => void>>(new Map());
  const controllersRef = useRef<Map<string, MediaController>>(new Map());
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
    if (DEBUG) console.debug('[AudioContext] Focus changed to:', id, '(was:', activeId, ')');
    // Pause all other audio sources
    let pausedCount = 0;
    audioSourcesRef.current.forEach((pauseFn, sourceId) => {
      if (sourceId !== id) {
        pauseFn();
        pausedCount++;
      }
    });
    if (DEBUG) console.debug('[AudioContext] Paused', pausedCount, 'other sources');
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

  // Phase B: Full controller registry
  const registerController = useCallback((id: string, controller: MediaController) => {
    if (DEBUG) console.debug('[AudioContext] Registered controller:', id);
    controllersRef.current.set(id, controller);
  }, []);

  const unregisterController = useCallback((id: string) => {
    if (DEBUG) console.debug('[AudioContext] Unregistered controller:', id);
    controllersRef.current.delete(id);
    if (activeId === id) {
      if (DEBUG) console.debug('[AudioContext] Active controller unregistered, clearing focus');
      setActiveId(null);
      setActiveProgress(null);
    }
  }, [activeId]);

  const setActive = useCallback((id: string) => {
    if (DEBUG) console.debug('[AudioContext] setActive called for:', id);
    // Pause all other controllers
    let pausedCount = 0;
    controllersRef.current.forEach((controller, controllerId) => {
      if (controllerId !== id) {
        try {
          controller.pause();
          pausedCount++;
        } catch (e) {
          console.warn('[AudioContext] Failed to pause controller:', controllerId, e);
        }
      }
    });
    if (DEBUG) console.debug('[AudioContext] Paused', pausedCount, 'other controllers');
    setActiveId(id);
  }, []);

  const controlActive = useCallback((action: keyof MediaController, payload?: any) => {
    const controller = activeId ? controllersRef.current.get(activeId) : null;
    if (!controller) {
      if (DEBUG) console.debug('[AudioContext] No active controller to control');
      return;
    }
    if (DEBUG) console.debug('[AudioContext] Controlling active:', activeId, 'action:', action, 'payload:', payload);
    try {
      if (action === 'playPause' || action === 'toggleMute' || action === 'pause') {
        (controller[action] as () => void)();
      } else if (action === 'seek' || action === 'setVolume') {
        (controller[action] as (value: number) => void)(payload);
      }
    } catch (e) {
      console.warn('[AudioContext] Failed to control active:', activeId, action, e);
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
      activeProgress,
      registerController,
      unregisterController,
      setActive,
      controlActive
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
