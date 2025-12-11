import { useRef, useEffect, useState, useCallback } from 'react';

interface SpringConfig {
  tension: number;
  friction: number;
  mass: number;
}

interface ElasticScrollOptions {
  springConfig?: SpringConfig;
  elasticity?: number;
  resistance?: number;
}

const DEFAULT_SPRING_CONFIG: SpringConfig = {
  tension: 180,
  friction: 12,
  mass: 1,
};

// Rubber band formula - diminishing returns as you stretch further
const rubberBand = (distance: number, dimension: number, constant = 0.55): number => {
  if (distance === 0) return 0;
  const sign = distance < 0 ? -1 : 1;
  const absDistance = Math.abs(distance);
  return sign * (absDistance * dimension * constant) / (dimension + constant * absDistance);
};

export function useElasticScroll<T extends HTMLElement>(
  options: ElasticScrollOptions = {}
) {
  const {
    springConfig = DEFAULT_SPRING_CONFIG,
    elasticity = 0.55,
    resistance = 0.003,
  } = options;

  const containerRef = useRef<T>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll state
  const scrollPositionRef = useRef(0);
  const velocityRef = useRef(0);
  const elasticOffsetRef = useRef(0);

  // Animation state
  const animationFrameRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  const lastTimeRef = useRef(0);

  // Touch tracking
  const touchStartRef = useRef(0);
  const touchScrollStartRef = useRef(0);
  const isTouchingRef = useRef(false);

  // For re-rendering when elastic offset changes visually
  const [elasticOffset, setElasticOffset] = useState(0);

  const getScrollBounds = useCallback(() => {
    if (!containerRef.current || !contentRef.current) {
      return { min: 0, max: 0, viewportHeight: 0 };
    }
    const containerHeight = containerRef.current.clientHeight;
    const contentHeight = contentRef.current.scrollHeight;
    const maxScroll = Math.max(0, contentHeight - containerHeight);
    return {
      min: 0,
      max: maxScroll,
      viewportHeight: containerHeight,
    };
  }, []);

  const clampScroll = useCallback((scroll: number) => {
    const { min, max } = getScrollBounds();
    return Math.max(min, Math.min(max, scroll));
  }, [getScrollBounds]);

  const getOverscroll = useCallback((scroll: number) => {
    const { min, max } = getScrollBounds();
    if (scroll < min) return scroll - min;
    if (scroll > max) return scroll - max;
    return 0;
  }, [getScrollBounds]);

  // Spring physics animation
  const animateSpring = useCallback(() => {
    const currentTime = performance.now();
    const deltaTime = lastTimeRef.current ? (currentTime - lastTimeRef.current) / 1000 : 0.016;
    lastTimeRef.current = currentTime;

    const { tension, friction, mass } = springConfig;

    // Spring force toward 0 elastic offset
    const springForce = -tension * elasticOffsetRef.current;
    const dampingForce = -friction * velocityRef.current;
    const acceleration = (springForce + dampingForce) / mass;

    velocityRef.current += acceleration * deltaTime;
    elasticOffsetRef.current += velocityRef.current * deltaTime;

    // Stop animation when settled
    if (Math.abs(elasticOffsetRef.current) < 0.5 && Math.abs(velocityRef.current) < 0.5) {
      elasticOffsetRef.current = 0;
      velocityRef.current = 0;
      isAnimatingRef.current = false;
      setElasticOffset(0);
      return;
    }

    setElasticOffset(elasticOffsetRef.current);
    animationFrameRef.current = requestAnimationFrame(animateSpring);
  }, [springConfig]);

  const startSpringAnimation = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    lastTimeRef.current = 0;
    animateSpring();
  }, [animateSpring]);

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isAnimatingRef.current = false;
  }, []);

  // Handle wheel events
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    const delta = e.deltaY;
    const { viewportHeight } = getScrollBounds();

    // Calculate new scroll position
    let newScroll = scrollPositionRef.current + delta;
    const overscroll = getOverscroll(newScroll);

    if (overscroll !== 0) {
      // Apply rubber band effect when overscrolling
      const clampedScroll = clampScroll(newScroll);
      const elasticAmount = rubberBand(overscroll, viewportHeight, elasticity);

      scrollPositionRef.current = clampedScroll;
      elasticOffsetRef.current = elasticAmount;
      velocityRef.current = delta * 0.1; // Store some velocity for spring

      setElasticOffset(elasticAmount);

      // Start spring animation to bounce back
      stopAnimation();
      startSpringAnimation();
    } else {
      // Normal scrolling
      scrollPositionRef.current = newScroll;
      elasticOffsetRef.current = 0;
      setElasticOffset(0);
    }

    // Apply scroll position to content
    if (contentRef.current) {
      contentRef.current.style.transform = `translateY(${-scrollPositionRef.current + elasticOffsetRef.current}px)`;
    }
  }, [getScrollBounds, getOverscroll, clampScroll, elasticity, stopAnimation, startSpringAnimation]);

  // Handle touch events
  const handleTouchStart = useCallback((e: TouchEvent) => {
    stopAnimation();
    isTouchingRef.current = true;
    touchStartRef.current = e.touches[0].clientY;
    touchScrollStartRef.current = scrollPositionRef.current;
    velocityRef.current = 0;
  }, [stopAnimation]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isTouchingRef.current) return;
    e.preventDefault();

    const touchY = e.touches[0].clientY;
    const delta = touchStartRef.current - touchY;
    const { viewportHeight } = getScrollBounds();

    let newScroll = touchScrollStartRef.current + delta;
    const overscroll = getOverscroll(newScroll);

    if (overscroll !== 0) {
      // Apply rubber band while dragging
      const clampedScroll = clampScroll(newScroll);
      const elasticAmount = rubberBand(overscroll, viewportHeight, elasticity);

      scrollPositionRef.current = clampedScroll;
      elasticOffsetRef.current = elasticAmount;
      setElasticOffset(elasticAmount);
    } else {
      scrollPositionRef.current = newScroll;
      elasticOffsetRef.current = 0;
      setElasticOffset(0);
    }

    // Track velocity for momentum
    velocityRef.current = delta * 0.5;

    if (contentRef.current) {
      contentRef.current.style.transform = `translateY(${-scrollPositionRef.current + elasticOffsetRef.current}px)`;
    }
  }, [getScrollBounds, getOverscroll, clampScroll, elasticity]);

  const handleTouchEnd = useCallback(() => {
    isTouchingRef.current = false;

    // If we have elastic offset, spring back
    if (Math.abs(elasticOffsetRef.current) > 0.5) {
      startSpringAnimation();
    }
  }, [startSpringAnimation]);

  // Programmatic scroll to position
  const scrollTo = useCallback((position: number, animated = true) => {
    stopAnimation();
    const clampedPosition = clampScroll(position);

    if (animated) {
      // Animate to position
      const startPosition = scrollPositionRef.current;
      const distance = clampedPosition - startPosition;
      const duration = 300;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        scrollPositionRef.current = startPosition + distance * eased;

        if (contentRef.current) {
          contentRef.current.style.transform = `translateY(${-scrollPositionRef.current}px)`;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    } else {
      scrollPositionRef.current = clampedPosition;
      if (contentRef.current) {
        contentRef.current.style.transform = `translateY(${-scrollPositionRef.current}px)`;
      }
    }
  }, [clampScroll, stopAnimation]);

  // Scroll to center
  const scrollToCenter = useCallback((animated = true) => {
    const { max } = getScrollBounds();
    scrollTo(max / 2, animated);
  }, [getScrollBounds, scrollTo]);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      stopAnimation();
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, stopAnimation]);

  // Update transform when elastic offset changes from animation
  useEffect(() => {
    if (contentRef.current && isAnimatingRef.current) {
      contentRef.current.style.transform = `translateY(${-scrollPositionRef.current + elasticOffsetRef.current}px)`;
    }
  }, [elasticOffset]);

  return {
    containerRef,
    contentRef,
    scrollTo,
    scrollToCenter,
    elasticOffset,
    getScrollPosition: () => scrollPositionRef.current,
  };
}

export default useElasticScroll;
