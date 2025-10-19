"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useSavedQueries } from "@/hooks/use-saved-queries";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { InlineError, NetworkStatus } from "@/components/ui/error-fallback";
import { LoadingOverlay, ButtonSpinner } from "@/components/ui/loading-states";

import {
  savedQueryNotifications,
  savedQueryWarnings,
} from "@/utils/notifications";
import { normalizeActiveFilters } from "../filterRegistry";
import {
  getCategoryLabel,
  getCategoryMandatoryFilters,
} from "../categoryRegistry";
import type { FilterValue, SavedQuery } from "@/types/saved-queries";

interface SimpanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: {
    tahun: string;
    tipeLaporan: string;
    pembulatan: string;
    tematikKategori?: string;
  };
  filterValues: Record<string, FilterValue>;
  scope?: "belanja" | "tematik" | "general" | "rkakl_detail" | "kontrak"; // Add scope for query differentiation
  onSaveSuccess?: (savedQuery: SavedQuery) => void;
}

export function SimpanModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
  filterValues,
  scope = "general", // Default to general scope
  onSaveSuccess,
}: SimpanModalProps) {
  const [formData, setFormData] = useState({
    queryName: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const { createQuery, isCreating, queries } = useSavedQueries();

  
  const { isOnline } = useNetworkStatus();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateQueryName = (name: string): string | null => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return "Nama query tidak boleh kosong";
    }

    // Check for duplicate names (case-insensitive)
    const isDuplicate = queries.some(
      (query) => query.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      return "Nama query sudah digunakan. Silakan pilih nama yang berbeda.";
    }

    return null;
  };

  // Helper function to check if a filter is actually configured by the user
  const isFilterConfigured = (
    filterName: string,
    filterValue: FilterValue | undefined
  ): boolean => {
    if (!filterValue) return false;

    // cutOff filter is always considered configured if it has a kondisiCode
    if (filterName === "cutOff") {
      return !!(
        filterValue.kondisiCode && filterValue.kondisiCode.trim() !== ""
      );
    }

    // For other filters, check if any of the three options are configured
    // "all" (Semua) is a valid selection and should be saved
    const hasValidSelection =
      filterValue.selection && filterValue.selection.trim() !== "";
    const hasValidKondisiCode =
      filterValue.kondisiCode && filterValue.kondisiCode.trim() !== "";
    const hasValidMengandungKata =
      typeof filterValue.mengandungKata === "string" &&
      filterValue.mengandungKata.trim() !== "";

    return hasValidSelection || hasValidKondisiCode || hasValidMengandungKata;
  };

  const validateFilterData = (): string | null => {
    const isTematik = scope === "tematik";
    const currentCategory = reportParams.tematikKategori;

    // Filter out unconfigured filters (those with selection="all" and no other values)
    const configuredFilters = activeFilters.filter((filterName) => {
      const filterValue = filterValues[filterName];
      return isFilterConfigured(filterName, filterValue);
    });

    // Check if we have any configured filters. For tematik with mandatory filters, allow even if user didn't configure them.
    if (configuredFilters.length === 0 && (!isTematik || !currentCategory)) {
      return "Setidaknya satu filter harus dikonfigurasi untuk menyimpan query.";
    }

    // Validate only the configured filters
    for (const filterName of configuredFilters) {
      const filterValue = filterValues[filterName];
      if (!filterValue) continue;

      // For configured filters, they should already be valid by definition of isFilterConfigured
      // But let's add a safety check for cutOff
      if (filterName === "cutOff" && !filterValue.kondisiCode) {
        return `Filter "${filterName}" tidak memiliki kondisi yang valid.`;
      }
    }

    return null;
  };

  // Helper function to get only configured filters for saving
  const getConfiguredFiltersForSaving = () => {
    let configuredActiveFilters = activeFilters.filter((filterName) => {
      const filterValue = filterValues[filterName];
      return isFilterConfigured(filterName, filterValue);
    });

    const configuredFilterValues: Record<string, FilterValue> = {};
    configuredActiveFilters.forEach((filterName) => {
      if (filterValues[filterName]) {
        configuredFilterValues[filterName] = filterValues[filterName];
      }
    });

    // If Tematik with any category, ensure mandatory filters are included
    const isTematik = scope === "tematik";
    const currentCategory = reportParams.tematikKategori;

    if (isTematik && currentCategory) {
      const mandatoryFilters = getCategoryMandatoryFilters(currentCategory);
      const mandatoryKeys = mandatoryFilters.map((f) => f.key);

      // Merge mandatory keys into active filters (dedupe)
      configuredActiveFilters = Array.from(
        new Set(["cutOff", ...configuredActiveFilters, ...mandatoryKeys])
      );

      // Ensure filter values exist (seed defaults if missing)
      mandatoryKeys.forEach((k) => {
        if (!configuredFilterValues[k]) {
          const mandatoryFilter = mandatoryFilters.find((f) => f.key === k);
          configuredFilterValues[k] = mandatoryFilter?.defaultValue || {
            selection: "all",
            kondisiCode: "",
            mengandungKata: "",
            jenisTampilan: "kode",
          };
        }
      });
    }

    return {
      activeFilters: configuredActiveFilters,
      filterValues: configuredFilterValues,
    };
  };

  const getSuggestedName = (baseName: string): string => {
    const trimmedBase = baseName.trim();
    if (!trimmedBase) return "";

    let counter = 1;
    let suggestedName = trimmedBase;

    while (
      queries.some(
        (query) => query.name.toLowerCase() === suggestedName.toLowerCase()
      )
    ) {
      suggestedName = `${trimmedBase} (${counter})`;
      counter++;
    }

    return suggestedName;
  };

  const handleSaveQuery = async (retryAttempt = false) => {
    const nameValidationError = validateQueryName(formData.queryName);
    if (nameValidationError) {
      setError(nameValidationError);
      return;
    }

    const filterValidationError = validateFilterData();
    if (filterValidationError) {
      setError(filterValidationError);
      return;
    }

    // Check network connectivity
    if (!isOnline) {
      setError(
        "Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi."
      );
      return;
    }

    setError(null);
    if (retryAttempt) {
      setIsRetrying(true);
    }

    try {
      // Get only the configured filters for saving
      const {
        activeFilters: configuredActiveFilters,
        filterValues: configuredFilterValues,
      } = getConfiguredFiltersForSaving();

      const queryData = {
        name: formData.queryName.trim(),
        description: formData.description.trim(),
        reportParams,
        activeFilters: configuredActiveFilters,
        filterValues: configuredFilterValues,
        scope, // Include scope in the saved query
      };

      

      const savedQuery = await createQuery(queryData);

      // Show success notification with enhanced feedback
      savedQueryNotifications.querySaved(savedQuery.name, {
        action: {
          label: "Buka Query Management",
          onClick: () => {
            // This could navigate to query management or trigger a callback
            console.log("Navigate to query management");
          },
        },
      });

      // Close modal and reset form
      onOpenChange(false);
      setFormData({ queryName: "", description: "" });

      // Call success callback if provided
      if (onSaveSuccess) {
        onSaveSuccess(savedQuery);
      }
    } catch (error) {
      console.error("[SimpanModal] Error saving query:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menyimpan query";

      // Handle specific error cases
      let displayError = errorMessage;

      if (
        errorMessage.toLowerCase().includes("duplicate") ||
        errorMessage.toLowerCase().includes("already exists") ||
        errorMessage.toLowerCase().includes("sudah ada")
      ) {
        const suggestedName = getSuggestedName(formData.queryName);
        displayError =
          "Nama query sudah digunakan. Silakan pilih nama yang berbeda.";

        // Use enhanced duplicate name warning
        savedQueryWarnings.duplicateName(suggestedName, () => {
          if (suggestedName) {
            handleInputChange("queryName", suggestedName);
          }
        });
      } else if (
        errorMessage.toLowerCase().includes("network") ||
        errorMessage.toLowerCase().includes("connection") ||
        errorMessage.toLowerCase().includes("timeout")
      ) {
        displayError = "Masalah koneksi. Periksa internet Anda dan coba lagi.";

        // Show network error with retry
        toast.error("Gagal menyimpan query", {
          description: "Koneksi terputus atau lambat. Silakan coba lagi.",
          action: {
            label: "Coba Lagi",
            onClick: () => handleSaveQuery(true),
          },
        });
      } else if (
        errorMessage.toLowerCase().includes("server") ||
        errorMessage.includes("5")
      ) {
        displayError =
          "Server sedang bermasalah. Coba lagi dalam beberapa saat.";

        // Show server error with retry
        toast.error("Gagal menyimpan query", {
          description: "Server tidak dapat diakses saat ini.",
          action: {
            label: "Coba Lagi",
            onClick: () => handleSaveQuery(true),
          },
        });
      } else {
        // Generic error
        toast.error("Gagal menyimpan query", {
          description: errorMessage,
        });
      }

      setError(displayError);

      console.error("Error saving query:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleClose = () => {
    if (!isCreating && !isRetrying) {
      onOpenChange(false);
      setFormData({ queryName: "", description: "" });
      setError(null);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleSaveQuery(true);
  };

  const isOperationInProgress = isCreating || isRetrying;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg sm:max-w-2xl" showCloseButton={false}>
        <LoadingOverlay
          isVisible={isOperationInProgress}
          text={isRetrying ? "Mencoba lagi..." : "Menyimpan query..."}
        />

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-amber-600" />
            Simpan Query
          </DialogTitle>
        </DialogHeader>

        {/* Network Status Warning */}
        <NetworkStatus isOnline={isOnline} />

        <div className="space-y-4">
          {/* Query Summary */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Konfigurasi Query</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                Tahun: {reportParams.tahun || "Belum dipilih"}
              </Badge>
              <Badge variant="secondary">
                {scope === "tematik" ? "Kategori" : "Tipe"}:{" "}
                {scope === "tematik"
                  ? reportParams.tematikKategori || "Belum dipilih"
                  : reportParams.tipeLaporan || "Belum dipilih"}
              </Badge>
              <Badge variant="secondary">
                Pembulatan: {reportParams.pembulatan || "Belum dipilih"}
              </Badge>
              <Badge variant="outline">
                Filter Aktif: {activeFilters.length}
              </Badge>
              {Object.keys(filterValues).length > 0 && (
                <Badge variant="outline">
                  Filter Values: {Object.keys(filterValues).length}
                </Badge>
              )}
            </div>

            {/* Filter Details */}
            {activeFilters.length > 0 && (
              <div className="mt-3 p-2 bg-muted/30 rounded-md">
                <p className="text-xs text-muted-foreground mb-1">
                  Filter yang akan disimpan:
                </p>
                <div className="space-y-1">
                  {activeFilters.map((filter, index) => {
                    const filterValue = filterValues[filter];
                    return (
                      <div key={index} className="text-xs">
                        <span className="font-medium">{filter}</span>
                        {filterValue && (
                          <span className="text-muted-foreground ml-2">
                            ({filterValue.kondisiCode}:{" "}
                            {filterValue.selection ||
                              filterValue.mengandungKata ||
                              "N/A"}
                            )
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Query Name */}
            <div className="space-y-2">
              <Label htmlFor="queryName" className="text-sm font-medium">
                Nama Query <span className="text-red-500">*</span>
              </Label>
              <Input
                id="queryName"
                placeholder="Masukkan nama query yang mudah diingat"
                value={formData.queryName}
                onChange={(e) => handleInputChange("queryName", e.target.value)}
                className={error ? "border-red-500" : ""}
              />
              {error && (
                <InlineError
                  error={error}
                  {...((error.includes("koneksi") || error.includes("server"))
                    ? { onRetry: handleRetry }
                    : {})}
                />
              )}
              {error &&
                error.includes("sudah digunakan") &&
                formData.queryName.trim() && (
                  <p className="text-xs text-muted-foreground">
                    Saran:{" "}
                    <button
                      type="button"
                      className="text-amber-600 hover:text-amber-700 underline"
                      onClick={() => {
                        const suggested = getSuggestedName(formData.queryName);
                        if (suggested) {
                          handleInputChange("queryName", suggested);
                        }
                      }}
                    >
                      "{getSuggestedName(formData.queryName)}"
                    </button>
                  </p>
                )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Deskripsi (Opsional)
              </Label>
              <Textarea
                id="description"
                placeholder="Deskripsi query untuk memudahkan identifikasi"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
              />
            </div>
          </div>

          {/* Info */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Query yang disimpan akan mencakup semua parameter laporan dan
              filter yang aktif saat ini. Anda dapat memuat kembali query ini di
              lain waktu.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="destructive"
            className="w-24"
            onClick={handleClose}
            disabled={isOperationInProgress}
          >
            Tutup
          </Button>
          <Button
            onClick={() => handleSaveQuery()}
            disabled={
              isOperationInProgress || !formData.queryName.trim() || !isOnline
            }
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isOperationInProgress ? (
              <ButtonSpinner className="mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isRetrying
              ? "Mencoba Lagi..."
              : isCreating
              ? "Menyimpan..."
              : "Simpan Query"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
