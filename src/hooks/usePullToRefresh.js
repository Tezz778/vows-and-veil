import { useEffect, useRef, useState } from 'react';

/**
 * Mobile pull-to-refresh hook. Attaches touch listeners to the window
 * and invokes `onRefresh` when the user drags down past the threshold
 * while scrolled to the top. Returns the current pull distance and
 * refreshing state for rendering an indicator.
 */
export function usePullToRefresh(onRefresh, { threshold = 70, maxPull = 120 } = {}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const pullDistRef = useRef(0);
  const refreshingRef = useRef(false);
  const refreshRef = useRef(onRefresh);

  useEffect(() => { refreshRef.current = onRefresh; }, [onRefresh]);

  useEffect(() => {
    const onTouchStart = (e) => {
      if (window.scrollY > 0 || refreshingRef.current) return;
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    };

    const onTouchMove = (e) => {
      if (!pullingRef.current || refreshingRef.current) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta > 0 && window.scrollY <= 0) {
        const distance = Math.min(delta * 0.5, maxPull);
        pullDistRef.current = distance;
        setPullDistance(distance);
      }
    };

    const onTouchEnd = async () => {
      if (!pullingRef.current) return;
      pullingRef.current = false;
      if (pullDistRef.current >= threshold) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPullDistance(threshold);
        try {
          await refreshRef.current();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          setPullDistance(0);
          pullDistRef.current = 0;
        }
      } else {
        setPullDistance(0);
        pullDistRef.current = 0;
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [threshold, maxPull]);

  return { pullDistance, refreshing };
}