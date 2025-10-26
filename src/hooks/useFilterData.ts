"use client";

import { useMemo, useState, useCallback } from 'react';
import { FilterDataService } from '@/services/FilterDataService';
import { Option } from '@/types/filters';

const filterDataService = new FilterDataService();

export function useFilterData() {
  const [loading, setLoading] = useState<Set<string>>(new Set());

  const getFilterOptions = useCallback(async (
    type: string, 
    dependencies?: Record<string, string>
  ): Promise<Option[]> => {
    setLoading(prev => new Set(prev).add(type));
    
    try {
      const options = await filterDataService.getFilterOptions(type, dependencies);
      return options;
    } finally {
      setLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(type);
        return newSet;
      });
    }
  }, []);

  const clearCache = useCallback((type?: string) => {
    filterDataService.clearCache(type);
  }, []);

  const isLoading = useCallback((type: string) => {
    return loading.has(type);
  }, [loading]);

  const result = useMemo(() => ({
    getFilterOptions,
    clearCache,
    isLoading,
  }), [getFilterOptions, clearCache, isLoading]);

  return result;
}
