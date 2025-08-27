"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnhancedFilterCard } from "./enhanced-filter-card";
import { TayangModal } from "./modals/tayang-modal";
import { WhatsappModal } from "./modals/whatsapp-modal";
import { SimpanModal } from "./modals/simpan-modal";
import { LihatSqlModal } from "./modals/lihat-sql-modal";
import { QueryLoaderButton } from "./query-loader-button";
import { getFilterLabel, normalizeActiveFilters } from "./filterRegistry";

import {
  Eye,
  MessageCircle,
  Save,
  Code,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { useCurrentUser } from "@/lib/use-current-user";
import { useInquiryDataApi, FilterValue } from "@/hooks/use-inquiry-data-api";

interface DynamicFiltersCardProps {
  activeFilters: string[];
  reportParams: {
    tahun: string;
    tipeLaporan: string;
    pembulatan: string;
  };
  onRemoveFilter: (filterKey: string) => void;
  onClearAllFilters: () => void;
  filterValues: Record<string, FilterValue>;
  onFilterChange: (filterKey: string, field: string, value: string) => void;
  queryLoader?: {
    hasUnsavedChanges: boolean;
    loadQuery: (query: any) => Promise<void>;
    validateQueryCompatibility: (query: any) => {
      isValid: boolean;
      errors: string[];
    };
  };
}

// Labels will come from the registry via getFilterLabel

export function DynamicFiltersCard({
  activeFilters,
  reportParams,
  onRemoveFilter,
  onClearAllFilters,
  filterValues,
  onFilterChange,
  queryLoader,
}: DynamicFiltersCardProps) {
  const [modals, setModals] = useState({
    tayang: false,
    whatsapp: false,
    simpan: false,
    lihatSql: false,
  });

  // Get current user to check if admin for SQL view
  const { currentUser } = useCurrentUser();
  const isAdmin =
    currentUser?.role === "super_admin" || currentUser?.role === "co_admin";

  // API hook for query execution (used for downloads)
  const { downloadCSV, downloadExcel, isLoading } = useInquiryDataApi();

  // Sort active filters based on predefined order
  const sortedActiveFilters = normalizeActiveFilters(activeFilters);

  const openModal = (modal: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modal]: true }));
  };

  const closeModal = (modal: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modal]: false }));
  };

  const handleRemoveFilter = (filterKey: string) => {
    onRemoveFilter(filterKey);
  };

  // Open tayang modal (query execution will happen inside the modal)
  const handleTayang = () => {
    openModal("tayang");
  };

  const handleDownloadExcel = async () => {
    try {
      // Normalize active filters to default order for consistent column ordering in exports
      const normalized = normalizeActiveFilters(activeFilters);
      await downloadExcel(normalized, filterValues, reportParams);
    } catch (error) {
      console.error("Excel download error:", error);
      // You could show a toast notification here
    }
  };

  const handleDownloadCSV = async () => {
    try {
      // Normalize active filters to default order for consistent column ordering in exports
      const normalized = normalizeActiveFilters(activeFilters);
      await downloadCSV(normalized, filterValues, reportParams);
    } catch (error) {
      console.error("CSV download error:", error);
      // You could show a toast notification here
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Filter Aktif dan Aksi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Filter Cards */}
        {activeFilters.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Filter yang Aktif ({activeFilters.length})
              </h3>
              {activeFilters.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearAllFilters}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Hapus Semua
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {sortedActiveFilters.map((filterKey) => (
                <EnhancedFilterCard
                  key={filterKey}
                  filterKey={filterKey}
                  filterLabel={getFilterLabel(filterKey)}
                  onRemove={() => handleRemoveFilter(filterKey)}
                  activeFilterValues={filterValues}
                  onFilterChange={onFilterChange}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Tidak ada filter yang aktif.</p>
            <p className="text-sm">
              Aktifkan filter pada kartu &quot;Filter Parameters&quot; di atas.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
            Aksi Query
          </h3>

          {/* Query Loader Button removed (redundant) */}
          <div className="flex flex-wrap justify-center gap-3">
            {/* Tayang Button */}
            <Button
              onClick={handleTayang}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px] h-10"
              disabled={activeFilters.length === 0 || isLoading}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isLoading ? "Loading..." : "Tayang"}
            </Button>

            {/* Download Excel Button */}
            <Button
              onClick={handleDownloadExcel}
              className="bg-green-100 hover:bg-green-200 text-green-800 border-green-200 min-w-[150px] h-10"
              disabled={activeFilters.length === 0 || isLoading}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download Excel
            </Button>

            {/* Download CSV Button */}
            <Button
              onClick={handleDownloadCSV}
              className="bg-green-100 hover:bg-green-200 text-green-800 border-green-200 min-w-[150px] h-10"
              disabled={activeFilters.length === 0 || isLoading}
            >
              <FileText className="w-4 h-4 mr-2" />
              Download CSV
            </Button>

            {/* WhatsApp Button */}
            <Button
              onClick={() => openModal("whatsapp")}
              className="bg-green-600 hover:bg-green-700 text-white min-w-[150px] h-10"
              disabled={activeFilters.length === 0}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>

            {/* Simpan Button */}
            <Button
              onClick={() => openModal("simpan")}
              className="bg-amber-600 hover:bg-amber-700 text-white min-w-[150px] h-10"
              disabled={activeFilters.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              Simpan
            </Button>

            {/* Lihat SQL Button - Only for Admin */}
            {isAdmin && (
              <Button
                onClick={() => openModal("lihatSql")}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200 min-w-[150px] h-10"
                disabled={activeFilters.length === 0}
              >
                <Code className="w-4 h-4 mr-2" />
                Lihat SQL
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* Modals */}
      <TayangModal
        open={modals.tayang}
        onOpenChange={() => closeModal("tayang")}
        activeFilters={activeFilters}
        reportParams={reportParams}
        filterValues={filterValues}
      />

      <WhatsappModal
        open={modals.whatsapp}
        onOpenChange={() => closeModal("whatsapp")}
        activeFilters={activeFilters}
        reportParams={reportParams}
        filterValues={filterValues}
      />
      {/* Optional: WhatsApp QR modal entry point can be added anywhere, e.g., settings */}
      {/* <WhatsappQrModal open={qrOpen} onOpenChange={setQrOpen} /> */}

      <SimpanModal
        open={modals.simpan}
        onOpenChange={() => closeModal("simpan")}
        activeFilters={activeFilters}
        reportParams={reportParams}
        filterValues={filterValues}
      />

      {isAdmin && (
        <LihatSqlModal
          open={modals.lihatSql}
          onOpenChange={() => closeModal("lihatSql")}
          activeFilters={activeFilters}
          reportParams={reportParams}
          filterValues={filterValues}
        />
      )}
    </Card>
  );
}
