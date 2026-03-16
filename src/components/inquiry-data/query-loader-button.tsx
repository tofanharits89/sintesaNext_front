"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRenderTracker } from "@/utils/render-tracker";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronDown,
  Search,
  Clock,
  FileText,
  Settings,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useSavedQueries } from "@/hooks/use-saved-queries";
import { ButtonSpinner, InlineSpinner } from "@/components/ui/loading-states";
import { savedQueryEvents } from "@/utils/saved-query-events";
import type { SavedQuery } from "@/types/saved-queries";
import { formatCalendarDate } from "@/lib/utils/utils";
import type { GetSavedQueriesParams } from "@/types/saved-queries";

// Using built-in date formatting instead of date-fns

interface QueryLoaderButtonProps {
  onLoadQuery: (query: SavedQuery) => Promise<void>;
  onOpenQueryManagement?: () => void;
  hasUnsavedChanges?: boolean;
  disabled?: boolean;
  className?: string;
  scope?:
    | "belanja"
    | "tematik"
    | "general"
    | "rkakl_detail"
    | "kontrak"
    | "up_tup"
    | "penerimaan_pnbp"
    | "sp2d"
    | "revisi_dipa";
}

const QueryLoaderButtonComponent = function QueryLoaderButton({
  onLoadQuery,
  onOpenQueryManagement,
  hasUnsavedChanges = false,
  disabled = false,
  className = "",
  scope = "general",
}: QueryLoaderButtonProps) {
  // Track renders for debugging - only in development
  // Note: useRenderTracker is called conditionally but only in development mode
  // This is safe as the condition doesn't change during component lifecycle
  if (process.env.NODE_ENV === "development") {
    useRenderTracker(
      "QueryLoaderButton",
      { hasUnsavedChanges, disabled },
      {
        maxRenders: 20, // Lower threshold for earlier detection
        timeWindow: 2000, // 2 second window
      },
    );
  }

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingQueryLoad, setPendingQueryLoad] = useState<SavedQuery | null>(
    null,
  );

  // Memoize query parameters to prevent infinite loops
  const queryParams = useMemo<
    | (GetSavedQueriesParams & { scope?: QueryLoaderButtonProps["scope"] })
    | undefined
  >(() => {
    const trimmed = searchQuery.trim();
    const base: GetSavedQueriesParams & {
      scope?: QueryLoaderButtonProps["scope"];
    } = {
      limit: 10,
      scope,
    };
    if (trimmed) {
      base.search = trimmed;
    }
    return base;
  }, [searchQuery, scope]);

  // Fetch saved queries with search - enabled even when closed to keep cache fresh
  const {
    queries,
    isLoading: isLoadingQueries,
    error,
    refetch: refetchQueries,
    pagination,
  } = useSavedQueries(queryParams);

  // Get filtered queries - only process when dropdown is open
  const filteredQueries = useMemo(() => {
    if (!queries.length) {
      return [];
    }

    // If no search query, return recent queries (last 5)
    if (!searchQuery.trim()) {
      const recent = [...queries]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 5);

      return recent;
    }

    // Filter queries based on search
    const searchLower = searchQuery.toLowerCase();
    const filtered = queries.filter(
      (query) =>
        query.name.toLowerCase().includes(searchLower) ||
        (query.description &&
          query.description.toLowerCase().includes(searchLower)),
    );

    return filtered;
  }, [queries, searchQuery]);

  const handleLoadQuery = useCallback(
    async (query: SavedQuery) => {
      setIsLoading(true);
      setPendingQueryLoad(query);

      // Close dropdown immediately to prevent interference with modals
      setIsOpen(false);

      try {
        await onLoadQuery(query);
        // Successfully loaded - clear state
        setSearchQuery("");
        setPendingQueryLoad(null);
      } catch (error) {
        console.error("Error loading query:", error);
        // On error, reopen dropdown so user can try again
        setIsOpen(true);
        setPendingQueryLoad(null);
      } finally {
        // Clear loading state immediately, but also set a timeout as backup
        setIsLoading(false);
        // Backup timeout in case something goes wrong
        setTimeout(() => {
          setIsLoading(false);
        }, 200);
      }
    },
    [onLoadQuery],
  );

  const handleOpenQueryManagement = useCallback(() => {
    if (onOpenQueryManagement) {
      onOpenQueryManagement();
      setIsOpen(false);
    }
  }, [onOpenQueryManagement]);

  const formatQueryDate = useCallback((input: any) => {
    try {
      return formatCalendarDate(input);
    } catch {
      return "—";
    }
  }, []);

  const getQuerySummary = useCallback((query: SavedQuery) => {
    const filterCount = query.activeFilters.length;
    const reportParams = query.reportParams || {};
    const year = reportParams.tahun || "N/A";
    const reportType = reportParams.tipeLaporan || "N/A";

    return `${year} • ${reportType} • ${filterCount} filter`;
  }, []);

  // Effect to handle cleanup and prevent stuck states
  React.useEffect(() => {
    // If we have a pending query load but no loading state, something went wrong
    if (pendingQueryLoad && !isLoading) {
      const timeoutId = setTimeout(() => {
        setPendingQueryLoad(null);
        setIsLoading(false);
      }, 5000); // 5 second timeout for stuck states

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [pendingQueryLoad, isLoading]);

  // Effect to listen for saved query events and refresh when relevant
  React.useEffect(() => {
    const unsubscribe = savedQueryEvents.subscribe((event) => {
      // Always refresh on any saved query event to show latest data
      refetchQueries();
    });

    return unsubscribe;
  }, [scope, refetchQueries]);

  // Handle dropdown open/close
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);

      if (open) {
        // Refresh queries when opening dropdown to ensure we have latest data
        refetchQueries();
      } else {
        // Clear search when closing
        setSearchQuery("");
        // Also clear any pending state when manually closing
        if (pendingQueryLoad) {
          setPendingQueryLoad(null);
        }
      }
    },
    [pendingQueryLoad, refetchQueries],
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || isLoading}
          className={`min-w-[180px] justify-between bg-white dark:bg-card hover:bg-zinc-200 ${className}`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>{isLoading ? "Memuat..." : "Muat Query"}</span>
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                *
              </Badge>
            )}
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80" align="end">
        {/* Search Input */}
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari query tersimpan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Loading State */}
        {isLoadingQueries && (
          <div className="flex items-center justify-center py-6">
            <InlineSpinner size="sm" text="Memuat query..." />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-6 px-4">
            <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm text-red-600">Gagal memuat query</span>
          </div>
        )}

        {/* No Queries State */}
        {!isLoadingQueries && !error && filteredQueries.length === 0 && (
          <div className="py-6 px-4 text-center">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery.trim()
                ? "Tidak ada query yang cocok"
                : "Belum ada query tersimpan"}
            </p>
          </div>
        )}

        {/* Query List */}
        {!isLoadingQueries && !error && filteredQueries.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center gap-2">
              {searchQuery.trim() ? (
                <>
                  <Search className="w-4 h-4" />
                  Hasil Pencarian ({filteredQueries.length})
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  Query Terbaru
                </>
              )}
            </DropdownMenuLabel>

            <ScrollArea className="max-h-64">
              {filteredQueries.map((query) => (
                <DropdownMenuItem
                  key={query.id}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  onClick={() => handleLoadQuery(query)}
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-sm truncate flex-1">
                      {query.name}
                    </span>
                    {isLoading && <ButtonSpinner className="w-3 h-3 ml-2" />}
                  </div>

                  {query.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 w-full">
                      {query.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between w-full mt-1">
                    <span className="text-xs text-muted-foreground">
                      {getQuerySummary(query)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatQueryDate(
                        (query as any).updatedAt ??
                          (query as any).updated_at ??
                          (query as any).createdAt ??
                          (query as any).created_at,
                      )}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </ScrollArea>
          </>
        )}

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2 text-xs text-amber-600 bg-amber-50 border-l-2 border-amber-200">
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Ada perubahan yang belum disimpan</span>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Export with React.memo and custom comparison
export const QueryLoaderButton = React.memo(
  QueryLoaderButtonComponent,
  (prevProps, nextProps) => {
    // Compare all props except functions (which may be recreated on every render)
    return (
      prevProps.hasUnsavedChanges === nextProps.hasUnsavedChanges &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.className === nextProps.className
      // Functions are intentionally not compared to prevent infinite loops
      // when parent components recreate them on every render
    );
  },
);
