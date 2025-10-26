"use client";

import { toast } from "sonner";
// Icons removed - using default toast icons instead

/**
 * Enhanced notification system for saved queries
 * Provides consistent success, error, warning, and info messages with actions
 */

interface NotificationOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  description?: string;
}

interface UndoableAction {
  label: string;
  onUndo: () => Promise<void>;
  timeout?: number;
}

/**
 * Success notifications for saved queries operations
 */
export const savedQueryNotifications = {
  // Query save success
  querySaved: (queryName: string, options?: NotificationOptions) => {
    toast.success("Query berhasil disimpan", {
      description: options?.description || `Query "${queryName}" telah disimpan dan dapat digunakan kembali`,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  },

  // Query load success
  queryLoaded: (queryName: string, options?: NotificationOptions) => {
    toast.success("Query berhasil dimuat", {
      description: options?.description || `Query "${queryName}" telah dimuat ke Query Builder`,
      duration: options?.duration || 3000,
      action: options?.action,
    });
  },

  // Query update success
  queryUpdated: (queryName: string, options?: NotificationOptions) => {
    toast.success("Query berhasil diperbarui", {
      description: options?.description || `Query "${queryName}" telah diperbarui`,
      duration: options?.duration || 3000,
      action: options?.action,
    });
  },

  // Query delete success with undo
  queryDeleted: (queryName: string, undoAction?: UndoableAction) => {
    const toastId = toast.success("Query berhasil dihapus", {
      description: `Query "${queryName}" telah dihapus`,
      duration: undoAction?.timeout || 5000,
      action: undoAction ? {
        label: undoAction.label,
        onClick: async () => {
          toast.dismiss(toastId);
          try {
            await undoAction.onUndo();
            toast.success("Query berhasil dipulihkan", {
              description: `Query "${queryName}" telah dipulihkan`,
              duration: 3000,
            });
          } catch (error) {
            toast.error("Gagal memulihkan query", {
              description: "Terjadi kesalahan saat memulihkan query",
              duration: 4000,
            });
          }
        },
      } : undefined,
    });
    return toastId;
  },

  // Bulk operations success
  bulkOperationSuccess: (
    operation: string,
    successCount: number,
    totalCount: number,
    failedCount: number = 0
  ) => {
    if (failedCount === 0) {
      toast.success(`${operation} berhasil`, {
        description: `Semua ${totalCount} query berhasil ${operation.toLowerCase()}`,
        duration: 4000,
      });
    } else if (successCount > 0) {
      toast.warning(`${operation} sebagian berhasil`, {
        description: `${successCount} berhasil, ${failedCount} gagal dari ${totalCount} query`,
        duration: 5000,
      });
    } else {
      toast.error(`${operation} gagal`, {
        description: `Semua ${totalCount} query gagal ${operation.toLowerCase()}`,
        duration: 5000,
      });
    }
  },

  // Data sync success
  dataSynced: (options?: NotificationOptions) => {
    toast.success("Data berhasil disinkronkan", {
      description: options?.description || "Daftar query telah diperbarui",
      duration: options?.duration || 2000,
      action: options?.action,
    });
  },

  // Connection restored
  connectionRestored: () => {
    toast.success("Koneksi pulih", {
      description: "Koneksi internet telah pulih. Operasi dapat dilanjutkan.",
      duration: 3000,
    });
  },
};

/**
 * Warning notifications for user actions
 */
export const savedQueryWarnings = {
  // Unsaved changes warning
  unsavedChanges: (onSave?: () => void, onDiscard?: () => void) => {
    toast.warning("Ada perubahan yang belum disimpan", {
      description: "Anda memiliki perubahan yang belum disimpan. Simpan atau buang perubahan?",
      duration: 8000,
      action: onSave ? {
        label: "Simpan",
        onClick: onSave,
      } : undefined,
    });
  },

  // Duplicate name warning
  duplicateName: (suggestedName?: string, onUseSuggestion?: () => void) => {
    toast.warning("Nama query sudah digunakan", {
      description: suggestedName 
        ? `Nama tersebut sudah ada. Gunakan "${suggestedName}" sebagai gantinya?`
        : "Silakan pilih nama yang berbeda untuk query Anda",
      duration: 6000,
      action: suggestedName && onUseSuggestion ? {
        label: `Gunakan "${suggestedName}"`,
        onClick: onUseSuggestion,
      } : undefined,
    });
  },

  // Network issues
  networkIssues: () => {
    toast.warning("Koneksi tidak stabil", {
      description: "Koneksi internet tidak stabil. Beberapa operasi mungkin gagal.",
      duration: 5000,
    });
  },

  // Storage quota warning
  storageQuota: (usedPercentage: number) => {
    toast.warning("Penyimpanan hampir penuh", {
      description: `Anda telah menggunakan ${usedPercentage}% dari kuota penyimpanan query`,
      duration: 6000,
    });
  },
};

/**
 * Info notifications for user guidance
 */
export const savedQueryInfo = {
  // First time user guidance
  firstTimeUser: () => {
    toast.info("Selamat datang di Saved Queries!", {
      description: "Simpan konfigurasi query Anda untuk digunakan kembali nanti",
      duration: 6000,
    });
  },

  // Feature tips
  featureTip: (tip: string) => {
    toast.info("Tips", {
      description: tip,
      duration: 5000,
    });
  },

  // Loading with progress
  loadingWithProgress: (message: string, progress?: number) => {
    const description = progress !== undefined 
      ? `${message} (${progress}%)`
      : message;
    
    return toast.loading(description, {
      duration: Infinity, // Keep until dismissed
    });
  },

  // Operation in progress
  operationInProgress: (operation: string) => {
    return toast.loading(`${operation}...`, {
      description: "Mohon tunggu, operasi sedang berlangsung",
      duration: Infinity,
    });
  },
};

/**
 * Confirmation dialogs for destructive actions
 */
export const savedQueryConfirmations = {
  // Delete confirmation
  confirmDelete: (queryName: string, onConfirm: () => void) => {
    toast.warning(`Hapus query "${queryName}"?`, {
      description: "Tindakan ini tidak dapat dibatalkan",
      duration: 8000,
      action: {
        label: "Hapus",
        onClick: onConfirm,
      },
    });
  },

  // Bulk delete confirmation
  confirmBulkDelete: (count: number, onConfirm: () => void) => {
    toast.warning(`Hapus ${count} query?`, {
      description: "Semua query yang dipilih akan dihapus secara permanen",
      duration: 10000,
      action: {
        label: `Hapus ${count} Query`,
        onClick: onConfirm,
      },
    });
  },

  // Overwrite confirmation
  confirmOverwrite: (queryName: string, onConfirm: () => void) => {
    toast.warning(`Timpa query "${queryName}"?`, {
      description: "Query yang ada akan diganti dengan konfigurasi saat ini",
      duration: 8000,
      action: {
        label: "Timpa",
        onClick: onConfirm,
      },
    });
  },
};

/**
 * Utility functions for managing notifications
 */
export const notificationUtils = {
  // Dismiss all notifications
  dismissAll: () => {
    toast.dismiss();
  },

  // Dismiss specific notification
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId);
  },

  // Show custom notification
  custom: (
    type: "success" | "error" | "warning" | "info" | "loading",
    title: string,
    options?: NotificationOptions
  ) => {
    const toastFn = toast[type];
    // With exactOptionalPropertyTypes enabled, avoid passing possibly undefined props.
    const payload: Record<string, any> = {};
    if (options?.description !== undefined) {
      payload.description = options.description;
    }
    if (options?.duration !== undefined) {
      payload.duration = options.duration;
    }
    if (options?.action !== undefined) {
      payload.action = options.action;
    }
    return toastFn(title, payload);
  },

  // Progress notification that can be updated
  progress: (initialMessage: string) => {
    let toastId = toast.loading(initialMessage);
    
    return {
      update: (message: string, progress?: number) => {
        toast.dismiss(toastId);
        const description = progress !== undefined 
          ? `${message} (${progress}%)`
          : message;
        toastId = toast.loading(description);
      },
      success: (message: string, description?: string) => {
        toast.dismiss(toastId);
        // Build payload conditionally
        const payload: Record<string, any> = {};
        if (description !== undefined) payload.description = description;
        toast.success(message, payload);
      },
      error: (message: string, description?: string) => {
        toast.dismiss(toastId);
        const payload: Record<string, any> = {};
        if (description !== undefined) payload.description = description;
        toast.error(message, payload);
      },
      dismiss: () => {
        toast.dismiss(toastId);
      },
    };
  },
};

/**
 * Keyboard shortcuts for notifications
 */
export const notificationShortcuts = {
  // Dismiss all with Escape key
  setupKeyboardShortcuts: () => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && event.ctrlKey) {
        notificationUtils.dismissAll();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  },
};

/**
 * Notification queue for managing multiple notifications
 */
class NotificationQueue {
  private queue: Array<() => void> = [];
  private isProcessing = false;
  private delay = 500; // Delay between notifications

  add(notificationFn: () => void) {
    this.queue.push(notificationFn);
    this.process();
  }

  private async process() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const notificationFn = this.queue.shift();
      if (notificationFn) {
        notificationFn();
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }
    
    this.isProcessing = false;
  }

  clear() {
    this.queue = [];
  }

  setDelay(delay: number) {
    this.delay = delay;
  }
}

export const notificationQueue = new NotificationQueue();
