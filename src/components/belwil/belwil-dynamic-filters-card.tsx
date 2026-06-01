"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnhancedFilterCard } from "@/components/inquiry-data/enhanced-filter-card";
import {
  BelwilTayangModal,
  BelwilTematikTayangModal,
  BelwilSubsidiTayangModal,
  BelwilBansosTayangModal,
} from "./belwil-tayang-modal";
import {
  BelwilLihatSqlModal,
  BelwilTematikLihatSqlModal,
  BelwilSubsidiLihatSqlModal,
  BelwilBansosLihatSqlModal,
} from "./belwil-lihat-sql-modal";
import {
  getFilterLabel,
  normalizeActiveFilters,
} from "@/components/inquiry-data/filterRegistry";
import { Eye, Code, FileSpreadsheet, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useBelwilDataApi,
  useBelwilTematikDataApi,
  useBelwilSubsidiDataApi,
  useBelwilBansosDataApi,
} from "@/hooks/belwil/use-belwil-data-api";
import type {
  BelwilTematikReportParams,
  BelwilSubsidiReportParams,
  BelwilBansosReportParams,
} from "@/hooks/belwil/use-belwil-data-api";
import type { FilterValue } from "@/hooks/use-inquiry-data-api";

interface BelwilDynamicFiltersCardProps {
  activeFilters: string[];
  reportParams: {
    tahun: string;
    tipeLaporan: string;
    pembulatan: string;
    jenisDataLokasi?: string;
  };
  onRemoveFilter: (filterKey: string) => void;
  onClearAllFilters: () => void;
  filterValues: Record<string, FilterValue>;
  onFilterChange: (filterKey: string, field: string, value: string) => void;
}

export function BelwilDynamicFiltersCard({
  activeFilters,
  reportParams,
  onRemoveFilter,
  onClearAllFilters,
  filterValues,
  onFilterChange,
}: BelwilDynamicFiltersCardProps) {
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [modals, setModals] = useState({
    tayang: false,
    lihatSql: false,
  });

  const { user: currentUser } = useAuth();
  const isAdmin =
    currentUser?.role === "super_admin" || currentUser?.role === "co_admin";
  const showAdmin = mounted && isAdmin;

  const { downloadCSV, downloadExcel, isLoading } = useBelwilDataApi();

  const sortedActiveFilters = normalizeActiveFilters(activeFilters);

  const openModal = (modal: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modal]: true }));
  };

  const closeModal = (modal: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modal]: false }));
  };

  const handleDownloadExcel = async () => {
    try {
      const normalized = normalizeActiveFilters(activeFilters);
      await downloadExcel(normalized, filterValues, reportParams);
    } catch (error) {
      console.error("Excel download error:", error);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const normalized = normalizeActiveFilters(activeFilters);
      await downloadCSV(normalized, filterValues, reportParams);
    } catch (error) {
      console.error("CSV download error:", error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Filter Aktif dan Aksi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Filter Cards */}
        {sortedActiveFilters.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Filter yang Aktif ({sortedActiveFilters.length})
              </h3>
              {sortedActiveFilters.length > 0 && (
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
                  onRemove={() => onRemoveFilter(filterKey)}
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
          <div className="flex flex-wrap justify-center gap-3">
            {/* Tayang Button */}
            <Button
              onClick={() => openModal("tayang")}
              className="min-w-[150px] h-10"
              disabled={activeFilters.length === 0 || isLoading}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isLoading ? "Loading..." : "Tayang"}
            </Button>

            {/* Download Excel Button */}
            <Button
              onClick={handleDownloadExcel}
              variant="outline"
              className="min-w-[150px] h-10"
              disabled={activeFilters.length === 0 || isLoading}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download Excel
            </Button>

            {/* Download CSV Button */}
            <Button
              onClick={handleDownloadCSV}
              variant="outline"
              className="min-w-[150px] h-10"
              disabled={activeFilters.length === 0 || isLoading}
            >
              <FileText className="w-4 h-4 mr-2" />
              Download CSV
            </Button>

            {/* Lihat SQL Button (admin only) */}
            {showAdmin && (
              <Button
                onClick={() => openModal("lihatSql")}
                variant="outline"
                className="min-w-[150px] h-10"
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
      <BelwilTayangModal
        open={modals.tayang}
        onOpenChange={(open) => !open && closeModal("tayang")}
        activeFilters={activeFilters}
        reportParams={reportParams}
        filterValues={filterValues}
      />

      <BelwilLihatSqlModal
        open={modals.lihatSql}
        onOpenChange={(open) => !open && closeModal("lihatSql")}
        activeFilters={activeFilters}
        reportParams={reportParams}
        filterValues={filterValues}
      />
    </Card>
  );
}

// ─── Tematik variant ──────────────────────────────────────────────────────────────────

interface BelwilTematikDynamicFiltersCardProps {
  activeFilters: string[];
  reportParams: BelwilTematikReportParams;
  onRemoveFilter: (filterKey: string) => void;
  onClearAllFilters: () => void;
  filterValues: Record<string, FilterValue>;
  onFilterChange: (filterKey: string, field: string, value: string) => void;
}

export function BelwilTematikDynamicFiltersCard({
  activeFilters,
  reportParams,
  onRemoveFilter,
  onClearAllFilters,
  filterValues,
  onFilterChange,
}: BelwilTematikDynamicFiltersCardProps) {
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [modals, setModals] = useState({
    tayang: false,
    lihatSql: false,
  });

  const { user: currentUser } = useAuth();
  const isAdmin =
    currentUser?.role === "super_admin" || currentUser?.role === "co_admin";
  const showAdmin = mounted && isAdmin;

  const { downloadCSV, downloadExcel, isLoading } = useBelwilTematikDataApi();

  const sortedActiveFilters = normalizeActiveFilters(activeFilters);

  const openModal = (modal: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modal]: true }));
  };

  const closeModal = (modal: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modal]: false }));
  };

  const handleDownloadExcel = async () => {
    try {
      const normalized = normalizeActiveFilters(activeFilters);
      await downloadExcel(normalized, filterValues, reportParams);
    } catch (error) {
      console.error("Excel download error:", error);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const normalized = normalizeActiveFilters(activeFilters);
      await downloadCSV(normalized, filterValues, reportParams);
    } catch (error) {
      console.error("CSV download error:", error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Filter Aktif dan Aksi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedActiveFilters.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Filter yang Aktif ({sortedActiveFilters.length})
              </h3>
              {sortedActiveFilters.length > 0 && (
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
                  onRemove={() => onRemoveFilter(filterKey)}
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

        <div className="border-t pt-6">
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => openModal("tayang")}
              className="min-w-[150px] h-10"
              disabled={activeFilters.length === 0 || isLoading}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isLoading ? "Loading..." : "Tayang"}
            </Button>

            <Button
              onClick={handleDownloadExcel}
              variant="outline"
              className="min-w-[150px] h-10"
              disabled={activeFilters.length === 0 || isLoading}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download Excel
            </Button>

            <Button
              onClick={handleDownloadCSV}
              variant="outline"
              className="min-w-[150px] h-10"
              disabled={activeFilters.length === 0 || isLoading}
            >
              <FileText className="w-4 h-4 mr-2" />
              Download CSV
            </Button>

            {showAdmin && (
              <Button
                onClick={() => openModal("lihatSql")}
                variant="outline"
                className="min-w-[150px] h-10"
                disabled={activeFilters.length === 0}
              >
                <Code className="w-4 h-4 mr-2" />
                Lihat SQL
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <BelwilTematikTayangModal
        open={modals.tayang}
        onOpenChange={(open) => !open && closeModal("tayang")}
        activeFilters={activeFilters}
        reportParams={reportParams}
        filterValues={filterValues}
      />

      <BelwilTematikLihatSqlModal
        open={modals.lihatSql}
        onOpenChange={(open) => !open && closeModal("lihatSql")}
        activeFilters={activeFilters}
        reportParams={reportParams}
        filterValues={filterValues}
      />
    </Card>
  );
}

// ─── Subsidi variant ─────────────────────────────────────────────────────────────────

interface BelwilSubsidiDynamicFiltersCardProps {
  activeFilters: string[];
  reportParams: BelwilSubsidiReportParams;
  onRemoveFilter: (filterKey: string) => void;
  onClearAllFilters: () => void;
  filterValues: Record<string, FilterValue>;
  onFilterChange: (filterKey: string, field: string, value: string) => void;
}

export function BelwilSubsidiDynamicFiltersCard({
  activeFilters,
  reportParams,
  onRemoveFilter,
  onClearAllFilters,
  filterValues,
  onFilterChange,
}: BelwilSubsidiDynamicFiltersCardProps) {
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [modals, setModals] = useState({
    tayang: false,
    lihatSql: false,
  });

  const { user: currentUser } = useAuth();
  const isAdmin =
    currentUser?.role === "super_admin" || currentUser?.role === "co_admin";
  const showAdmin = mounted && isAdmin;

  const { downloadCSV, downloadExcel, isLoading } = useBelwilSubsidiDataApi();

  const sortedActiveFilters = normalizeActiveFilters(activeFilters);

  const openModal = (modal: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modal]: true }));
  };

  const closeModal = (modal: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modal]: false }));
  };

  const handleDownloadExcel = async () => {
    try {
      const normalized = normalizeActiveFilters(activeFilters);
      await downloadExcel(normalized, filterValues, reportParams);
    } catch (error) {
      console.error("Excel download error:", error);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const normalized = normalizeActiveFilters(activeFilters);
      await downloadCSV(normalized, filterValues, reportParams);
    } catch (error) {
      console.error("CSV download error:", error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Filter Aktif dan Aksi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedActiveFilters.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Filter yang Aktif ({sortedActiveFilters.length})
              </h3>
              {sortedActiveFilters.length > 0 && (
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
                  onRemove={() => onRemoveFilter(filterKey)}
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

        <div className="border-t pt-6">
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => openModal("tayang")}
              className="min-w-[150px] h-10"
              disabled={activeFilters.length === 0 || isLoading}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isLoading ? "Loading..." : "Tayang"}
            </Button>

            <Button
              onClick={handleDownloadExcel}
              variant="outline"
              className="min-w-[150px] h-10"
              disabled={activeFilters.length === 0 || isLoading}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download Excel
            </Button>

            <Button
              onClick={handleDownloadCSV}
              variant="outline"
              className="min-w-[150px] h-10"
              disabled={activeFilters.length === 0 || isLoading}
            >
              <FileText className="w-4 h-4 mr-2" />
              Download CSV
            </Button>

            {showAdmin && (
              <Button
                onClick={() => openModal("lihatSql")}
                variant="outline"
                className="min-w-[150px] h-10"
                disabled={activeFilters.length === 0}
              >
                <Code className="w-4 h-4 mr-2" />
                Lihat SQL
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <BelwilSubsidiTayangModal
        open={modals.tayang}
        onOpenChange={(open) => !open && closeModal("tayang")}
        activeFilters={activeFilters}
        reportParams={reportParams}
        filterValues={filterValues}
      />

      <BelwilSubsidiLihatSqlModal
        open={modals.lihatSql}
        onOpenChange={(open) => !open && closeModal("lihatSql")}
        activeFilters={activeFilters}
        reportParams={reportParams}
        filterValues={filterValues}
      />
    </Card>
  );
}


// ─── Bansos Dynamic Filters Card ──────────────────────────────────────────

interface BelwilBansosDynamicFiltersCardProps {
  activeFilters: string[];
  reportParams: BelwilBansosReportParams;
  onRemoveFilter: (filterKey: string) => void;
  onClearAllFilters: () => void;
  filterValues: Record<string, FilterValue>;
  onFilterChange: (filterKey: string, field: string, value: string) => void;
}

export function BelwilBansosDynamicFiltersCard({
  activeFilters,
  reportParams,
  onRemoveFilter,
  onClearAllFilters,
  filterValues,
  onFilterChange,
}: BelwilBansosDynamicFiltersCardProps) {
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [modals, setModals] = useState({
    tayang: false,
    lihatSql: false,
  });

  const { user: currentUser } = useAuth();
  const isAdmin =
    currentUser?.role === "super_admin" || currentUser?.role === "co_admin";
  const showAdmin = mounted && isAdmin;

  const { downloadCSV, downloadExcel, isLoading } = useBelwilBansosDataApi();

  const sortedBansosFilters = normalizeActiveFilters(activeFilters);

  const openBansosModal = (modal: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modal]: true }));
  };

  const closeBansosModal = (modal: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modal]: false }));
  };

  const handleDownloadExcel = async () => {
    try {
      const normalized = normalizeActiveFilters(activeFilters);
      await downloadExcel(normalized, filterValues, reportParams);
    } catch (error) {
      console.error("Excel download error:", error);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const normalized = normalizeActiveFilters(activeFilters);
      await downloadCSV(normalized, filterValues, reportParams);
    } catch (error) {
      console.error("CSV download error:", error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Filter Aktif dan Aksi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedBansosFilters.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Filter yang Aktif ({sortedBansosFilters.length})
              </h3>
              {sortedBansosFilters.length > 0 && (
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
              {sortedBansosFilters.map((filterKey) => (
                <EnhancedFilterCard
                  key={filterKey}
                  filterKey={filterKey}
                  filterLabel={getFilterLabel(filterKey)}
                  onRemove={() => onRemoveFilter(filterKey)}
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

        <div className="border-t pt-6">
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => openBansosModal("tayang")}
              className="min-w-[150px] h-10"
              disabled={activeFilters.length === 0 || isLoading}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isLoading ? "Loading..." : "Tayang"}
            </Button>

            <Button
              onClick={handleDownloadExcel}
              variant="outline"
              className="min-w-[150px] h-10"
              disabled={activeFilters.length === 0 || isLoading}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download Excel
            </Button>

            <Button
              onClick={handleDownloadCSV}
              variant="outline"
              className="min-w-[150px] h-10"
              disabled={activeFilters.length === 0 || isLoading}
            >
              <FileText className="w-4 h-4 mr-2" />
              Download CSV
            </Button>

            {showAdmin && (
              <Button
                onClick={() => openBansosModal("lihatSql")}
                variant="outline"
                className="min-w-[150px] h-10"
                disabled={activeFilters.length === 0}
              >
                <Code className="w-4 h-4 mr-2" />
                Lihat SQL
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <BelwilBansosTayangModal
        open={modals.tayang}
        onOpenChange={(open) => !open && closeBansosModal("tayang")}
        activeFilters={activeFilters}
        reportParams={reportParams}
        filterValues={filterValues}
      />
      <BelwilBansosLihatSqlModal
        open={modals.lihatSql}
        onOpenChange={(open) => !open && closeBansosModal("lihatSql")}
        activeFilters={activeFilters}
        reportParams={reportParams}
        filterValues={filterValues}
      />
    </Card>
  );
}
