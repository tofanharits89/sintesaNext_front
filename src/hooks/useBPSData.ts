import { useEffect, useCallback, useRef } from "react";
import {
  useBPSDomainList,
  useBPSSelectedDomain,
  useBPSVariableList,
  useBPSSelectedVariable,
  useBPSFetchedData,
  useBPSIsLoading,
  useBPSIsFetching,
  useBPSPulse,
  useBPSVariableLoadingProgress,
  useBPSFetchAllDomains,
  useBPSResetVariableData,
  useBPSFetchInitialVariables,
  useBPSDataStore,
} from "@/stores";

/**
 * Custom hook that encapsulates BPS data initialization logic
 * Prevents infinite loops by using stable action references
 */
export const useBPSInitialization = () => {
  const domainList = useBPSDomainList();
  const selectedDomain = useBPSSelectedDomain();

  // Track initialization to prevent multiple calls
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only fetch domains once when component mounts and no domains exist
    if (domainList.length === 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      // Call fetchAllDomains directly without dependency
      useBPSDataStore.getState().fetchAllDomains();
    }
  }, [domainList.length]); // Only depend on domainList.length

  useEffect(() => {
    // Reset variable data when domain changes
    if (selectedDomain) {
      useBPSDataStore.getState().resetVariableData();
      useBPSDataStore.getState().fetchInitialVariables();
    }
  }, [selectedDomain]); // Only depend on selectedDomain
};

/**
 * Custom hook that manages loading states and animations
 * The pulse animation is now handled internally by the store
 */
export const useBPSLoadingEffects = () => {
  // The store now handles pulse animation internally when setIsFetching is called
  // No additional effects needed here
  // This hook is kept for API consistency and future enhancements
};

/**
 * Custom hook that provides all BPS data in a single hook
 * Uses only Zustand selectors to avoid getState() issues
 */
export const useBPSData = () => {
  // State selectors - these are stable and won't cause infinite loops
  const domainList = useBPSDomainList();
  const selectedDomain = useBPSSelectedDomain();
  const variableList = useBPSVariableList();
  const selectedVariable = useBPSSelectedVariable();
  const fetchedData = useBPSFetchedData();
  const isLoading = useBPSIsLoading();
  const isFetching = useBPSIsFetching();
  const pulse = useBPSPulse();
  const variableProgress = useBPSVariableLoadingProgress();

  // Get actions individually to ensure stable references
  const setSelectedDomain = useBPSDataStore((state) => state.setSelectedDomain);
  const setSelectedVariable = useBPSDataStore((state) => state.setSelectedVariable);
  const fetchVariableData = useBPSDataStore((state) => state.fetchVariableData);
  const searchDomains = useBPSDataStore((state) => state.searchDomains);
  const searchVariables = useBPSDataStore((state) => state.searchVariables);
  const exportToExcel = useBPSDataStore((state) => state.exportToExcel);
  const fetchAllDomains = useBPSFetchAllDomains();
  const resetVariableData = useBPSResetVariableData();
  const fetchInitialVariables = useBPSFetchInitialVariables();

  // Get BPS key directly from store state
  const bpsKey = useBPSDataStore((state) => state.bpsKey);

  // Return a stable object with all data and actions
  return {
    // State
    domainList,
    selectedDomain,
    variableList,
    selectedVariable,
    fetchedData,
    isLoading,
    isFetching,
    pulse,
    variableProgress,
    bpsKey,

    // Actions - stable references from Zustand
    actions: {
      setSelectedDomain,
      setSelectedVariable,
      fetchVariableData,
      searchDomains,
      searchVariables,
      exportToExcel,
      fetchAllDomains,
      resetVariableData,
      fetchInitialVariables,
    },
  };
};