"use client";

import { useBPSDataLogic } from "./useBPSDataLogic";
import { ParameterSelection } from "./ParameterSelection";
import { DataTable } from "./DataTable";
import { LoadingState } from "./LoadingState";
import { ActionButtons } from "./ActionButtons";

export function DataBPSContent() {
  const {
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
  } = useBPSDataLogic();

  return (
    <>
      <ParameterSelection
        domainList={domainList}
        selectedDomain={selectedDomain}
        variableList={variableList}
        selectedVariable={selectedVariable}
        loadingProgress={loadingProgress}
        isLoading={isLoading}
        onDomainChange={setSelectedDomain}
        onVariableChange={setSelectedVariable}
        onSearchDomains={searchDomains}
        onSearchVariables={searchVariables}
      />

      <ActionButtons
        onSearch={handleSearch}
        loadingResults={isFetching}
        disabled={!selectedVariable || !selectedDomain}
      />

      {isFetching ? (
        <LoadingState />
      ) : fetchedData && selectedVariable ? (
        <DataTable
          data={fetchedData}
          selectedVariable={selectedVariable}
          onExport={handleExport}
        />
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {!bpsKey
              ? "BPS API Key tidak ditemukan"
              : "Silakan pilih Domain dan Variable untuk menampilkan data"}
          </p>
        </div>
      )}
    </>
  );
}
