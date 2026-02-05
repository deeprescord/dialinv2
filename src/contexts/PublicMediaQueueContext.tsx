 import { createContext, useContext, ReactNode, useState, useCallback } from 'react';
 
 interface QueueItem {
   id: string;
   name: string;
   thumbnail?: string;
   mediaUrl?: string;
   mediaType?: string;
   duration?: number;
 }
 
 type RepeatMode = "off" | "one" | "all";
 
 interface PublicMediaQueueContextType {
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
   updateQueue: (items: QueueItem[]) => void;
   setCurrentIndex: (index: number) => void;
   currentItem: QueueItem | null;
 }
 
 const PublicMediaQueueContext = createContext<PublicMediaQueueContextType | undefined>(undefined);
 
 export function PublicMediaQueueProvider({ children }: { children: ReactNode }) {
   const [queue, setQueue] = useState<QueueItem[]>([]);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [isPlaying, setIsPlaying] = useState(false);
   const [progress, setProgress] = useState(0);
   const [isAutoplay, setIsAutoplay] = useState(true);
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
 
   const updateQueue = useCallback((items: QueueItem[]) => {
     setQueue(items);
   }, []);
 
   const skipToNext = useCallback(() => {
     if (queue.length === 0) return;
     
     const nextIndex = (currentIndex + 1) % queue.length;
     setCurrentIndex(nextIndex);
     setProgress(0);
   }, [currentIndex, queue.length]);
 
   const skipToPrevious = useCallback(() => {
     if (queue.length === 0) return;
     
     const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
     setCurrentIndex(prevIndex);
     setProgress(0);
   }, [currentIndex, queue.length]);
 
   const currentItem = queue[currentIndex] || null;
 
   return (
     <PublicMediaQueueContext.Provider value={{
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
       setCurrentIndex,
       currentItem
     }}>
       {children}
     </PublicMediaQueueContext.Provider>
   );
 }
 
 export function usePublicMediaQueue() {
   const context = useContext(PublicMediaQueueContext);
   if (context === undefined) {
     throw new Error('usePublicMediaQueue must be used within a PublicMediaQueueProvider');
   }
   return context;
 }