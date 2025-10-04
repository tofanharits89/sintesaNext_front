"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRenderTracker } from "@/utils/render-tracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Database,
  AlertCircle,
  Loader2,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSavedQueries } from "@/hooks/use-saved-queries";
import { useDebounce } from "@/hooks/use-debounce";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { ErrorFallback, NetworkStatus } from "@/components/ui/error-fallback";
import {
  QueryManagementSkeleton,
  BulkOperationProgress,
} from "@/components/ui/loading-states";
import { handleBulkOperation } from "@/utils/errorHandling";
import {
  savedQueryNotifications,
  savedQueryConfirmations,
  notificationUtils,
} from "@/utils/notifications";
import type { SavedQuery } from "@/types/saved-queries";
import { QueryListItem } from "./query-list-item";

interface QueryManagementProps {
  onLoadQuery: (query: SavedQuery) => void;
  currentUserId: string;
  scope?: "belanja" | "tematik" | "general" | "rkakl_detail" | "kontrak"; // Add scope for filtering queries
  onRefreshReady?: (refreshFn: () => void) => void;
}

interface FilterState {
  search: string;
  dateRange: "all" | "today" | "week" | "month";
  sortBy: "newest" | "oldest" | "name";
}

const ITEMS_PER_PAGE = 10;

export const QueryManagement = React.memo(function QueryManagement({
  onLoadQuery,
  currentUserId,
  scope = "general", // Default to general scope
  onRefreshReady,
}: QueryManagementProps) {
  // Track renders for debugging - only in development
  if (process.env.NODE_ENV === "development") {
    useRenderTracker(
      "QueryManagement",
      { currentUserId },
      {
        maxRenders: 15, // Lower threshold for earlier detection
        timeWindow: 2000, // 2 second window
      }
    );
  }

  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    dateRange: "all",
    sortBy: "newest",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Bulk operations state
  const [selectedQueries, setSelectedQueries] = useState<Set<string>>(
    new Set()
  );
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    completed: number;
    total: number;
    failed: number;
  } | null>(null);

  // Network status
  const { isOnline } = useNetworkStatus();

  // Debounce search input for better performance
  const debouncedSearch = useDebounce(filters.search, 300);

  // Memoize query parameters to prevent infinite loops
  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: debouncedSearch,
      scope, // Include scope for filtering
    }),
    [currentPage, debouncedSearch, scope]
  );

  // Fetch saved queries with pagination and search
  const {
    queries,
    pagination,
    isLoading,
    error,
    refetch,
    updateQuery,
    deleteQuery,
    isUpdating,
    isDeleting,
  } = useSavedQueries(queryParams);

  // Filter and sort queries client-side for additional filtering
  const filteredAndSortedQueries = useMemo(() => {
    let filtered = [...queries];

    // Apply date range filter
    if (filters.dateRange !== "all") {
      const now = new Date();
      const cutoffDate = new Date();

      switch (filters.dateRange) {
        case "today":
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(
        (query) => new Date(query.createdAt) >= cutoffDate
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [queries, filters.dateRange, filters.sortBy]);

  // Event handlers
  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1); // Reset to first page when filtering
    },
    []
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: "",
      dateRange: "all",
      sortBy: "newest",
    });
    setCurrentPage(1);
  }, []);

  const handleEditQuery = useCallback(
    async (id: string, updates: { name?: string; description?: string }) => {
      try {
        await updateQuery(id, updates);
      } catch (error) {
        console.error("Failed to update query:", error);
      }
    },
    [updateQuery]
  );

  const handleDeleteQuery = useCallback(
    async (id: string) => {
      try {
        await deleteQuery(id);
      } catch (error) {
        console.error("Failed to delete query:", error);
      }
    },
    [deleteQuery]
  );

  const handleLoadQuery = useCallback(
    (query: SavedQuery) => {
      try {
        onLoadQuery(query);
        // Show success notification
        savedQueryNotifications.queryLoaded(query.name);
      } catch (error) {
        console.error("Failed to load query:", error);
        toast.error("Gagal memuat query", {
          description: `Query "${query.name}" tidak dapat dimuat`,
        });
      }
    },
    [onLoadQuery]
  );

  // Bulk operations handlers
  const handleSelectQuery = useCallback(
    (queryId: string, selected: boolean) => {
      setSelectedQueries((prev) => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(queryId);
        } else {
          newSet.delete(queryId);
        }
        return newSet;
      });
    },
    []
  );

  const handleSelectAll = useCallback(() => {
    const allQueryIds = new Set(filteredAndSortedQueries.map((q) => q.id));
    setSelectedQueries(allQueryIds);
  }, [filteredAndSortedQueries]);

  const handleSelectNone = useCallback(() => {
    setSelectedQueries(new Set());
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedQueries.size === 0) return;

    setIsBulkDeleting(true);
    setBulkProgress({ completed: 0, total: selectedQueries.size, failed: 0 });

    try {
      const queryIds = Array.from(selectedQueries);
      const queryObjects = queryIds.map((id) => ({
        id,
        name: queries.find((q) => q.id === id)?.name || id,
      }));

      const result = await handleBulkOperation(
        queryObjects,
        async (queryObj) => {
          await deleteQuery(queryObj.id);
        },
        {
          onProgress: (completed, total, failed) => {
            setBulkProgress({ completed, total, failed });
          },
          onItemError: (queryObj, error) => {
            console.error(`Failed to delete query ${queryObj.name}:`, error);
          },
          continueOnError: true,
          showToast: false, // We'll show our own toast
        }
      );

      // Show enhanced result summary
      savedQueryNotifications.bulkOperationSuccess(
        "Penghapusan",
        result.successful.length,
        selectedQueries.size,
        result.failed.length
      );

      setSelectedQueries(new Set());
    } catch (error) {
      console.error("Bulk delete operation failed:", error);
      toast.error("Operasi penghapusan gagal");
    } finally {
      setIsBulkDeleting(false);
      setBulkProgress(null);
    }
  }, [selectedQueries, deleteQuery, queries]);

  // Calculate pagination info
  const totalPages = pagination?.totalPages || 1;
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Bulk operations info
  const selectedCount = selectedQueries.size;
  const allSelected =
    filteredAndSortedQueries.length > 0 &&
    filteredAndSortedQueries.every((q) => selectedQueries.has(q.id));
  const someSelected = selectedCount > 0 && !allSelected;

  // Provide refresh function to parent component
  React.useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(handleRefresh);
    }
  }, [onRefreshReady, handleRefresh]);

  // Automatically refetch data when component mounts or scope changes
  React.useEffect(() => {
    refetch();
  }, [scope, refetch]);

  // Show loading skeleton on initial load
  if (isLoading && queries.length === 0) {
    return <QueryManagementSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Network Status Warning */}
      <NetworkStatus isOnline={isOnline} />

      {/* Sticky Search and Filter Controls */}
      <div className="sticky top-0 z-10 bg-background border-b mb-6">
        <Card className="border-0 border-b rounded-none">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari query berdasarkan nama..."
                    value={filters.search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? "bg-muted" : ""}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  {/* Date Range Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Tanggal Dibuat
                    </label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) =>
                        handleFilterChange("dateRange", e.target.value)
                      }
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="all">Semua Waktu</option>
                      <option value="today">Hari Ini</option>
                      <option value="week">7 Hari Terakhir</option>
                      <option value="month">30 Hari Terakhir</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Urutkan</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) =>
                        handleFilterChange("sortBy", e.target.value)
                      }
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="newest">Terbaru</option>
                      <option value="oldest">Terlama</option>
                      <option value="name">Nama A-Z</option>
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      className="w-full"
                    >
                      Bersihkan Filter
                    </Button>
                  </div>
                </div>
              )}

              {/* Active Filters Display */}
              {(filters.search ||
                filters.dateRange !== "all" ||
                filters.sortBy !== "newest") && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">
                    Filter aktif:
                  </span>
                  {filters.search && (
                    <Badge variant="secondary">
                      Pencarian: "{filters.search}"
                    </Badge>
                  )}
                  {filters.dateRange !== "all" && (
                    <Badge variant="secondary">
                      Tanggal:{" "}
                      {filters.dateRange === "today"
                        ? "Hari Ini"
                        : filters.dateRange === "week"
                        ? "7 Hari"
                        : "30 Hari"}
                    </Badge>
                  )}
                  {filters.sortBy !== "newest" && (
                    <Badge variant="secondary">
                      Urutan:{" "}
                      {filters.sortBy === "oldest" ? "Terlama" : "Nama A-Z"}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scrollable Query List Container */}
      <div className="flex-1 overflow-hidden">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>Daftar Query ({pagination?.total || 0})</span>
                {selectedCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800"
                  >
                    {selectedCount} dipilih
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(isUpdating || isDeleting || isBulkDeleting) && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}

                {/* Bulk operations */}
                {filteredAndSortedQueries.length > 0 && (
                  <div className="flex items-center gap-2">
                    {selectedCount > 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isBulkDeleting}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {isBulkDeleting ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-1" />
                            )}
                            Hapus ({selectedCount})
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <Trash2 className="w-5 h-5 text-red-600" />
                              Hapus Query Terpilih
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus{" "}
                              <strong>{selectedCount} query</strong> yang
                              dipilih?
                              <br />
                              <br />
                              Tindakan ini tidak dapat dibatalkan dan semua
                              query akan dihapus secara permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isBulkDeleting}>
                              Batal
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleBulkDelete}
                              disabled={isBulkDeleting}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              {isBulkDeleting ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Menghapus...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Hapus {selectedCount} Query
                                </>
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={allSelected ? handleSelectNone : handleSelectAll}
                      disabled={isBulkDeleting}
                    >
                      {allSelected ? (
                        <>
                          <Square className="w-4 h-4 mr-1" />
                          Batal Pilih
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-4 h-4 mr-1" />
                          Pilih Semua
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {/* Loading State */}
            {isLoading && queries.length > 0 && (
              <div className="p-6">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600 mr-2" />
                  <span className="text-sm text-muted-foreground">
                    Memuat query...
                  </span>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="p-6">
                <ErrorFallback
                  error={error}
                  onRetry={handleRefresh}
                  title="Gagal Memuat Query"
                  description="Terjadi kesalahan saat memuat daftar query tersimpan."
                  variant={
                    error.message?.includes("network") ||
                    error.message?.includes("connection")
                      ? "network"
                      : error.message?.includes("server") ||
                        error.message?.includes("5")
                      ? "server"
                      : "generic"
                  }
                />
              </div>
            )}

            {/* Bulk Operation Progress */}
            {bulkProgress && (
              <div className="p-6 border-b">
                <BulkOperationProgress
                  completed={bulkProgress.completed}
                  total={bulkProgress.total}
                  failed={bulkProgress.failed}
                  operation="Menghapus query"
                />
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredAndSortedQueries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <Database className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {filters.search || filters.dateRange !== "all"
                    ? "Tidak Ada Query yang Cocok"
                    : "Belum Ada Query Tersimpan"}
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {filters.search || filters.dateRange !== "all"
                    ? "Coba ubah kriteria pencarian atau filter Anda."
                    : "Mulai simpan query dari Query Builder untuk melihatnya di sini."}
                </p>
                {(filters.search || filters.dateRange !== "all") && (
                  <Button onClick={handleClearFilters} variant="outline">
                    Bersihkan Filter
                  </Button>
                )}
              </div>
            )}

            {/* Query List Items */}
            {!isLoading && !error && filteredAndSortedQueries.length > 0 && (
              <div className="divide-y">
                {filteredAndSortedQueries.map((query) => (
                  <div key={query.id} className="flex items-start gap-3">
                    {/* Bulk selection checkbox */}
                    <div className="pt-6 pl-4">
                      <Checkbox
                        checked={selectedQueries.has(query.id)}
                        onCheckedChange={(checked) =>
                          handleSelectQuery(query.id, Boolean(checked))
                        }
                        disabled={isBulkDeleting}
                      />
                    </div>

                    {/* Query item */}
                    <div className="flex-1">
                      <QueryListItem
                        query={query}
                        onEdit={handleEditQuery}
                        onDelete={handleDeleteQuery}
                        onLoad={handleLoadQuery}
                        isUpdating={isUpdating}
                        isDeleting={isDeleting}
                        showBulkActions={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination - Outside scrollable area */}
        {!isLoading && !error && totalPages > 1 && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Halaman {currentPage} dari {totalPages}
                  {pagination && (
                    <span className="ml-2">
                      ({pagination.total} total query)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPrevPage || isLoading}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Sebelumnya
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum =
                        Math.max(1, Math.min(totalPages - 4, currentPage - 2)) +
                        i;
                      if (pageNum > totalPages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pageNum === currentPage ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          disabled={isLoading}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNextPage || isLoading}
                  >
                    Selanjutnya
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
});
