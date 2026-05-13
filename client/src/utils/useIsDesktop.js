import { useState, useEffect } from 'react';

// Treat anything 768px and wider as "desktop" (iPad portrait, tablets, laptops, monitors).
// Phones and small Androids stay below this and keep the mobile app shell.
const QUERY = '(min-width: 768px)';

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = (e) => setIsDesktop(e.matches);
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  return isDesktop;
}
