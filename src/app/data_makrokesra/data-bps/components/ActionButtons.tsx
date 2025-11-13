"use client";

import { Search } from "lucide-react";

interface ActionButtonsProps {
  onSearch: () => void;
  loadingResults: boolean;
  disabled?: boolean;
}

export function ActionButtons({
  onSearch,
  loadingResults,
  disabled = false,
}: ActionButtonsProps) {
  return (
    <div className="flex justify-center">
      <div className="flex gap-2">
        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          onClick={onSearch}
          disabled={loadingResults || disabled}
        >
          {loadingResults ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Tayang
            </>
          )}
        </button>
      </div>
    </div>
  );
}