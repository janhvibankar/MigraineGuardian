import { useState, useEffect } from 'react';

/**
 * Custom hook to match media queries cleanly.
 * @param {string} query CSS media query string, e.g. '(min-width: 1024px)'
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useIsMobile() {
  return !useMediaQuery('(min-width: 768px)');
}

export function useIsTablet() {
  const isAboveMobile = useMediaQuery('(min-width: 768px)');
  const isBelowDesktop = !useMediaQuery('(min-width: 1024px)');
  return isAboveMobile && isBelowDesktop;
}
