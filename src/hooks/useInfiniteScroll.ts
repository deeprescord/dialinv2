import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

export function useInfiniteScroll({
  threshold = 0.5,
  rootMargin = '200px',
  onLoadMore,
  hasMore = true,
  isLoading = false,
}: UseInfiniteScrollOptions) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || !onLoadMore || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoading, threshold, rootMargin]);

  return { loadMoreRef };
}

interface UseItemVisibilityOptions {
  onVisible?: (index: number) => void;
  onApproaching?: (index: number) => void;
  onLeaving?: (index: number) => void;
  threshold?: number;
  approachThreshold?: number;
}

export function useItemVisibility({
  onVisible,
  onApproaching,
  onLeaving,
  threshold = 0.5,
  approachThreshold = 0.1,
}: UseItemVisibilityOptions) {
  const [visibleIndex, setVisibleIndex] = useState<number>(-1);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const setItemRef = useCallback((index: number, element: HTMLDivElement | null) => {
    if (element) {
      itemRefs.current.set(index, element);
    } else {
      itemRefs.current.delete(index);
    }
  }, []);

  useEffect(() => {
    const elements = Array.from(itemRefs.current.entries());
    if (elements.length === 0) return;

    // Main visibility observer for current item
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = elements.find(([_, el]) => el === entry.target)?.[0];
          if (index === undefined) return;

          if (entry.isIntersecting) {
            setVisibleIndex(index);
            onVisible?.(index);
          } else {
            // Item is leaving the viewport
            onLeaving?.(index);
          }
        });
      },
      { threshold }
    );

    // Approaching observer for next item preloading
    const approachingObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = elements.find(([_, el]) => el === entry.target)?.[0];
            if (index !== undefined) {
              onApproaching?.(index);
            }
          }
        });
      },
      { 
        threshold: approachThreshold,
        rootMargin: '20px 0px 0px 0px' // Start when item is just 20px away from viewport
      }
    );

    elements.forEach(([_, element]) => {
      visibilityObserver.observe(element);
      approachingObserver.observe(element);
    });

    return () => {
      visibilityObserver.disconnect();
      approachingObserver.disconnect();
    };
  }, [onVisible, onApproaching, onLeaving, threshold, approachThreshold]);

  return { setItemRef, visibleIndex };
}
