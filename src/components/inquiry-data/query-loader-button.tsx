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
import { formatCalendarDate } from "@/lib/utils";
import type { GetSavedQueriesParams } from "@/types/saved-queries";

// Using built-in date formatting instead of date-fns

interface QueryLoaderButtonProps {
  onLoadQuery: (query: SavedQuery) => Promise<void>;
  onOpenQueryManagement?: () => void;
  hasUnsavedChanges?: boolean;
  disabled?: boolean;
  className?: string;
  scope?: "belanja" | "tematik" | "general" | "rkakl_detail" | "kontrak";
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
      }
    );
  }

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingQueryLoad, setPendingQueryLoad] = useState<SavedQuery | null>(
    null
  );

  // Memoize query parameters to prevent infinite loops
  const queryParams = useMemo<
    (GetSavedQueriesParams & { scope?: QueryLoaderButtonProps["scope"] }) | undefined
  >(() => {
    const trimmed = searchQuery.trim();
    const base: GetSavedQueriesParams & { scope?: QueryLoaderButtonProps["scope"] } = {
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
  } = useSavedQueries(queryParams);

  // Debug log to see what data the dropdown is getting (development only)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 QueryLoaderButton - updated queries:', {
        scope,
        queryCount: queries.length,
        queryNames: queries.map(q => q.name),
        queryParams
      });
    }
  }, [queries, scope, queryParams]);

  
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
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
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
          query.description.toLowerCase().includes(searchLower))
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
    [onLoadQuery]
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
    const year = query.reportParams.tahun;
    const reportType = query.reportParams.tipeLaporan;

    return `${year} • ${reportType} • ${filterCount} filter`;
  }, []);

  // Effect to handle cleanup and prevent stuck states
  React.useEffect(() => {
    // If we have a pending query load but no loading state, something went wrong
    if (pendingQueryLoad && !isLoading) {
      const timeoutId = setTimeout(() => {
        console.log("Cleaning up stuck query load state");
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
      console.log('🔍 QueryLoaderButton - received event:', {
        type: event.type,
        scope: event.scope,
        componentScope: scope
      });

      // Always refresh on any saved query event to show latest data
      console.log('🔍 QueryLoaderButton - refreshing due to event');
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
    [pendingQueryLoad, refetchQueries]
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || isLoading}
          className={`min-w-[180px] justify-between ${className}`}
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
                          (query as any).created_at
                      )}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </ScrollArea>
          </>
        )}

        {/* Force Refresh Option */}
        <DropdownMenuItem
          className="flex items-center gap-2"
          onClick={async () => {
            console.log('🔍 Force refresh triggered');
            
            // Try multiple cache-busting strategies
            const strategies = [
              // Strategy 1: Standard refetch
              () => refetchQueries(),
              
              // Strategy 2: Direct fetch with cache-busting
              async () => {
                const cacheBuster = `_bust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const params = new URLSearchParams({ page: '1', limit: '10', [cacheBuster]: '1', t: String(Date.now()) });
                if (scope) params.set('scope', scope);
                const url = `/api/saved-queries?${params.toString()}`;
                
                try {
                  const response = await fetch(url, {
                    credentials: 'include',
                    headers: {
                      'Cache-Control': 'no-cache, no-store, must-revalidate',
                      'Pragma': 'no-cache',
                      'Expires': '0',
                      'If-None-Match': '*',
                      'If-Modified-Since': new Date(0).toUTCString(),
                    }
                  });
                  
                  const data = await response.json();
                  console.log('🔍 Cache-busting fetch result:', data);
                  return data;
                } catch (error) {
                  console.error('🔍 Cache-busting fetch error:', error);
                  return null;
                }
              },
              
              // Strategy 3: Add random query params multiple times
              async () => {
                for (let i = 0; i < 3; i++) {
                  const random = Date.now() + Math.random();
                  const params = new URLSearchParams({ page: '1', limit: '10', random: String(random), attempt: String(i), t: String(Date.now()) });
                  if (scope) params.set('scope', scope);
                  const url = `/api/saved-queries?${params.toString()}`;
                  
                  try {
                    await fetch(url, {
                      credentials: 'include',
                      headers: { 'Cache-Control': 'no-cache' }
                    });
                    // Small delay between attempts
                    await new Promise(resolve => setTimeout(resolve, 200));
                  } catch (error) {
                    console.error(`🔍 Cache-busting attempt ${i} failed:`, error);
                  }
                }
              }
            ];
            
            // Execute all strategies
            for (const strategy of strategies) {
              await strategy();
            }
            
            // Final refetch to ensure we have the latest cached data in React Query
            await refetchQueries();
            console.log('🔍 All cache-busting strategies completed');
          }}
        >
          <RefreshCw className="w-4 h-4" />
          Force Refresh
        </DropdownMenuItem>

        {/* Try Different Endpoint */}
        <DropdownMenuItem
          className="flex items-center gap-2"
          onClick={async () => {
            console.log('🔍 Trying different endpoints to bypass cache...');
            
            try {
              // Try GET with different parameters to force backend cache invalidation
              const make = (extra: Record<string,string>) => {
                const p = new URLSearchParams({ page: '1', limit: '10', ...extra });
                if (scope) p.set('scope', scope);
                return `/api/saved-queries?${p.toString()}`;
              };
              const endpoints = [
                make({ bypass: '1' }),
                make({ nocache: '1' }),
                make({ fresh: '1' }),
                (() => { const p = new URLSearchParams({ page: '2', limit: '10', t: String(Date.now()) }); if (scope) p.set('scope', scope); return `/api/saved-queries?${p.toString()}`; })(),
                (() => { const p = new URLSearchParams({ page: '1', limit: '5', t: String(Date.now()) }); if (scope) p.set('scope', scope); return `/api/saved-queries?${p.toString()}`; })(),
                (() => { const p = new URLSearchParams({ page: '1', limit: '15', refresh: '1' }); if (scope) p.set('scope', scope); return `/api/saved-queries?${p.toString()}`; })(),
              ];
              
              for (const endpoint of endpoints) {
                try {
                  await fetch(endpoint, {
                    credentials: 'include',
                    headers: {
                      'Cache-Control': 'no-cache, no-store, must-revalidate',
                      'Pragma': 'no-cache'
                    }
                  });
                  console.log('🔍 Tried endpoint:', endpoint);
                  // Small delay between requests
                  await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                  console.error('🔍 Endpoint failed:', endpoint, error);
                }
              }
              
              // Now refetch the original endpoint
              console.log('🔍 Now calling original refetch...');
              await refetchQueries();
              
            } catch (error) {
              console.error('🔍 Different endpoint strategy failed:', error);
            }
          }}
        >
          <AlertCircle className="w-4 h-4" />
          Try Different Endpoints
        </DropdownMenuItem>

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
  }
);
