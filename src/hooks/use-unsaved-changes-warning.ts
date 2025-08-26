"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { SavedQuery } from "@/types/saved-queries";
import type { UnsavedChangesAction } from "@/components/inquiry-data/modals/unsaved-changes-modal";

export interface UseUnsavedChangesWarningProps {
  hasUnsavedChanges: boolean;
  onSaveCurrentQuery: () => Promise<{ success: boolean; error?: string }>;
  onLoadQuery: (query: SavedQuery) => Promise<{ success: boolean; errors?: string[] }>;
  onDiscardChanges?: () => void;
}

/**
 * Hook for managing unsaved changes warning system
 * Handles the flow of warning users about unsaved changes when loading queries
 */
export function useUnsavedChangesWarning({
  hasUnsavedChanges,
  onSaveCurrentQuery,
  onLoadQuery,
  onDiscardChanges,
}: UseUnsavedChangesWarningProps) {
  const [warningState, setWarningState] = useState<{
    isOpen: boolean;
    queryToLoad: SavedQuery | null;
    isProcessing: boolean;
  }>({
    isOpen: false,
    queryToLoad: null,
    isProcessing: false,
  });

  /**
   * Attempts to load a query, checking for unsaved changes first
   */
  const attemptLoadQuery = useCallback(async (query: SavedQuery): Promise<boolean> => {
    // If no unsaved changes, load directly
    if (!hasUnsavedChanges) {
      try {
        const result = await onLoadQuery(query);
        if (result.success) {
          toast.success("Query berhasil dimuat", {
            description: `Query "${query.name}" telah dimuat ke query builder`,
          });
          return true;
        } else {
          toast.error("Gagal memuat query", {
            description: result.errors?.join(", ") || "Terjadi kesalahan saat memuat query",
          });
          return false;
        }
      } catch (error) {
        console.error("Error loading query:", error);
        toast.error("Gagal memuat query", {
          description: "Terjadi kesalahan saat memuat query. Silakan coba lagi.",
        });
        return false;
      }
    }

    // If there are unsaved changes, show warning modal
    setWarningState({
      isOpen: true,
      queryToLoad: query,
      isProcessing: false,
    });

    return false; // Loading will be handled by the modal actions
  }, [hasUnsavedChanges, onLoadQuery]);

  /**
   * Handles actions from the unsaved changes warning modal
   */
  const handleWarningAction = useCallback(async (action: UnsavedChangesAction) => {
    const { queryToLoad } = warningState;

    if (!queryToLoad) {
      console.error("No query to load in warning action");
      return;
    }

    setWarningState(prev => ({ ...prev, isProcessing: true }));

    try {
      switch (action.type) {
        case "save_and_load":
          // First save the current query
          const saveResult = await onSaveCurrentQuery();
          
          if (!saveResult.success) {
            toast.error("Gagal menyimpan query saat ini", {
              description: saveResult.error || "Silakan coba lagi",
            });
            setWarningState(prev => ({ ...prev, isProcessing: false }));
            return;
          }

          // Then load the new query
          const loadResult = await onLoadQuery(queryToLoad);
          
          if (loadResult.success) {
            toast.success("Query berhasil disimpan dan dimuat", {
              description: `Query "${queryToLoad.name}" telah dimuat ke query builder`,
            });
            setWarningState({ isOpen: false, queryToLoad: null, isProcessing: false });
          } else {
            toast.error("Query disimpan, tetapi gagal memuat query baru", {
              description: loadResult.errors?.join(", ") || "Silakan coba muat ulang query",
            });
            setWarningState(prev => ({ ...prev, isProcessing: false }));
          }
          break;

        case "discard_and_load":
          // Discard changes and load new query
          if (onDiscardChanges) {
            onDiscardChanges();
          }

          const discardLoadResult = await onLoadQuery(queryToLoad);
          
          if (discardLoadResult.success) {
            toast.success("Query berhasil dimuat", {
              description: `Query "${queryToLoad.name}" telah dimuat ke query builder`,
            });
            // Ensure modal is properly closed and state is reset
            setWarningState({ isOpen: false, queryToLoad: null, isProcessing: false });
          } else {
            toast.error("Gagal memuat query", {
              description: discardLoadResult.errors?.join(", ") || "Silakan coba lagi",
            });
            setWarningState(prev => ({ ...prev, isProcessing: false }));
          }
          break;

        case "cancel":
          // Just close the modal
          setWarningState({ isOpen: false, queryToLoad: null, isProcessing: false });
          break;

        default:
          console.error("Unknown warning action:", action.type);
          setWarningState(prev => ({ ...prev, isProcessing: false }));
      }
    } catch (error) {
      console.error("Error handling warning action:", error);
      toast.error("Terjadi kesalahan", {
        description: "Silakan coba lagi",
      });
      setWarningState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [warningState, onSaveCurrentQuery, onLoadQuery, onDiscardChanges]);

  /**
   * Closes the warning modal
   */
  const closeWarningModal = useCallback(() => {
    if (!warningState.isProcessing) {
      setWarningState({ isOpen: false, queryToLoad: null, isProcessing: false });
    }
  }, [warningState.isProcessing]);

  /**
   * Forces loading a query without checking for unsaved changes
   * Use with caution - this bypasses the warning system
   */
  const forceLoadQuery = useCallback(async (query: SavedQuery): Promise<boolean> => {
    try {
      const result = await onLoadQuery(query);
      if (result.success) {
        toast.success("Query berhasil dimuat", {
          description: `Query "${query.name}" telah dimuat ke query builder`,
        });
        return true;
      } else {
        toast.error("Gagal memuat query", {
          description: result.errors?.join(", ") || "Terjadi kesalahan saat memuat query",
        });
        return false;
      }
    } catch (error) {
      console.error("Error force loading query:", error);
      toast.error("Gagal memuat query", {
        description: "Terjadi kesalahan saat memuat query. Silakan coba lagi.",
      });
      return false;
    }
  }, [onLoadQuery]);

  return {
    // State
    isWarningOpen: warningState.isOpen,
    queryToLoad: warningState.queryToLoad,
    isProcessing: warningState.isProcessing,

    // Actions
    attemptLoadQuery,
    handleWarningAction,
    closeWarningModal,
    forceLoadQuery,
  } as const;
}