"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VirtualizedSelect } from "@/components/ui/virtualized-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import JSON data
import kddeptData from "./data/kddept.json";
import kdunitData from "./data/kdunit.json";
import kdkanwilData from "./data/kdkanwil.json";
import kdkppnData from "./data/kdkppn.json";
import kdlokasiData from "./data/kdlokasi.json";

interface FilterCardProps {
  filterKey: string;
  filterLabel: string;
  onRemove: () => void;
  activeFilterValues?: Record<string, string>; // Values from other active filters
  onFilterChange?: (filterKey: string, field: string, value: string) => void; // Callback for value changes
}

export function FilterCard({
  filterKey,
  filterLabel,
  onRemove,
  activeFilterValues = {},
  onFilterChange,
}: FilterCardProps) {
  const [filterData, setFilterData] = useState({
    selection: "all", // Default to "Semua"
    kondisiCode: "",
    mengandungKata: "",
    jenisTampilan: "kode", // Default to "Kode"
  });

  // Track if initial notification has been sent to prevent infinite loops
  const initialNotificationSent = useRef(false);

  // Handle hierarchical dependencies - clear child selections when parent changes
  useEffect(() => {
    // Clear eselonI selection when kementerian changes
    if (filterKey === "eselonI") {
      const currentKementerian = activeFilterValues?.kementerian;
      if (currentKementerian && filterData.selection) {
        // Check if current selection is still valid for the new parent
        const validOptions = getFilterOptions("eselonI");
        const isValid = validOptions.some(
          (option) => option.value === filterData.selection
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
        }
      }
    }

    // Clear KPPN selection when kanwil changes
    if (filterKey === "kppn") {
      const currentKanwil = activeFilterValues?.kanwil;
      if (currentKanwil && filterData.selection) {
        // Check if current selection is still valid for the new parent
        const validOptions = getFilterOptions("kppn");
        const isValid = validOptions.some(
          (option) => option.value === filterData.selection
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
        }
      }
    }
  }, [activeFilterValues, filterKey, filterData.selection]);

  // Notify parent about initial default values (only once on mount)
  useEffect(() => {
    if (onFilterChange && !initialNotificationSent.current) {
      onFilterChange(filterKey, "selection", "all");
      initialNotificationSent.current = true;
    }
  }, [filterKey, onFilterChange]);

  // Get filter options based on filter type - using real JSON data
  const getFilterOptions = (key: string) => {
    const commonOptions = [{ value: "all", label: "Semua" }];

    try {
      switch (key) {
        case "kementerian":
          // Use kddept.json data
          const kementarianOptions = (kddeptData as any[]).map((item: any) => ({
            value: item.kddept,
            label: `${item.kddept} - ${item.nmdept}`,
          }));
          return [...commonOptions, ...kementarianOptions];

        case "eselonI":
          // Use kdunit.json data for Unit Eselon I - filter by selected Kementerian
          let eselonIData = kdunitData as any[];

          // Filter by parent Kementerian if selected
          const selectedKementerian = activeFilterValues?.kementerian;
          if (selectedKementerian && selectedKementerian !== "all") {
            eselonIData = eselonIData.filter(
              (item: any) => item.kddept === selectedKementerian
            );
          }

          const eselonIOptions = eselonIData.map((item: any) => ({
            value: item.kdunit,
            label: `${item.kdunit} - ${item.nmunit}`,
          }));
          return [...commonOptions, ...eselonIOptions];

        case "kanwil":
          // Use kdkanwil.json data
          const kanwilOptions = (kdkanwilData as any[]).map((item: any) => ({
            value: item.kdkanwil,
            label: `${item.kdkanwil} - ${item.nmkanwil}`,
          }));
          return [...commonOptions, ...kanwilOptions];

        case "kppn":
          // Use kdkppn.json data - filter by selected Kanwil
          let kppnData = kdkppnData as any[];

          // Filter by parent Kanwil if selected
          const selectedKanwil = activeFilterValues?.kanwil;
          if (selectedKanwil && selectedKanwil !== "all") {
            kppnData = kppnData.filter(
              (item: any) => item.kdkanwil === selectedKanwil
            );
          }

          const kppnOptions = kppnData.map((item: any) => ({
            value: item.kdkppn,
            label: `${item.kdkppn} - ${item.nmkppn}`,
          }));
          return [...commonOptions, ...kppnOptions];

        case "provinsi":
          // Use kdlokasi.json data
          const provinsiOptions = (kdlokasiData as any[]).map((item: any) => ({
            value: item.kdlokasi,
            label: `${item.kdlokasi} - ${item.nmlokasi}`,
          }));
          return [...commonOptions, ...provinsiOptions];

        // For other filter types, return mock data
        case "satker":
          return [
            ...commonOptions,
            { value: "001001", label: "001001 - Sekretariat Jenderal" },
            { value: "001002", label: "001002 - Inspektorat Jenderal" },
            { value: "001003", label: "001003 - Biro Perencanaan" },
          ];
        case "fungsi":
          return [
            ...commonOptions,
            { value: "01", label: "01 - Pelayanan Umum" },
            { value: "02", label: "02 - Pertahanan" },
            { value: "03", label: "03 - Ketertiban dan Keamanan" },
            { value: "04", label: "04 - Ekonomi" },
          ];
        case "subFungsi":
          return [
            ...commonOptions,
            { value: "01.01", label: "01.01 - Lembaga Eksekutif" },
            { value: "01.02", label: "01.02 - Lembaga Legislatif" },
            { value: "02.01", label: "02.01 - Pertahanan Militer" },
          ];
        case "program":
          return [
            ...commonOptions,
            { value: "001", label: "001 - Program Dukungan Manajemen" },
            { value: "002", label: "002 - Program Peningkatan Sarana" },
            { value: "003", label: "003 - Program Pengawasan Intern" },
          ];
        case "kegiatan":
          return [
            ...commonOptions,
            { value: "001", label: "001 - Perencanaan Program" },
            { value: "002", label: "002 - Koordinasi dan Sinkronisasi" },
            { value: "003", label: "003 - Monitoring dan Evaluasi" },
          ];
        case "akun":
          return [
            ...commonOptions,
            { value: "511111", label: "511111 - Gaji Pokok PNS" },
            { value: "521111", label: "521111 - Belanja Barang" },
            { value: "531111", label: "531111 - Belanja Modal" },
          ];
        default:
          return commonOptions;
      }
    } catch (error) {
      console.error(`Error loading data for filter ${key}:`, error);
      return commonOptions;
    }
  };

  const jenisTampilanOptions = [
    { value: "kode", label: "Kode" },
    { value: "kode_uraian", label: "Kode Uraian" },
    { value: "uraian", label: "Uraian" },
    { value: "jangan_tampilkan", label: "Jangan Tampilkan" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFilterData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Notify parent component about value changes for hierarchical filtering
    if (onFilterChange && field === "selection") {
      onFilterChange(filterKey, field, value);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{filterLabel}</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0"
          title={`Hapus filter ${filterLabel}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* All filter fields in 4-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Selection Dropdown */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pilihan {filterLabel}</Label>
            <VirtualizedSelect
              options={getFilterOptions(filterKey)}
              value={filterData.selection}
              onValueChange={(value) => handleInputChange("selection", value)}
              placeholder={`Pilih ${filterLabel.toLowerCase()}`}
              className="w-full"
            />
          </div>

          {/* Kondisi Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Kondisi</Label>
            <Input
              placeholder="Kode kondisi"
              value={filterData.kondisiCode}
              onChange={(e) => handleInputChange("kondisiCode", e.target.value)}
            />
          </div>

          {/* Mengandung Kata Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Mengandung Kata</Label>
            <Input
              placeholder="Kata kunci"
              value={filterData.mengandungKata}
              onChange={(e) =>
                handleInputChange("mengandungKata", e.target.value)
              }
            />
          </div>

          {/* Jenis Tampilan Dropdown */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Jenis Tampilan</Label>
            <Select
              value={filterData.jenisTampilan}
              onValueChange={(value) =>
                handleInputChange("jenisTampilan", value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih tampilan" />
              </SelectTrigger>
              <SelectContent>
                {jenisTampilanOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
