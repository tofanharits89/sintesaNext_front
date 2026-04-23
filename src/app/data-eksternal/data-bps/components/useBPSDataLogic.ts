"use client";

import { useEffect } from "react";
import {
  useBPSDomainList,
  useBPSSelectedDomain,
  useBPSVariableList,
  useBPSSelectedVariable,
  useBPSFetchedData,
  useBPSIsLoading,
  useBPSIsFetching,
  useBPSVariableLoadingProgress,
  useBPSDataStore,
  useBPSSetSelectedDomain,
  useBPSSetSelectedVariable,
  useBPSFetchVariableData,
  useBPSSearchDomains,
  useBPSSearchVariables,
  useBPSExportToExcel,
} from "@/stores";

export function useBPSDataLogic() {
  // Data selectors
  const domainList = useBPSDomainList();
  const selectedDomain = useBPSSelectedDomain();
  const variableList = useBPSVariableList();
  const selectedVariable = useBPSSelectedVariable();
  const fetchedData = useBPSFetchedData();
  const isLoading = useBPSIsLoading();
  const isFetching = useBPSIsFetching();
  const loadingProgress = useBPSVariableLoadingProgress();
  const bpsKey = useBPSDataStore((state) => state.bpsKey);

  // Action selectors
  const setSelectedDomain = useBPSSetSelectedDomain();
  const setSelectedVariable = useBPSSetSelectedVariable();
  const fetchVariableData = useBPSFetchVariableData();
  const searchDomains = useBPSSearchDomains();
  const searchVariables = useBPSSearchVariables();
  const exportToExcel = useBPSExportToExcel();

  // Store actions for internal use
  const resetVariableData = useBPSDataStore((state) => state.resetVariableData);
  const fetchAllDomains = useBPSDataStore((state) => state.fetchAllDomains);
  const fetchInitialVariables = useBPSDataStore((state) => state.fetchInitialVariables);

  // Initialize data on mount
  useEffect(() => {
    if (domainList.length === 0) {
      fetchAllDomains();
    }
  }, [fetchAllDomains]);

  // Handle domain changes
  useEffect(() => {
    if (selectedDomain) {
      resetVariableData();
      fetchInitialVariables();
    }
  }, [selectedDomain, resetVariableData, fetchInitialVariables]);

  // Action handlers
  const handleSearch = () => {
    fetchVariableData();
  };

  const handleExport = () => {
    exportToExcel();
  };

  return {
    // Data
    domainList,
    selectedDomain,
    variableList,
    selectedVariable,
    fetchedData,
    bpsKey,

    // Loading states
    isLoading,
    isFetching,
    loadingProgress,

    // Actions
    setSelectedDomain,
    setSelectedVariable,
    handleSearch,
    handleExport,
    searchDomains,
    searchVariables,
  };
}
