"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterCard } from "./filter-card";
import { TayangModal } from "./modals/tayang-modal";
import { WhatsappModal } from "./modals/whatsapp-modal";
import { SimpanModal } from "./modals/simpan-modal";
import { LihatSqlModal } from "./modals/lihat-sql-modal";
import {
  Eye,
  Download,
  MessageCircle,
  Save,
  Code,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { useCurrentUser } from "@/lib/use-current-user";

interface DynamicFiltersCardProps {
  activeFilters: string[];
  reportParams: {
    tahun: string;
    tipeLaporan: string;
    pembulatan: string;
  };
  onRemoveFilter: (filterKey: string) => void;
  onClearAllFilters: () => void;
}

const filterLabels: Record<string, string> = {
  cutOff: "Cut Off",
  kementerian: "Kementerian",
  eselonI: "Eselon I",
  kewenangan: "Kewenangan",
  provinsi: "Provinsi",
  kabkota: "Kabkota",
  kanwil: "Kanwil",
  kppn: "KPPN",
  satker: "Satker",
  fungsi: "Fungsi",
  subFungsi: "Sub-Fungsi",
  program: "Program",
  kegiatan: "Kegiatan",
  outputKro: "Output/KRO",
  subOutputRo: "Sub-Output/RO",
  akun: "Akun",
  sumberDana: "Sumber Dana",
  register: "Register",
};

// Define the order of filters to maintain consistent sorting
const filterOrder = [
  "cutOff",
  "kementerian",
  "eselonI",
  "kewenangan",
  "provinsi",
  "kabkota",
  "kanwil",
  "kppn",
  "satker",
  "fungsi",
  "subFungsi",
  "program",
  "kegiatan",
  "outputKro",
  "subOutputRo",
  "akun",
  "sumberDana",
  "register",
];

export function DynamicFiltersCard({
  activeFilters,
  reportParams,
  onRemoveFilter,
  onClearAllFilters,
}: DynamicFiltersCardProps) {
  const [modals, setModals] = useState({
    tayang: false,
    whatsapp: false,
    simpan: false,
    lihatSql: false,
  });

  // State to track filter values for hierarchical filtering
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Get current user to check if admin for SQL view
  const { currentUser } = useCurrentUser();
  const isAdmin =
    currentUser?.role === "super_admin" || currentUser?.role === "co_admin";

  // Sort active filters based on predefined order
  const sortedActiveFilters = activeFilters
    .slice() // Create a copy to avoid mutating the original array
    .sort((a, b) => {
      const indexA = filterOrder.indexOf(a);
      const indexB = filterOrder.indexOf(b);
      return indexA - indexB;
    });

  const openModal = (modal: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modal]: true }));
  };

  const closeModal = (modal: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modal]: false }));
  };

  const handleRemoveFilter = (filterKey: string) => {
    onRemoveFilter(filterKey);
    // Clear the filter value when removing the filter
    setFilterValues((prev) => {
      const newValues = { ...prev };
      delete newValues[filterKey];
      return newValues;
    });
  };

  const handleFilterChange = (
    filterKey: string,
    field: string,
    value: string
  ) => {
    if (field === "selection") {
      setFilterValues((prev) => ({
        ...prev,
        [filterKey]: value,
      }));
    }
  };

  const handleDownloadExcel = () => {
    // Implement Excel download logic
    console.log("Downloading Excel file...");
  };

  const handleDownloadCSV = () => {
    // Implement CSV download logic
    console.log("Downloading CSV file...");
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
                  onClick={() => {
                    onClearAllFilters();
                    setFilterValues({}); // Clear all filter values
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Hapus Semua
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {sortedActiveFilters.map((filterKey) => (
                <FilterCard
                  key={filterKey}
                  filterKey={filterKey}
                  filterLabel={filterLabels[filterKey] || filterKey}
                  onRemove={() => handleRemoveFilter(filterKey)}
                  activeFilterValues={filterValues}
                  onFilterChange={handleFilterChange}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Tidak ada filter yang aktif.</p>
            <p className="text-sm">
              Aktifkan filter pada kartu "Filter Parameters" di atas.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
            Aksi Query
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {/* Tayang Button */}
            <Button
              onClick={() => openModal("tayang")}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px] h-10"
              disabled={activeFilters.length === 0}
            >
              <Eye className="w-4 h-4 mr-2" />
              Tayang
            </Button>

            {/* Download Excel Button */}
            <Button
              onClick={handleDownloadExcel}
              className="bg-green-100 hover:bg-green-200 text-green-800 border-green-200 min-w-[150px] h-10"
              disabled={activeFilters.length === 0}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download Excel
            </Button>

            {/* Download CSV Button */}
            <Button
              onClick={handleDownloadCSV}
              className="bg-green-100 hover:bg-green-200 text-green-800 border-green-200 min-w-[150px] h-10"
              disabled={activeFilters.length === 0}
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
        onOpenChange={(open: boolean) => closeModal("tayang")}
        activeFilters={activeFilters}
        reportParams={reportParams}
      />

      <WhatsappModal
        open={modals.whatsapp}
        onOpenChange={(open: boolean) => closeModal("whatsapp")}
        activeFilters={activeFilters}
        reportParams={reportParams}
      />

      <SimpanModal
        open={modals.simpan}
        onOpenChange={(open: boolean) => closeModal("simpan")}
        activeFilters={activeFilters}
        reportParams={reportParams}
      />

      {isAdmin && (
        <LihatSqlModal
          open={modals.lihatSql}
          onOpenChange={(open: boolean) => closeModal("lihatSql")}
          activeFilters={activeFilters}
          reportParams={reportParams}
        />
      )}
    </Card>
  );
}
