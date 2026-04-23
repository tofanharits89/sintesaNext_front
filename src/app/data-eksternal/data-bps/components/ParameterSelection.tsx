"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "./SearchableSelect";

interface SelectOption {
  value: string;
  label: string;
}

interface LoadingProgress {
  totalPages: number;
  loadedPages: number;
  isComplete: boolean;
}

interface ParameterSelectionProps {
  domainList: SelectOption[];
  selectedDomain: string | null;
  variableList: SelectOption[];
  selectedVariable: string | null;
  loadingProgress: LoadingProgress;
  isLoading: boolean;
  onDomainChange: (value: string | null) => void;
  onVariableChange: (value: string | null) => void;
  onSearchDomains: (query: string, signal?: AbortSignal) => Promise<SelectOption[]>;
  onSearchVariables: (query: string, signal?: AbortSignal) => Promise<SelectOption[]>;
}

export function ParameterSelection({
  domainList,
  selectedDomain,
  variableList,
  selectedVariable,
  loadingProgress,
  isLoading,
  onDomainChange,
  onVariableChange,
  onSearchDomains,
  onSearchVariables,
}: ParameterSelectionProps) {
  const { totalPages, loadedPages, isComplete } = loadingProgress;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Pilih Parameter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <SearchableSelect
              label="Domain"
              value={selectedDomain}
              onChange={onDomainChange}
              disabled={domainList.length === 0 || isLoading}
              isLoading={isLoading}
              onSearch={onSearchDomains}
              initialOptions={domainList}
            />

            {isLoading && domainList.length === 0 && (
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" />
                <span>Sedang memuat daftar domain dari BPS...</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <SearchableSelect
              label="Variable"
              value={selectedVariable}
              onChange={onVariableChange}
              disabled={!selectedDomain || isLoading}
              isLoading={isLoading}
              onSearch={onSearchVariables}
              initialOptions={variableList}
            />

            {/* Loading progress indicator */}
            {!isComplete && selectedDomain && (
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" />
                <span>
                  Loading variables: {loadedPages}/{totalPages} pages
                  ({Math.round((loadedPages / totalPages) * 100)}%)
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
