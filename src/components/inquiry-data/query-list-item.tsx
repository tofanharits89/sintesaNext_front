"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Edit2,
  Trash2,
  Play,
  Save,
  X,
  Calendar,
  Filter,
  Settings,
  Loader2,
  AlertTriangle,
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
} from "@/components/animate-ui/components/radix/alert-dialog";
import { ButtonSpinner, LoadingOverlay } from "@/components/ui/loading-states";
import {
  savedQueryNotifications,
  savedQueryConfirmations,
} from "@/utils/notifications";
import type { SavedQuery } from "@/types/saved-queries";
import { formatCalendarDate } from "@/lib/utils/utils"; // now exported here

interface QueryListItemProps {
  query: SavedQuery;
  onEdit: (
    id: string,
    updates: { name?: string; description?: string }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLoad: (query: SavedQuery) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
  showBulkActions?: boolean;
}

interface EditState {
  isEditing: boolean;
  name: string;
  description: string;
  originalName: string;
  originalDescription: string;
}

export function QueryListItem({
  query,
  onEdit,
  onDelete,
  onLoad,
  isUpdating = false,
  isDeleting = false,
  showBulkActions = true,
}: QueryListItemProps) {
  const [editState, setEditState] = useState<EditState>({
    isEditing: false,
    name: query.name,
    description: query.description || "",
    originalName: query.name,
    originalDescription: query.description || "",
  });
  const [isLocalUpdating, setIsLocalUpdating] = useState(false);
  const [isLocalDeleting, setIsLocalDeleting] = useState(false);

  // Use shared fixed calendar-like date formatting
  const formatDate = useCallback((input: any) => {
    try {
      return formatCalendarDate(input);
    } catch {
      return "—";
    }
  }, []);

  // Start editing mode
  const handleStartEdit = useCallback(() => {
    setEditState((prev) => ({
      ...prev,
      isEditing: true,
      name: query.name,
      description: query.description || "",
      originalName: query.name,
      originalDescription: query.description || "",
    }));
  }, [query.name, query.description]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditState((prev) => ({
      ...prev,
      isEditing: false,
      name: prev.originalName,
      description: prev.originalDescription,
    }));
  }, []);

  // Save changes
  const handleSaveEdit = useCallback(async () => {
    const trimmedName = editState.name.trim();
    const trimmedDescription = editState.description.trim();

    // Validation
    if (!trimmedName) {
      toast.error("Nama query tidak boleh kosong");
      return;
    }

    // Check if anything changed
    const nameChanged = trimmedName !== editState.originalName;
    const descriptionChanged =
      trimmedDescription !== editState.originalDescription;

    if (!nameChanged && !descriptionChanged) {
      setEditState((prev) => ({ ...prev, isEditing: false }));
      return;
    }

    setIsLocalUpdating(true);

    try {
      const updates: { name?: string; description?: string } = {};

      if (nameChanged) {
        updates.name = trimmedName;
      }

      if (descriptionChanged) {
        updates.description = trimmedDescription;
      }

      await onEdit(query.id, updates);

      // Update local state
      setEditState((prev) => ({
        ...prev,
        isEditing: false,
        originalName: trimmedName,
        originalDescription: trimmedDescription,
      }));

      // Show enhanced success notification
      savedQueryNotifications.queryUpdated(trimmedName);
    } catch (error) {
      console.error("Failed to update query:", error);
      toast.error("Gagal memperbarui query");

      // Reset to original values on error
      setEditState((prev) => ({
        ...prev,
        name: prev.originalName,
        description: prev.originalDescription,
      }));
    } finally {
      setIsLocalUpdating(false);
    }
  }, [editState, onEdit, query.id]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    setIsLocalDeleting(true);

    try {
      await onDelete(query.id);

      // Show enhanced success notification with potential undo
      savedQueryNotifications.queryDeleted(query.name, {
        label: "Batalkan",
        onUndo: async () => {
          // This would require implementing an undo mechanism
          // For now, just show that undo was attempted
          console.log("Undo delete for query:", query.name);
          throw new Error("Undo functionality not yet implemented");
        },
        timeout: 8000,
      });
    } catch (error) {
      console.error("Failed to delete query:", error);
      toast.error("Gagal menghapus query", {
        description: `Query "${query.name}" tidak dapat dihapus`,
      });
    } finally {
      setIsLocalDeleting(false);
    }
  }, [onDelete, query.id, query.name]);

  // Handle load query
  const handleLoad = useCallback(() => {
    try {
      onLoad(query);
      // Success notification is handled by the parent component
    } catch (error) {
      console.error("Failed to load query:", error);
      toast.error("Gagal memuat query", {
        description: `Query "${query.name}" tidak dapat dimuat`,
      });
    }
  }, [onLoad, query]);

  // Check if operations are in progress
  const isOperationInProgress =
    isUpdating || isDeleting || isLocalUpdating || isLocalDeleting;

  return (
    <div
      className={`relative p-6 hover:bg-muted/30 transition-colors ${isOperationInProgress ? "opacity-60" : ""
        }`}
    >
      <LoadingOverlay
        isVisible={
          isOperationInProgress && (isLocalUpdating || isLocalDeleting)
        }
        text={
          isLocalUpdating
            ? "Memperbarui..."
            : isLocalDeleting
              ? "Menghapus..."
              : "Memproses..."
        }
        className="rounded-md"
      />

      <div className="space-y-4">
        {/* Header with name and actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editState.isEditing ? (
              <div className="space-y-3">
                <div>
                  <Input
                    value={editState.name}
                    onChange={(e) =>
                      setEditState((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Nama query"
                    className="font-medium"
                    disabled={isLocalUpdating}
                  />
                </div>
                <div>
                  <Textarea
                    value={editState.description}
                    onChange={(e) =>
                      setEditState((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Deskripsi query (opsional)"
                    rows={2}
                    disabled={isLocalUpdating}
                  />
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-medium text-lg truncate">{query.name}</h3>
                {query.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {query.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {editState.isEditing ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isLocalUpdating || !editState.name.trim()}
                >
                  {isLocalUpdating ? (
                    <ButtonSpinner />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isLocalUpdating}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={handleLoad}
                  disabled={isOperationInProgress}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Muat
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStartEdit}
                  disabled={isOperationInProgress}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isOperationInProgress}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {isLocalDeleting ? (
                        <ButtonSpinner />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Hapus Query
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus query{" "}
                        <strong>"{query.name}"</strong>?
                        <br />
                        <br />
                        Tindakan ini tidak dapat dibatalkan dan query akan
                        dihapus secara permanen.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isLocalDeleting}>
                        Batal
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isLocalDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isLocalDeleting ? (
                          <>
                            <ButtonSpinner className="mr-2" />
                            Menghapus...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus Query
                          </>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        {/* Query metadata */}
        {!editState.isEditing && (
          <div className="space-y-3">
            {/* Query configuration badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                {query.reportParams.tipeLaporan || "Tipe tidak diset"}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                Tahun {query.reportParams.tahun || "tidak diset"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Filter className="w-3 h-3 mr-1" />
                {Array.isArray(query.activeFilters)
                  ? query.activeFilters.length
                  : typeof query.activeFilters === 'string'
                    ? JSON.parse(query.activeFilters).length
                    : 0} Filter
              </Badge>
              {query.reportParams.pembulatan && (
                <Badge variant="outline" className="text-xs">
                  Pembulatan: {query.reportParams.pembulatan}
                </Badge>
              )}
            </div>

            {/* Active filters preview */}
            {(() => {
              // Ensure activeFilters is always an array
              const activeFiltersArray: string[] = Array.isArray(query.activeFilters)
                ? query.activeFilters
                : typeof query.activeFilters === 'string'
                  ? JSON.parse(query.activeFilters)
                  : [];

              return activeFiltersArray.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Filter Aktif:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {activeFiltersArray.slice(0, 6).map((filter: string, index: number) => {
                      const filterValue = query.filterValues[filter];
                      return (
                        <div
                          key={index}
                          className="text-xs bg-muted/50 rounded px-2 py-1"
                        >
                          <div className="font-medium truncate">{filter}</div>
                          {filterValue && (
                            <div className="text-muted-foreground truncate">
                              {filterValue.kondisiCode}:{" "}
                              {filterValue.selection ||
                                filterValue.mengandungKata ||
                                "N/A"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {activeFiltersArray.length > 6 && (
                      <div className="text-xs bg-muted/50 rounded px-2 py-1 flex items-center justify-center text-muted-foreground">
                        +{activeFiltersArray.length - 6} lainnya
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Timestamps */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {(() => {
                // Helper to pick the first non-empty value
                const pick = (...vals: any[]) =>
                  vals.find((v) => {
                    if (v == null) return false;
                    if (typeof v === "string") return v.trim() !== "";
                    return true;
                  });

                const createdRaw = pick(
                  (query as any).createdAt,
                  (query as any).created_at,
                  (query as any).updatedAt,
                  (query as any).updated_at
                );
                const updatedRaw = pick(
                  (query as any).updatedAt,
                  (query as any).updated_at
                );

                return (
                  <>
                    <span>Dibuat: {formatDate(createdRaw)}</span>
                    {updatedRaw && updatedRaw !== createdRaw && (
                      <span>Diperbarui: {formatDate(updatedRaw)}</span>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
