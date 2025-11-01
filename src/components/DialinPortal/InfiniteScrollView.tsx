import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useSpaceItems } from '@/hooks/useSpaceItems';
import { useInfiniteScroll, useItemVisibility } from '@/hooks/useInfiniteScroll';
import { LoadingState } from './LoadingState';
import { ImageFallback } from '@/components/ui/image-fallback';
import { Play, Pause, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InfiniteScrollViewProps {
  spaceId?: string;
  onClose?: () => void;
}

export function InfiniteScrollView({ spaceId, onClose }: InfiniteScrollViewProps) {
  const { items, loading } = useSpaceItems(spaceId);
  const [signedUrls, setSignedUrls] = useState<Map<string, string>>(new Map());
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const audioRefs = useRef<Map<number, HTMLAudioElement>>(new Map());
  const [playingIndex, setPlayingIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const crossfadeDuration = 3000; // 3 second crossfade

  // Paginate items for performance
  const displayedItems = items.slice(0, currentPage * itemsPerPage);
  const hasMore = displayedItems.length < items.length;

  const { loadMoreRef } = useInfiniteScroll({
    onLoadMore: () => {
      if (!loading && hasMore) {
        setCurrentPage(prev => prev + 1);
      }
    },
    hasMore,
    isLoading: loading,
  });

  const { setItemRef, visibleIndex } = useItemVisibility({
    onVisible: (index) => {
      handleItemVisible(index);
    },
    threshold: 0.5,
  });

  // Fetch signed URLs for items
  useEffect(() => {
    const fetchSignedUrls = async () => {
      const newUrls = new Map(signedUrls);
      
      for (const item of displayedItems) {
        if (!item.storage_path || item.is_space || item.file_type === 'web' || newUrls.has(item.id)) {
          continue;
        }

        try {
          const { data } = await supabase.storage
            .from('user-files')
            .createSignedUrl(item.storage_path, 3600);
          
          if (data?.signedUrl) {
            newUrls.set(item.id, data.signedUrl);
          }
        } catch (error) {
          console.error('Error fetching signed URL:', error);
        }
      }
      
      setSignedUrls(newUrls);
    };

    fetchSignedUrls();
  }, [displayedItems.length]);

  // Handle item visibility - autoplay videos and crossfade audio
  const handleItemVisible = (index: number) => {
    const previousIndex = playingIndex;
    setPlayingIndex(index);
    
    // Handle video playback
    videoRefs.current.forEach((video, idx) => {
      if (idx === index) {
        video.play().catch(e => console.log('Autoplay prevented:', e));
      } else {
        video.pause();
      }
    });

    // Handle audio crossfade
    const currentAudio = audioRefs.current.get(index);
    const previousAudio = audioRefs.current.get(previousIndex);

    if (currentAudio) {
      // Start new audio at volume 0
      currentAudio.volume = 0;
      currentAudio.play().catch(e => console.log('Autoplay prevented:', e));

      // Fade in new audio
      const fadeInInterval = setInterval(() => {
        if (currentAudio.volume < 0.95) {
          currentAudio.volume = Math.min(1, currentAudio.volume + 0.05);
        } else {
          currentAudio.volume = 1;
          clearInterval(fadeInInterval);
        }
      }, crossfadeDuration / 20);
    }

    if (previousAudio && previousIndex !== index) {
      // Fade out previous audio
      const fadeOutInterval = setInterval(() => {
        if (previousAudio.volume > 0.05) {
          previousAudio.volume = Math.max(0, previousAudio.volume - 0.05);
        } else {
          previousAudio.volume = 0;
          previousAudio.pause();
          clearInterval(fadeOutInterval);
        }
      }, crossfadeDuration / 20);
    }
  };

  // Toggle play/pause for current item
  const togglePlayPause = () => {
    const video = videoRefs.current.get(playingIndex);
    const audio = audioRefs.current.get(playingIndex);
    const media = video || audio;
    if (!media) return;

    if (media.paused) {
      media.play();
    } else {
      media.pause();
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(prev => {
      const newMuted = !prev;
      videoRefs.current.forEach(video => {
        video.muted = newMuted;
      });
      return newMuted;
    });
  };

  const renderItem = (item: any, index: number) => {
    const url = signedUrls.get(item.id);
    const isVideo = item.file_type === 'video';
    const isAudio = item.file_type === 'audio';
    const isImage = item.file_type === 'image';
    const isWeb = item.file_type === 'web';
    const isPdf = item.file_type === 'document' || item.mime_type === 'application/pdf';

    return (
      <motion.div
        key={item.id}
        ref={(el) => el && setItemRef(index, el)}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.3 }}
        className="w-full snap-start relative bg-background mb-4"
      >
        {/* Content */}
        <div className="w-full">
          {isVideo && url ? (
            <video
              ref={(el) => el && videoRefs.current.set(index, el)}
              src={url}
              className="w-full h-auto"
              loop
              playsInline
              muted={isMuted}
              preload="auto"
            />
          ) : isAudio && url ? (
            <div className="w-full flex flex-col items-center gap-6 p-8">
              <div className="w-full max-w-md aspect-square rounded-xl overflow-hidden bg-muted/30">
                {item.thumbnail_path ? (
                  <ImageFallback
                    src={url}
                    alt={item.original_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Volume2 className="w-24 h-24 text-muted-foreground" />
                  </div>
                )}
              </div>
              <audio
                ref={(el) => {
                  if (el) {
                    audioRefs.current.set(index, el);
                  }
                }}
                src={url}
                loop
                muted={isMuted}
                preload="auto"
              />
              <h2 className="text-2xl font-bold text-foreground text-center px-4">{item.original_name}</h2>
            </div>
          ) : isImage && url ? (
            <ImageFallback
              src={url}
              alt={item.original_name}
              className="w-full h-auto object-contain"
            />
          ) : isWeb ? (
            <iframe
              src={item.storage_path}
              className="w-full min-h-[80vh] border-0"
              title={item.original_name}
            />
          ) : isPdf && url ? (
            <iframe
              src={url}
              className="w-full min-h-[80vh] border-0"
              title={item.original_name}
            />
          ) : (
            <div className="w-full text-center p-8">
              <p className="text-muted-foreground">Unsupported file type</p>
            </div>
          )}
        </div>

        {/* Title overlay */}
        <div className="w-full bg-gradient-to-t from-background via-background/80 to-transparent p-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground truncate">
            {item.original_name}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {index + 1} / {items.length}
          </p>
        </div>
      </motion.div>
    );
  };

  if (loading && items.length === 0) {
    return <LoadingState type="infinite" count={3} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Close button */}
      <Button
        onClick={onClose}
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm hover:bg-background/90"
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Controls */}
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <Button
          onClick={togglePlayPause}
          variant="ghost"
          size="icon"
          className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
        >
          {playingIndex >= 0 && videoRefs.current.get(playingIndex)?.paused ? (
            <Play className="h-5 w-5" />
          ) : (
            <Pause className="h-5 w-5" />
          )}
        </Button>
        <Button
          onClick={toggleMute}
          variant="ghost"
          size="icon"
          className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Items */}
      <AnimatePresence mode="wait">
        {displayedItems.map((item, index) => renderItem(item, index))}
      </AnimatePresence>

      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="w-full py-8 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading more...</div>
        </div>
      )}

      {/* End of content */}
      {!hasMore && items.length > 0 && (
        <div className="w-full py-8 flex items-center justify-center text-muted-foreground">
          <p>No more items</p>
        </div>
      )}
    </div>
  );
}
