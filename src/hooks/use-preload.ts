import { useEffect, useRef } from 'react';

export function usePreload(importFunc: () => Promise<any>, trigger: boolean = false) {
  const preloadedRef = useRef(false);

  useEffect(() => {
    if (trigger && !preloadedRef.current) {
      preloadedRef.current = true;
      importFunc().catch(() => {
        preloadedRef.current = false;
      });
    }
  }, [trigger, importFunc]);
}

export function useHoverPreload(importFunc: () => Promise<any>) {
  const preload = () => importFunc().catch(() => {});
  
  return {
    onMouseEnter: preload,
    onFocus: preload,
  };
}
