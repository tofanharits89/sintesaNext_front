import { useState, useEffect } from 'react';

export function useDynamicImport<T>(
  importFunc: () => Promise<{ default: T }>,
  deps: any[] = []
) {
  const [component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    setLoading(true);
    setError(null);
    
    importFunc()
      .then((module) => {
        if (!cancelled) {
          setComponent(module.default);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, deps);

  return { component, loading, error };
}
