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
  const crossfadeDuration = 2000; // 2 second crossfade for smoother transitions

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
      console.log('👁️ onVisible callback triggered for index:', index);
      handleItemVisible(index);
    },
    onApproaching: (index) => {
      console.log('🔜 onApproaching callback for index:', index);
      // Pre-start the item SUPER early so it's already playing when visible
      prestartItem(index);
      // Also preload the next item after this one
      if (index + 1 < displayedItems.length) {
        preloadNextItem(index + 1);
      }
    },
    onLeaving: (index) => {
      console.log('👋 onLeaving callback for index:', index);
      // Only stop when completely off screen
      handleItemLeaving(index);
    },
    threshold: 0.01, // Extremely low threshold - trigger as soon as any pixel is visible
    approachThreshold: 0.95, // Start EXTREMELY early - when item is 95% away from viewport
  });

  // Auto-start first item when mounted
  const hasAutoplayedFirst = useRef(false);
  const tryAutoplayFirst = (element: HTMLVideoElement | HTMLAudioElement, index: number) => {
    if (index !== 0 || hasAutoplayedFirst.current) return;
    
    // Wait for element to be ready
    const startPlayback = () => {
      element.muted = true;
      if (element instanceof HTMLAudioElement) {
        element.volume = 0;
      }
      
      const playPromise = element.play();
      if (playPromise) {
        playPromise.then(() => {
          hasAutoplayedFirst.current = true;
          setPlayingIndex(0);
          
          // Apply user mute preference
          element.muted = isMuted;
          
          // Fade in audio if not muted
          if (element instanceof HTMLAudioElement && !isMuted) {
            const fadeIn = setInterval(() => {
              if (element.volume < 0.95) {
                element.volume = Math.min(1, element.volume + 0.1);
              } else {
                element.volume = 1;
                clearInterval(fadeIn);
              }
            }, 100);
          }
        }).catch(() => {
          // If autoplay fails, try again after a short delay
          setTimeout(startPlayback, 100);
        });
      }
    };

    // Start when metadata is loaded
    if (element.readyState >= 2) {
      startPlayback();
    } else {
      element.addEventListener('loadedmetadata', startPlayback, { once: true });
    }
  };

  // Fetch signed URLs - PRIORITIZE FIRST ITEM
  useEffect(() => {
    const fetchSignedUrls = async () => {
      const newUrls = new Map(signedUrls);
      
      // FIRST: Load the first item immediately
      if (displayedItems.length > 0) {
        const firstItem = displayedItems[0];
        if (firstItem.storage_path && !firstItem.is_space && firstItem.file_type !== 'web' && !newUrls.has(firstItem.id)) {
          const path = firstItem.storage_path;
          
          // Check if absolute URL
          if (typeof path === 'string' && /^https?:\/\//i.test(path)) {
            newUrls.set(firstItem.id, path);
          } else if (path.startsWith('space-covers/')) {
            const { data } = supabase.storage
              .from('space-covers')
              .getPublicUrl(path);
            newUrls.set(firstItem.id, data.publicUrl);
          } else {
            // Private bucket - sign URL
            try {
              const norm = path.replace(/^user-files\//, '');
              const { data } = await supabase.storage
                .from('user-files')
                .createSignedUrl(norm, 3600);
              
              if (data?.signedUrl) {
                newUrls.set(firstItem.id, data.signedUrl);
              }
            } catch (error) {
              console.error('Error creating signed URL for first item:', error);
            }
          }
          // Update immediately after first item
          setSignedUrls(new Map(newUrls));
        }
      }
      
      // THEN: Load remaining items in order
      for (let i = 1; i < displayedItems.length; i++) {
        const item = displayedItems[i];
        if (!item.storage_path || item.is_space || item.file_type === 'web' || newUrls.has(item.id)) {
          continue;
        }

        const path = item.storage_path;
        
        // Check if absolute URL
        if (typeof path === 'string' && /^https?:\/\//i.test(path)) {
          newUrls.set(item.id, path);
          continue;
        }
        
        // Check if public bucket
        if (path.startsWith('space-covers/')) {
          const { data } = supabase.storage
            .from('space-covers')
            .getPublicUrl(path);
          newUrls.set(item.id, data.publicUrl);
          continue;
        }

        // Private bucket - sign URL (normalize path)
        try {
          const norm = path.replace(/^user-files\//, '');
          const { data } = await supabase.storage
            .from('user-files')
            .createSignedUrl(norm, 3600);
          
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

  // Preload next item for seamless transition
  const preloadNextItem = (index: number) => {
    const video = videoRefs.current.get(index);
    const audio = audioRefs.current.get(index);
    
    if (video && video.readyState < 2) {
      video.load(); // Just preload, don't play
    }
    
    if (audio && audio.readyState < 2) {
      audio.load(); // Just preload, don't play
    }
  };

  // Pre-start an item (playing muted) well before it enters the viewport
  const prestartItem = (index: number) => {
    const video = videoRefs.current.get(index);
    const audio = audioRefs.current.get(index);

    if (video) {
      console.log('🎬 Prestarting video at index:', index);
      video.muted = true;
      video.currentTime = 0;
      // Start playing early for seamless transition
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(e => console.log('Prestart video failed:', e));
      }
    }

    if (audio) {
      console.log('🎵 Prestarting audio at index:', index);
      audio.muted = true;
      audio.volume = 0;
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(e => console.log('Prestart audio failed:', e));
      }
    }

    // Preload next items
    if (index + 1 < displayedItems.length) {
      preloadNextItem(index + 1);
    }
    if (index + 2 < displayedItems.length) {
      preloadNextItem(index + 2);
    }
  };

  // Handle item leaving viewport - stop playback
  const handleItemLeaving = (index: number) => {
    const video = videoRefs.current.get(index);
    const audio = audioRefs.current.get(index);
    
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };
  // Handle item visibility - autoplay videos and crossfade audio
  const handleItemVisible = (index: number) => {
    console.log('🎬 Item visible:', index);
    const previousIndex = playingIndex;
    setPlayingIndex(index);
    
    // Handle video playback - FORCE play for current item
    const currentVideo = videoRefs.current.get(index);
    if (currentVideo) {
      console.log('🎬 Playing video at index:', index, 'readyState:', currentVideo.readyState);
      
      // Force muted start for autoplay compliance
      currentVideo.muted = true;
      currentVideo.currentTime = 0; // Reset to start
      
      const attemptPlay = () => {
        const playPromise = currentVideo.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('✅ Video playing at index:', index);
            // Apply user's mute preference after successful play
            setTimeout(() => {
              currentVideo.muted = isMuted;
            }, 100);
          }).catch(e => {
            console.error('❌ Video play failed at index:', index, e);
            // Retry
            setTimeout(attemptPlay, 200);
          });
        }
      };
      
      attemptPlay();
    } else {
      console.warn('⚠️ No video element found at index:', index);
    }
    
    // Stop other videos only if they're far away - keep more items playing for smoother experience
    videoRefs.current.forEach((video, idx) => {
      // Keep current, previous 2, and next 3 items playing for seamless transitions
      if (idx < index - 2 || idx > index + 3) {
        if (!video.paused) {
          console.log('⏹️ Stopping video at index:', idx);
          video.pause();
          video.currentTime = 0;
        }
      }
    });

    // Handle audio crossfade - smooth transition between tracks
    const currentAudio = audioRefs.current.get(index);
    const previousAudio = audioRefs.current.get(previousIndex);

    // Start fading out previous audio immediately
    if (previousAudio && previousIndex !== index && !previousAudio.paused) {
      const startVolume = previousAudio.volume;
      const fadeSteps = 40; // More steps for smoother fade
      const stepDuration = crossfadeDuration / fadeSteps;
      let step = 0;
      
      const fadeOutInterval = setInterval(() => {
        step++;
        const progress = step / fadeSteps;
        previousAudio.volume = Math.max(0, startVolume * (1 - progress));
        
        if (progress >= 1) {
          previousAudio.volume = 0;
          previousAudio.pause();
          previousAudio.currentTime = 0;
          clearInterval(fadeOutInterval);
        }
      }, stepDuration);
    }

    // Start fading in current audio
    if (currentAudio) {
      currentAudio.volume = 0;
      currentAudio.muted = false;
      currentAudio.currentTime = 0;
      
      const attemptPlayAudio = () => {
        const playPromise = currentAudio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('✅ Audio playing at index:', index);
            
            if (!isMuted) {
              const fadeSteps = 40; // More steps for smoother fade
              const stepDuration = crossfadeDuration / fadeSteps;
              let step = 0;
              
              const fadeInInterval = setInterval(() => {
                step++;
                const progress = step / fadeSteps;
                // Ease-in curve for more natural fade
                currentAudio.volume = Math.min(1, progress * progress);
                
                if (progress >= 1) {
                  currentAudio.volume = 1;
                  clearInterval(fadeInInterval);
                }
              }, stepDuration);
            } else {
              currentAudio.muted = true;
            }
          }).catch(e => {
            console.error('❌ Audio play failed:', e);
            currentAudio.muted = true;
            currentAudio.play().catch(console.error);
          });
        }
      };
      
      attemptPlayAudio();
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
        try { video.muted = newMuted; } catch {}
      });
      audioRefs.current.forEach(audio => {
        try { audio.muted = newMuted; } catch {}
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
    
    // Check if item needs a URL and if it's loaded yet
    const needsUrl = ['video', 'audio', 'image', 'document'].includes(item.file_type);
    const isUrlReady = !needsUrl || !!url;

    return (
      <motion.div
        key={item.id}
        ref={(el) => {
          if (el) {
            console.log('📍 Setting ref for item index:', index, 'name:', item.original_name);
            setItemRef(index, el);
          }
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="w-full snap-start relative bg-background min-h-screen transition-opacity duration-700"
      >
        {/* Content */}
        <div className="w-full min-h-screen flex items-center justify-center">
          {!isUrlReady ? (
            <LoadingState type="infinite" count={1} />
          ) : isVideo && url ? (
            <video
              ref={(el) => {
                if (el) {
                  videoRefs.current.set(index, el);
                  tryAutoplayFirst(el, index);
                }
              }}
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
                    tryAutoplayFirst(el, index);
                  }
                }}
                src={url}
                loop
                muted={isMuted}
                preload="auto"
              />
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
          ) : null}
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
      <AnimatePresence>
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
