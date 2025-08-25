"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VirtualizedSelect } from "@/components/ui/virtualized-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import kddekonData from "./data/kddekon.json";
import kdkabkotaData from "./data/kdkabkota.json";
import kdsatkerData from "./data/kdsatker.json";
import kdfungsiData from "./data/kdfungsi.json";
import kdsfungData from "./data/kdsfung.json";
import kdprogramData from "./data/kdprogram.json";
import kdgiatData from "./data/kdgiat.json";
import kdoutputData from "./data/kdoutput.json";
import kdsoutputData from "./data/kdsoutput.json";
import kdakunData from "./data/kdakun.json";
import kdbkpkData from "./data/kdbkpk.json";
import kdgbkpkData from "./data/kdgbkpk.json";
import kdsdanaData from "./data/kdsdana.json";

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
  // Get current month for cutOff filter default
  const getCurrentMonth = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return month;
  };

  const [filterData, setFilterData] = useState({
    selection: filterKey === "cutOff" ? getCurrentMonth() : "all", // Default to current month for cutOff, "Semua" for others
    kondisiCode: "",
    mengandungKata: "",
    jenisTampilan: "kode", // Default to "Kode"
    akunType: "kodeAkun", // Default to "Kode Akun (6 Digit)" for Akun filter
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

    // Clear Kanwil selection when provinsi changes
    if (filterKey === "kanwil") {
      const currentProvinsi = activeFilterValues?.provinsi;
      if (currentProvinsi && filterData.selection) {
        // Check if current selection is still valid for the new parent
        const validOptions = getFilterOptions("kanwil");
        const isValid = validOptions.some(
          (option) => option.value === filterData.selection
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
        }
      }
    }

    // Clear Kabkota selection when provinsi changes
    if (filterKey === "kabkota") {
      const currentProvinsi = activeFilterValues?.provinsi;
      if (currentProvinsi && filterData.selection) {
        // Check if current selection is still valid for the new parent
        const validOptions = getFilterOptions("kabkota");
        const isValid = validOptions.some(
          (option) => option.value === filterData.selection
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
        }
      }
    }

    // Clear Satker selection when kementerian, kanwil, or kppn changes
    if (filterKey === "satker") {
      const currentKementerian = activeFilterValues?.kementerian;
      const currentKanwil = activeFilterValues?.kanwil;
      const currentKppn = activeFilterValues?.kppn;

      if (
        (currentKementerian || currentKanwil || currentKppn) &&
        filterData.selection
      ) {
        // Check if current selection is still valid for the new parent(s)
        const validOptions = getFilterOptions("satker");
        const isValid = validOptions.some(
          (option) => option.value === filterData.selection
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
        }
      }
    }

    // Clear SubFungsi selection when fungsi changes
    if (filterKey === "subFungsi") {
      const currentFungsi = activeFilterValues?.fungsi;
      if (currentFungsi && filterData.selection) {
        // Check if current selection is still valid for the new parent
        const validOptions = getFilterOptions("subFungsi");
        const isValid = validOptions.some(
          (option) => option.value === filterData.selection
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
        }
      }
    }

    // Clear Program selection when kementerian or eselonI changes
    if (filterKey === "program") {
      const currentKementerian = activeFilterValues?.kementerian;
      const currentEselonI = activeFilterValues?.eselonI;

      if ((currentKementerian || currentEselonI) && filterData.selection) {
        // Check if current selection is still valid for the new parent(s)
        const validOptions = getFilterOptions("program");
        const isValid = validOptions.some(
          (option) => option.value === filterData.selection
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
        }
      }
    }

    // Clear Kegiatan selection when kementerian, eselonI, or program changes
    if (filterKey === "kegiatan") {
      const currentKementerian = activeFilterValues?.kementerian;
      const currentEselonI = activeFilterValues?.eselonI;
      const currentProgram = activeFilterValues?.program;

      if (
        (currentKementerian || currentEselonI || currentProgram) &&
        filterData.selection
      ) {
        // Check if current selection is still valid for the new parent(s)
        const validOptions = getFilterOptions("kegiatan");
        const isValid = validOptions.some(
          (option) => option.value === filterData.selection
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
        }
      }
    }

    // Clear OutputKro selection when kementerian, eselonI, program, or kegiatan changes
    if (filterKey === "outputKro") {
      const currentKementerian = activeFilterValues?.kementerian;
      const currentEselonI = activeFilterValues?.eselonI;
      const currentProgram = activeFilterValues?.program;
      const currentKegiatan = activeFilterValues?.kegiatan;

      if (
        (currentKementerian ||
          currentEselonI ||
          currentProgram ||
          currentKegiatan) &&
        filterData.selection
      ) {
        // Check if current selection is still valid for the new parent(s)
        const validOptions = getFilterOptions("outputKro");
        const isValid = validOptions.some(
          (option) => option.value === filterData.selection
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
        }
      }
    }

    // Clear SubOutputRo selection when kementerian, eselonI, program, kegiatan, or outputKro changes
    if (filterKey === "subOutputRo") {
      const currentKementerian = activeFilterValues?.kementerian;
      const currentEselonI = activeFilterValues?.eselonI;
      const currentProgram = activeFilterValues?.program;
      const currentKegiatan = activeFilterValues?.kegiatan;
      const currentOutputKro = activeFilterValues?.outputKro;

      if (
        (currentKementerian ||
          currentEselonI ||
          currentProgram ||
          currentKegiatan ||
          currentOutputKro) &&
        filterData.selection
      ) {
        // Check if current selection is still valid for the new parent(s)
        const validOptions = getFilterOptions("subOutputRo");
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
      const initialValue = filterKey === "cutOff" ? getCurrentMonth() : "all";
      onFilterChange(filterKey, "selection", initialValue);
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
          // Use kdkanwil.json data - filter by selected Provinsi
          let kanwilData = kdkanwilData as any[];

          // Filter by parent Provinsi if selected
          const selectedProvinsiForKanwil = activeFilterValues?.provinsi;
          if (
            selectedProvinsiForKanwil &&
            selectedProvinsiForKanwil !== "all"
          ) {
            kanwilData = kanwilData.filter(
              (item: any) => item.kdlokasi === selectedProvinsiForKanwil
            );
          }

          const kanwilOptions = kanwilData.map((item: any) => ({
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

        case "kewenangan":
          // Use kddekon.json data - get unique kewenangan options
          const uniqueKewenangan = new Map();
          (kddekonData as any[]).forEach((item: any) => {
            if (!uniqueKewenangan.has(item.kddekon)) {
              uniqueKewenangan.set(item.kddekon, {
                value: item.kddekon,
                label: `${item.kddekon} - ${item.nmdekon}`,
              });
            }
          });
          const kewenanganOptions = Array.from(uniqueKewenangan.values());
          return [...commonOptions, ...kewenanganOptions];

        case "provinsi":
          // Use kdlokasi.json data
          const provinsiOptions = (kdlokasiData as any[]).map((item: any) => ({
            value: item.kdlokasi,
            label: `${item.kdlokasi} - ${item.nmlokasi}`,
          }));
          return [...commonOptions, ...provinsiOptions];

        case "kabkota":
          // Use kdkabkota.json data - filter by selected Provinsi
          let kabkotaData = kdkabkotaData as any[];

          // Filter by parent Provinsi if selected
          const selectedProvinsi = activeFilterValues?.provinsi;
          if (selectedProvinsi && selectedProvinsi !== "all") {
            kabkotaData = kabkotaData.filter(
              (item: any) => item.kdlokasi === selectedProvinsi
            );
          }

          const kabkotaOptions = kabkotaData.map((item: any) => ({
            value: item.kdkabkota,
            label: `${item.kdkabkota} - ${item.nmkabkota}`,
          }));
          return [...commonOptions, ...kabkotaOptions];

        case "satker":
          // Use kdsatker.json data - filter by selected Kementerian, Kanwil, and KPPN
          let satkerData = kdsatkerData as any[];

          // Filter by parent Kementerian if selected
          const selectedKementarianForSatker = activeFilterValues?.kementerian;
          if (
            selectedKementarianForSatker &&
            selectedKementarianForSatker !== "all"
          ) {
            satkerData = satkerData.filter(
              (item: any) => item.kddept === selectedKementarianForSatker
            );
          }

          // Filter by parent Kanwil if selected
          const selectedKanwilForSatker = activeFilterValues?.kanwil;
          if (selectedKanwilForSatker && selectedKanwilForSatker !== "all") {
            satkerData = satkerData.filter(
              (item: any) => item.kdkanwil === selectedKanwilForSatker
            );
          }

          // Filter by parent KPPN if selected
          const selectedKppnForSatker = activeFilterValues?.kppn;
          if (selectedKppnForSatker && selectedKppnForSatker !== "all") {
            satkerData = satkerData.filter(
              (item: any) => item.kdkppn === selectedKppnForSatker
            );
          }

          const satkerOptions = satkerData.map((item: any) => ({
            value: item.kdsatker,
            label: `${item.kdsatker} - ${item.nmsatker}`,
          }));
          return [...commonOptions, ...satkerOptions];

        // For other filter types, return mock data
        case "fungsi":
          // Use kdfungsi.json data
          const fungsiOptions = (kdfungsiData as any[]).map((item: any) => ({
            value: item.kdfungsi,
            label: `${item.kdfungsi} - ${item.nmfungsi}`,
          }));
          return [...commonOptions, ...fungsiOptions];
        case "subFungsi":
          // Use kdsfung.json data - filter by selected Fungsi
          let subFungsiData = kdsfungData as any[];

          // Filter by parent Fungsi if selected
          const selectedFungsi = activeFilterValues?.fungsi;
          if (selectedFungsi && selectedFungsi !== "all") {
            subFungsiData = subFungsiData.filter(
              (item: any) => item.kdfungsi === selectedFungsi
            );
          }

          const subFungsiOptions = subFungsiData.map((item: any) => ({
            value: item.kdsfung,
            label: `${item.kdfungsi}.${item.kdsfung} - ${item.nmsfung}`,
          }));
          return [...commonOptions, ...subFungsiOptions];
        case "program":
          // Use kdprogram.json data - filter by selected Kementerian and Unit Eselon 1
          let programData = kdprogramData as any[];

          // Filter by parent Kementerian if selected
          const selectedKementarianForProgram = activeFilterValues?.kementerian;
          if (
            selectedKementarianForProgram &&
            selectedKementarianForProgram !== "all"
          ) {
            programData = programData.filter(
              (item: any) => item.kddept === selectedKementarianForProgram
            );
          }

          // Filter by parent Unit Eselon 1 if selected
          const selectedEselonI = activeFilterValues?.eselonI;
          if (selectedEselonI && selectedEselonI !== "all") {
            programData = programData.filter(
              (item: any) => item.kdunit === selectedEselonI
            );
          }

          const programOptions = programData.map((item: any) => ({
            value: item.kdprogram,
            label: `${item.kdprogram} - ${item.nmprogram}`,
          }));
          return [...commonOptions, ...programOptions];
        case "kegiatan":
          // Use kdgiat.json data - filter by selected Kementerian, Unit, and Program
          let kegiatanData = kdgiatData as any[];

          // Filter by parent Kementerian if selected
          const selectedKementarianForKegiatan =
            activeFilterValues?.kementerian;
          if (
            selectedKementarianForKegiatan &&
            selectedKementarianForKegiatan !== "all"
          ) {
            kegiatanData = kegiatanData.filter(
              (item: any) => item.kddept === selectedKementarianForKegiatan
            );
          }

          // Filter by parent Unit if selected
          const selectedUnitForKegiatan = activeFilterValues?.eselonI;
          if (selectedUnitForKegiatan && selectedUnitForKegiatan !== "all") {
            kegiatanData = kegiatanData.filter(
              (item: any) => item.kdunit === selectedUnitForKegiatan
            );
          }

          // Filter by parent Program if selected
          const selectedProgram = activeFilterValues?.program;
          if (selectedProgram && selectedProgram !== "all") {
            kegiatanData = kegiatanData.filter(
              (item: any) => item.kdprogram === selectedProgram
            );
          }

          const kegiatanOptions = kegiatanData.map((item: any) => ({
            value: item.kdgiat,
            label: `${item.kdgiat} - ${item.nmgiat}`,
          }));
          return [...commonOptions, ...kegiatanOptions];

        case "outputKro":
          // Use kdoutput.json data - filter by selected Kementerian, Unit, Program, and Kegiatan
          let outputData = kdoutputData as any[];

          // Filter by parent Kementerian if selected
          const selectedKementarianForOutput = activeFilterValues?.kementerian;
          if (
            selectedKementarianForOutput &&
            selectedKementarianForOutput !== "all"
          ) {
            outputData = outputData.filter(
              (item: any) => item.kddept === selectedKementarianForOutput
            );
          }

          // Filter by parent Unit if selected
          const selectedUnitForOutput = activeFilterValues?.eselonI;
          if (selectedUnitForOutput && selectedUnitForOutput !== "all") {
            outputData = outputData.filter(
              (item: any) => item.kdunit === selectedUnitForOutput
            );
          }

          // Filter by parent Program if selected
          const selectedProgramForOutput = activeFilterValues?.program;
          if (selectedProgramForOutput && selectedProgramForOutput !== "all") {
            outputData = outputData.filter(
              (item: any) => item.kdprogram === selectedProgramForOutput
            );
          }

          // Filter by parent Kegiatan if selected
          const selectedKegiatan = activeFilterValues?.kegiatan;
          if (selectedKegiatan && selectedKegiatan !== "all") {
            outputData = outputData.filter(
              (item: any) => item.kdgiat === selectedKegiatan
            );
          }

          const outputOptions = outputData.map((item: any) => ({
            value: item.kdoutput,
            label: `${item.kdoutput} - ${item.nmoutput}`,
          }));
          return [...commonOptions, ...outputOptions];

        case "subOutputRo":
          // Use kdsoutput.json data - filter by selected Kementerian, Unit, Program, Kegiatan, and Output
          let subOutputData = kdsoutputData as any[];

          // Filter by parent Kementerian if selected
          const selectedKementarianForSubOutput =
            activeFilterValues?.kementerian;
          if (
            selectedKementarianForSubOutput &&
            selectedKementarianForSubOutput !== "all"
          ) {
            subOutputData = subOutputData.filter(
              (item: any) => item.kddept === selectedKementarianForSubOutput
            );
          }

          // Filter by parent Unit if selected
          const selectedUnitForSubOutput = activeFilterValues?.eselonI;
          if (selectedUnitForSubOutput && selectedUnitForSubOutput !== "all") {
            subOutputData = subOutputData.filter(
              (item: any) => item.kdunit === selectedUnitForSubOutput
            );
          }

          // Filter by parent Program if selected
          const selectedProgramForSubOutput = activeFilterValues?.program;
          if (
            selectedProgramForSubOutput &&
            selectedProgramForSubOutput !== "all"
          ) {
            subOutputData = subOutputData.filter(
              (item: any) => item.kdprogram === selectedProgramForSubOutput
            );
          }

          // Filter by parent Kegiatan if selected
          const selectedKegiatanForSubOutput = activeFilterValues?.kegiatan;
          if (
            selectedKegiatanForSubOutput &&
            selectedKegiatanForSubOutput !== "all"
          ) {
            subOutputData = subOutputData.filter(
              (item: any) => item.kdgiat === selectedKegiatanForSubOutput
            );
          }

          // Filter by parent Output if selected
          const selectedOutput = activeFilterValues?.outputKro;
          if (selectedOutput && selectedOutput !== "all") {
            subOutputData = subOutputData.filter(
              (item: any) => item.kdoutput === selectedOutput
            );
          }

          const subOutputOptions = subOutputData.map((item: any) => ({
            value: item.kdsoutput,
            label: `${item.kdsoutput} - ${item.nmsoutput}`,
          }));
          return [...commonOptions, ...subOutputOptions];

        case "akun":
          // Use different JSON data based on account type selection
          const akunType = filterData.akunType || "jenisBelanja";

          if (akunType === "jenisBelanja") {
            // Use kdgbkpk.json data for Jenis Belanja (2 Digit)
            const jenisBelanjaOptions = (kdgbkpkData as any[]).map(
              (item: any) => ({
                value: item.kdgbkpk,
                label: `${item.kdgbkpk} - ${item.nmgbkpk}`,
              })
            );
            return [...commonOptions, ...jenisBelanjaOptions];
          } else if (akunType === "kodeBkpk") {
            // Use kdbkpk.json data for Kode BKPK (4 Digit)
            const kodeBkpkOptions = (kdbkpkData as any[]).map((item: any) => ({
              value: item.kdbkpk,
              label: `${item.kdbkpk} - ${item.nmbkpk}`,
            }));
            return [...commonOptions, ...kodeBkpkOptions];
          } else if (akunType === "kodeAkun") {
            // Use kdakun.json data for Kode Akun (6 Digit)
            const kodeAkunOptions = (kdakunData as any[]).map((item: any) => ({
              value: item.kdakun,
              label: `${item.kdakun} - ${item.nmakun}`,
            }));
            return [...commonOptions, ...kodeAkunOptions];
          }

          return commonOptions;

        case "sumberDana":
          // Use kdsdana.json data for Sumber Dana
          const sumberDanaOptions = (kdsdanaData as any[]).map((item: any) => ({
            value: item.kdsdana,
            label: `${item.kdsdana} - ${item.nmsdana}`,
          }));
          return [...commonOptions, ...sumberDanaOptions];

        case "cutOff":
          // Generate month options (without year since year is selected in Pilih Laporan card)
          const months = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
          ];
          
          const monthOptions = [];
          
          // Add months 1-12
          for (let month = 1; month <= 12; month++) {
            const monthStr = String(month).padStart(2, '0');
            const value = monthStr;
            const label = months[month - 1];
            monthOptions.push({ value, label });
          }
          
          return monthOptions;

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
    setFilterData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };

      // Mutual exclusion logic: clear other filter fields when one is used
      if (field === "selection" && value !== "all") {
        // Clear other filters when main selection is made
        newData.kondisiCode = "";
        newData.mengandungKata = "";
        
        // Notify parent about cleared fields
        if (onFilterChange) {
          setTimeout(() => {
            onFilterChange(filterKey, "kondisiCode", "");
            onFilterChange(filterKey, "mengandungKata", "");
          }, 0);
        }
      } else if (field === "kondisiCode" && value.trim()) {
        // Clear other filters when kondisi is used
        newData.selection = "all";
        newData.mengandungKata = "";
        
        // Notify parent about cleared fields
        if (onFilterChange) {
          setTimeout(() => {
            onFilterChange(filterKey, "selection", "all");
            onFilterChange(filterKey, "mengandungKata", "");
          }, 0);
        }
      } else if (field === "mengandungKata" && value.trim()) {
        // Clear other filters when mengandung kata is used
        newData.selection = "all";
        newData.kondisiCode = "";
        
        // Notify parent about cleared fields
        if (onFilterChange) {
          setTimeout(() => {
            onFilterChange(filterKey, "selection", "all");
            onFilterChange(filterKey, "kondisiCode", "");
          }, 0);
        }
      }

      // Auto-change jenisTampilan to "kode_uraian" when mengandungKata is entered
      // This makes sense because mengandungKata searches in description, so user should see both code and description
      if (field === "mengandungKata" && value.trim() && prev.jenisTampilan !== "kode_uraian") {
        newData.jenisTampilan = "kode_uraian";
        
        // Notify parent about the auto-change
        if (onFilterChange) {
          setTimeout(() => {
            onFilterChange(filterKey, "jenisTampilan", "kode_uraian");
          }, 0);
        }
      }

      // Reset jenisTampilan back to "kode" if mengandungKata is cleared and it was auto-changed
      if (field === "mengandungKata" && !value.trim() && prev.jenisTampilan === "kode_uraian") {
        // Only reset if user hasn't manually selected kode_uraian for other reasons
        // We can't easily track this, so we'll leave it as is for now
        // User can manually change it back if needed
      }

      return newData;
    });

    // Notify parent component about value changes
    if (onFilterChange) {
      onFilterChange(filterKey, field, value);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{filterLabel}</CardTitle>
        {/* Hide remove button for mandatory cutOff filter */}
        {filterKey !== "cutOff" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0"
            title={`Hapus filter ${filterLabel}`}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Special layout for Cut Off filter */}
        {filterKey === "cutOff" ? (
          <div className="space-y-4">
            {/* Month Selection Only */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Pilih Bulan</Label>
              <VirtualizedSelect
                options={getFilterOptions(filterKey)}
                value={filterData.selection}
                onValueChange={(value) => handleInputChange("selection", value)}
                placeholder="Pilih bulan"
                className="w-full"
              />
            </div>
          </div>
        ) : /* Special layout for Akun filter */
        filterKey === "akun" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Account Type and Selection - Stacked in same column */}
            <div className="space-y-4">
              {/* Account Type Selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipe Akun</Label>
                <Select
                  value={filterData.akunType}
                  onValueChange={(value) => {
                    handleInputChange("akunType", value);
                    // Reset selection when account type changes
                    handleInputChange("selection", "all");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih tipe akun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jenisBelanja">
                      Jenis Belanja (2 Digit)
                    </SelectItem>
                    <SelectItem value="kodeBkpk">
                      Kode BKPK (4 Digit)
                    </SelectItem>
                    <SelectItem value="kodeAkun">
                      Kode Akun (6 Digit)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selection Dropdown */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Pilihan Akun</Label>
                <VirtualizedSelect
                  options={getFilterOptions(filterKey)}
                  value={filterData.selection}
                  onValueChange={(value) =>
                    handleInputChange("selection", value)
                  }
                  placeholder="Pilih akun"
                  className="w-full"
                />
              </div>
            </div>

            {/* Kondisi Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Kondisi</Label>
              <Input
                placeholder="Kode kondisi"
                value={filterData.kondisiCode}
                onChange={(e) =>
                  handleInputChange("kondisiCode", e.target.value)
                }
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
        ) : (
          /* Standard layout for all other filters */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Selection Dropdown */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Pilihan {filterLabel}
              </Label>
              <VirtualizedSelect
                options={getFilterOptions(filterKey)}
                value={filterData.selection}
                onValueChange={(value) => handleInputChange("selection", value)}
                placeholder={`Pilih ${filterLabel.toLowerCase()}`}
                className={cn(
                  "w-full",
                  ((filterData.kondisiCode && filterData.kondisiCode.trim()) ||
                   (filterData.mengandungKata && filterData.mengandungKata.trim())) && 
                  "opacity-50 cursor-not-allowed"
                )}
                disabled={
                  (filterData.kondisiCode && filterData.kondisiCode.trim()) ||
                  (filterData.mengandungKata && filterData.mengandungKata.trim())
                }
              />
              {((filterData.kondisiCode && filterData.kondisiCode.trim()) ||
                (filterData.mengandungKata && filterData.mengandungKata.trim())) && (
                <p className="text-xs text-amber-600">
                  ⚠️ Dinonaktifkan karena filter lain sedang digunakan
                </p>
              )}
            </div>

            {/* Kondisi Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Kondisi</Label>
              <Input
                placeholder="Kode kondisi (pisahkan dengan koma)"
                value={filterData.kondisiCode}
                onChange={(e) =>
                  handleInputChange("kondisiCode", e.target.value)
                }
                disabled={
                  (filterData.selection && filterData.selection !== "all") ||
                  (filterData.mengandungKata && filterData.mengandungKata.trim())
                }
                className={cn(
                  ((filterData.selection && filterData.selection !== "all") ||
                   (filterData.mengandungKata && filterData.mengandungKata.trim())) && 
                  "opacity-50 cursor-not-allowed"
                )}
              />
              {filterData.kondisiCode && filterData.kondisiCode.trim() && (
                <p className="text-xs text-muted-foreground">
                  💡 Contoh: 001,002,003 untuk multiple kode
                </p>
              )}
              {((filterData.selection && filterData.selection !== "all") ||
                (filterData.mengandungKata && filterData.mengandungKata.trim())) && (
                <p className="text-xs text-amber-600">
                  ⚠️ Dinonaktifkan karena filter lain sedang digunakan
                </p>
              )}
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
                disabled={
                  (filterData.selection && filterData.selection !== "all") ||
                  (filterData.kondisiCode && filterData.kondisiCode.trim())
                }
                className={cn(
                  ((filterData.selection && filterData.selection !== "all") ||
                   (filterData.kondisiCode && filterData.kondisiCode.trim())) && 
                  "opacity-50 cursor-not-allowed"
                )}
              />
              {filterData.mengandungKata && filterData.mengandungKata.trim() && (
                <p className="text-xs text-muted-foreground">
                  💡 Pencarian dilakukan pada kolom deskripsi
                </p>
              )}
              {((filterData.selection && filterData.selection !== "all") ||
                (filterData.kondisiCode && filterData.kondisiCode.trim())) && (
                <p className="text-xs text-amber-600">
                  ⚠️ Dinonaktifkan karena filter lain sedang digunakan
                </p>
              )}
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
              {filterData.mengandungKata && filterData.mengandungKata.trim() && filterData.jenisTampilan === "kode_uraian" && (
                <p className="text-xs text-blue-600">
                  ℹ️ Otomatis diubah ke "Kode Uraian" untuk pencarian teks
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
