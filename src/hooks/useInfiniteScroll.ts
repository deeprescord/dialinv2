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
  threshold?: number;
}

export function useItemVisibility({
  onVisible,
  threshold = 0.5,
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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = elements.find(([_, el]) => el === entry.target)?.[0];
            if (index !== undefined) {
              setVisibleIndex(index);
              onVisible?.(index);
            }
          }
        });
      },
      { threshold }
    );

    elements.forEach(([_, element]) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [onVisible, threshold]);

  return { setItemRef, visibleIndex };
}
