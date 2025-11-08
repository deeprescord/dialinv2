import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useSpacesContext } from './SpacesContext';
import { useNavigate } from 'react-router-dom';

interface QueueItem {
  spaceId: string;
  spaceName: string;
  thumbnail?: string;
  mediaUrl?: string;
  mediaType?: string;
  isHome?: boolean;
}

type RepeatMode = "off" | "one" | "all";

interface MediaQueueContextType {
  currentIndex: number;
  queue: QueueItem[];
  isPlaying: boolean;
  progress: number;
  isAutoplay: boolean;
  repeatMode: RepeatMode;
  skipToNext: () => void;
  skipToPrevious: () => void;
  setIsPlaying: (playing: boolean) => void;
  setProgress: (progress: number) => void;
  setIsAutoplay: (autoplay: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  updateQueue: (spaces: any[]) => void;
  setCurrentSpace: (spaceId: string) => void;
}

const MediaQueueContext = createContext<MediaQueueContextType | undefined>(undefined);

export function MediaQueueProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { spaces } = useSpacesContext();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");

  // When autoplay is enabled, disable repeat one
  const handleSetAutoplay = useCallback((autoplay: boolean) => {
    setIsAutoplay(autoplay);
    if (autoplay && repeatMode === "one") {
      setRepeatMode("off");
    }
  }, [repeatMode]);

  const handleSetRepeatMode = useCallback((mode: RepeatMode) => {
    setRepeatMode(mode);
    if (mode === "one" && isAutoplay) {
      setIsAutoplay(false);
    }
  }, [isAutoplay]);

  // Update queue when spaces change
  const updateQueue = useCallback((spacesData: any[]) => {
    const queueItems: QueueItem[] = spacesData.map(space => ({
      spaceId: space.id,
      spaceName: space.name,
      thumbnail: space.thumbnail_url || space.cover_url,
      mediaUrl: space.cover_url,
      isHome: space.is_home
    }));
    setQueue(queueItems);
  }, []);

  useEffect(() => {
    updateQueue(spaces);
  }, [spaces, updateQueue]);

  const setCurrentSpace = useCallback((spaceId: string) => {
    const index = queue.findIndex(item => item.spaceId === spaceId);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [queue]);

  const skipToNext = useCallback(() => {
    if (queue.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % queue.length;
    setCurrentIndex(nextIndex);
    setProgress(0);
    
    const nextSpace = queue[nextIndex];
    if (nextSpace.isHome) {
      navigate('/');
    } else {
      navigate(`/space/${nextSpace.spaceId}`);
    }
  }, [currentIndex, queue, navigate]);

  const skipToPrevious = useCallback(() => {
    if (queue.length === 0) return;
    
    const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setProgress(0);
    
    const prevSpace = queue[prevIndex];
    if (prevSpace.isHome) {
      navigate('/');
    } else {
      navigate(`/space/${prevSpace.spaceId}`);
    }
  }, [currentIndex, queue, navigate]);

  return (
    <MediaQueueContext.Provider value={{
      currentIndex,
      queue,
      isPlaying,
      progress,
      isAutoplay,
      repeatMode,
      skipToNext,
      skipToPrevious,
      setIsPlaying,
      setProgress,
      setIsAutoplay: handleSetAutoplay,
      setRepeatMode: handleSetRepeatMode,
      updateQueue,
      setCurrentSpace
    }}>
      {children}
    </MediaQueueContext.Provider>
  );
}

export function useMediaQueue() {
  const context = useContext(MediaQueueContext);
  if (context === undefined) {
    throw new Error('useMediaQueue must be used within a MediaQueueProvider');
  }
  return context;
}
