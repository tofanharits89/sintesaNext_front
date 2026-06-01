"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  Filter,
  Building2,
  MapPin,
  Calendar,
  CreditCard,
  Users,
  Target,
  Briefcase,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
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
// PN hierarchy JSONs
import kdpnData from "./data/kdpn.json";
import kdppData from "./data/kdpp.json";
import kdkpData from "./data/kdkp.json";
import kdproyData from "./data/kdproy.json";
// Major Project JSON
import kdmpData from "./data/kdmp.json";
// Inflation JSON files
import infIntervensiData from "./data/inf_intervensi.json";
import infPengeluaranData from "./data/inf_pengeluaran.json";
// Program Strategis JSON
import kdprogisData from "./data/kdprogis.json";
// Tematik Anggaran JSON
import kdtemaData from "./data/kdtema.json";
// Status Sumber JSON
import statusSumberData from "./data/status_sumber.json";

type Option = { value: string; label: string };

type Kddept = { kddept: string; nmdept: string };
type Kdunit = { kdunit: string; nmunit: string; kddept: string };
type Kdkanwil = { kdkanwil: string; nmkanwil: string; kdlokasi: string };
type Kdkppn = { kdkppn: string; nmkppn: string; kdkanwil: string };
type Kdlokasi = { kdlokasi: string; nmlokasi: string };
type Kddekon = { kddekon: string; nmdekon: string };
type Kdkabkota = { kdkabkota: string; nmkabkota: string; kdlokasi: string };

const KDDEPT: Kddept[] = kddeptData as Kddept[];
const KDUNIT: Kdunit[] = kdunitData as Kdunit[];
const KDKANWIL: Kdkanwil[] = kdkanwilData as Kdkanwil[];
const KDKPPN: Kdkppn[] = kdkppnData as Kdkppn[];
const KDLOKASI: Kdlokasi[] = kdlokasiData as Kdlokasi[];
const KDDEKON: Kddekon[] = kddekonData as Kddekon[];
const KDKABKOTA: Kdkabkota[] = kdkabkotaData as Kdkabkota[];

interface FilterCardProps {
  filterKey: string;
  filterLabel: string;
  onRemove: () => void;
  activeFilterValues?: Record<string, string>; // Values from other active filters
  currentFilterValue?: {
    selection?: string;
    kondisiCode?: string;
    mengandungKata?: string;
    jenisTampilan?: string;
    akunType?: string;
    subSelection?: string;
  }; // Current filter's values from parent (for loading saved queries)
  onFilterChange?: (filterKey: string, field: string, value: string) => void; // Callback for value changes
  removable?: boolean; // Optional: hide remove button for mandatory cards
}

// Helper function to get appropriate icon for each filter type
const getFilterIcon = (filterKey: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    cutOff: <Calendar className="h-4 w-4" />,
    kementerian: <Building2 className="h-4 w-4" />,
    eselonI: <Users className="h-4 w-4" />,
    kewenangan: <Settings className="h-4 w-4" />,
    provinsi: <MapPin className="h-4 w-4" />,
    kabkota: <MapPin className="h-4 w-4" />,
    kanwil: <Building2 className="h-4 w-4" />,
    kppn: <Building2 className="h-4 w-4" />,
    satker: <Briefcase className="h-4 w-4" />,
    fungsi: <Target className="h-4 w-4" />,
    subFungsi: <Target className="h-4 w-4" />,
    program: <Target className="h-4 w-4" />,
    kegiatan: <Target className="h-4 w-4" />,
    outputKro: <Target className="h-4 w-4" />,
    subOutputRo: <Target className="h-4 w-4" />,
    akun: <CreditCard className="h-4 w-4" />,
    sumberDana: <CreditCard className="h-4 w-4" />,
    register: <Settings className="h-4 w-4" />,
    jenisPn: <Target className="h-4 w-4" />,
    programPrioritas: <Target className="h-4 w-4" />,
    kegiatanPrioritas: <Target className="h-4 w-4" />,
    proyekPrioritas: <Target className="h-4 w-4" />,
    jenisMajorProject: <Target className="h-4 w-4" />,
    belanjaPemilu: <Settings className="h-4 w-4" />,
    ibuKotaNusantara: <Settings className="h-4 w-4" />,
    ketahananPangan: <Settings className="h-4 w-4" />,
    swasembadaPangan: <Settings className="h-4 w-4" />,
    belanjaPemerintah: <Settings className="h-4 w-4" />,
    mbgIntervensi: <Target className="h-4 w-4" />,
    jenisProgramStrategis: <Target className="h-4 w-4" />,
    jenisTemaAnggaran: <Target className="h-4 w-4" />,
    jenisKontrak: <Settings className="h-4 w-4" />,
    statusSumber: <Settings className="h-4 w-4" />,
  };

  return iconMap[filterKey] || <Filter className="h-4 w-4" />;
};

/**
 * Deduplicate options by value to prevent React "duplicate key" warnings
 */
const deduplicateOptions = (options: Option[]): Option[] => {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
};

export function FilterCard({
  filterKey,
  filterLabel,
  onRemove,
  activeFilterValues = {},
  currentFilterValue,
  onFilterChange,
}: FilterCardProps) {
  // Get current month for cutOff filter default
  const getCurrentMonth = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return month;
  };

  const [filterData, setFilterData] = useState({
    selection:
      filterKey === "cutOff"
        ? getCurrentMonth()
        : filterKey === "jenisTemaAnggaran"
          ? "000"
          : "all", // Default to "000" for Jenis Tema Anggaran, "Semua" for others
    kondisiCode: filterKey === "cutOff" ? "equals" : "",
    mengandungKata: "",
    jenisTampilan: "kode", // Default to "Kode"
    akunType: "kodeAkun", // Default to "Kode Akun (6 Digit)" for Akun filter
    subSelection: filterKey === "levelAPBD" ? "6" : "", // Default to Level 6 for APBD Level filter
  });

  // Special handling flags for boolean switch filters (no options/tampilan/kondisi/kata)
  const isKemiskinanEkstrim = filterKey === "kemiskinanEkstrim";
  const isBelanjaPemilu = filterKey === "belanjaPemilu";
  const isIbuKotaNusantara = filterKey === "ibuKotaNusantara";
  const isKetahananPangan = filterKey === "ketahananPangan";
  const isSwasembadaPangan = filterKey === "swasembadaPangan";
  const isBelanjaPemerintah = filterKey === "belanjaPemerintah";
  const isBooleanSwitch =
    isKemiskinanEkstrim ||
    isBelanjaPemilu ||
    isIbuKotaNusantara ||
    isKetahananPangan ||
    isSwasembadaPangan ||
    isBelanjaPemerintah;

  // Track if initial notification has been sent to prevent infinite loops
  const initialNotificationSent = useRef(false);
  // Track if current component just loaded values from a saved query
  const loadedFromSavedRef = useRef(false);

  // Sync internal state with external currentFilterValue (for loading saved queries)
  useEffect(() => {
    if (currentFilterValue) {
      setFilterData((prev) => {
        const newState = {
          ...prev,
          selection: currentFilterValue.selection ?? prev.selection,
          kondisiCode: currentFilterValue.kondisiCode ?? prev.kondisiCode,
          mengandungKata:
            currentFilterValue.mengandungKata ?? prev.mengandungKata,
          jenisTampilan: currentFilterValue.jenisTampilan ?? prev.jenisTampilan,
          akunType: currentFilterValue.akunType ?? prev.akunType,
          subSelection: currentFilterValue.subSelection ?? prev.subSelection,
        };
        return newState;
      });
      // Mark that we initialized from a saved query so dependency clearing can skip once
      loadedFromSavedRef.current = true;
    }
  }, [currentFilterValue, filterKey]);

  // Handle hierarchical dependencies - clear child selections when parent changes
  useEffect(() => {
    // Skip clearing on the very first run after hydrating from saved values
    if (loadedFromSavedRef.current) {
      loadedFromSavedRef.current = false;
      return;
    }
    // Clear eselonI selection when kementerian changes
    if (filterKey === "eselonI") {
      const currentKementerian = activeFilterValues?.kementerian;
      if (currentKementerian && filterData.selection) {
        // Check if current selection is still valid for the new parent
        const validOptions = getFilterOptions("eselonI");
        const isValid = validOptions.some(
          (option) => option.value === filterData.selection,
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
          // Notify parent about the reset
          if (onFilterChange) {
            onFilterChange(filterKey, "selection", "all");
          }
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
          (option) => option.value === filterData.selection,
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
          // Notify parent about the reset
          if (onFilterChange) {
            onFilterChange(filterKey, "selection", "all");
          }
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
          (option) => option.value === filterData.selection,
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
          // Notify parent about the reset
          if (onFilterChange) {
            onFilterChange(filterKey, "selection", "all");
          }
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
          (option) => option.value === filterData.selection,
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
          // Notify parent about the reset
          if (onFilterChange) {
            onFilterChange(filterKey, "selection", "all");
          }
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
          (option) => option.value === filterData.selection,
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
          // Notify parent about the reset
          if (onFilterChange) {
            onFilterChange(filterKey, "selection", "all");
          }
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
          (option) => option.value === filterData.selection,
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
          // Notify parent about the reset
          if (onFilterChange) {
            onFilterChange(filterKey, "selection", "all");
          }
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
          (option) => option.value === filterData.selection,
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
          // Notify parent about the reset
          if (onFilterChange) {
            onFilterChange(filterKey, "selection", "all");
          }
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
          (option) => option.value === filterData.selection,
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
          // Notify parent about the reset
          if (onFilterChange) {
            onFilterChange(filterKey, "selection", "all");
          }
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
          (option) => option.value === filterData.selection,
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
          // Notify parent about the reset
          if (onFilterChange) {
            onFilterChange(filterKey, "selection", "all");
          }
        }
      }
    }

    // Clear Program Prioritas when Jenis PN changes
    if (filterKey === "programPrioritas") {
      const currentPn = activeFilterValues?.jenisPn;
      if (currentPn && filterData.selection) {
        const validOptions = getFilterOptions("programPrioritas");
        const isValid = validOptions.some(
          (o) => o.value === filterData.selection,
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" }));
          if (onFilterChange) onFilterChange(filterKey, "selection", "all");
        }
      }
    }

    // Clear Kegiatan Prioritas when Jenis PN or Program Prioritas changes
    if (filterKey === "kegiatanPrioritas") {
      const currentPn = activeFilterValues?.jenisPn;
      const currentPp = activeFilterValues?.programPrioritas;
      if ((currentPn || currentPp) && filterData.selection) {
        const validOptions = getFilterOptions("kegiatanPrioritas");
        const isValid = validOptions.some(
          (o) => o.value === filterData.selection,
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" }));
          if (onFilterChange) onFilterChange(filterKey, "selection", "all");
        }
      }
    }

    // Clear Proyek Prioritas when Jenis PN, Program Prioritas, or Kegiatan Prioritas changes
    if (filterKey === "proyekPrioritas") {
      const currentPn = activeFilterValues?.jenisPn;
      const currentPp = activeFilterValues?.programPrioritas;
      const currentKp = activeFilterValues?.kegiatanPrioritas;
      if ((currentPn || currentPp || currentKp) && filterData.selection) {
        const validOptions = getFilterOptions("proyekPrioritas");
        const isValid = validOptions.some(
          (o) => o.value === filterData.selection,
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" }));
          if (onFilterChange) onFilterChange(filterKey, "selection", "all");
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
          (option) => option.value === filterData.selection,
        );
        if (!isValid) {
          setFilterData((prev) => ({ ...prev, selection: "all" })); // Reset to default
          // Notify parent about the reset
          if (onFilterChange) {
            onFilterChange(filterKey, "selection", "all");
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilterValues, filterKey, onFilterChange]);

  // Notify parent about initial default values (only once on mount),
  // but do NOT overwrite when a saved value exists
  useEffect(() => {
    if (!onFilterChange || initialNotificationSent.current) return;

    if (currentFilterValue) {
      // Saved query provided values; skip default propagation
      initialNotificationSent.current = true;
      return;
    }

    const initialValue =
      filterKey === "cutOff"
        ? getCurrentMonth()
        : filterKey === "jenisTemaAnggaran"
          ? "000"
          : "all";
    onFilterChange(filterKey, "selection", initialValue);
    initialNotificationSent.current = true;
  }, [filterKey, onFilterChange, currentFilterValue]);

  // Get filter options based on filter type - using real JSON data
  const getFilterOptions = useCallback(
    (key: string): Option[] => {
      const commonOptions: Option[] = [{ value: "all", label: "Semua" }];

      try {
        switch (key) {
          case "jenisKontrak": {
            // Special simple options for Kontrak scope
            const options = [
              { value: "SYC", label: "SYC - Single Year Contract" },
              { value: "MYC", label: "MYC - Multi Years Contract" },
            ];
            return deduplicateOptions([...commonOptions, ...options]);
          }
          case "jenisTemaAnggaran": {
            // No "Semua" option for Jenis Tema Anggaran; default should be 000
            const options = (
              kdtemaData as Array<{
                kdtema: string;
                nmtema: string;
              }>
            ).map((item) => ({
              value: item.kdtema,
              label: `${item.kdtema} - ${item.nmtema}`,
            }));
            return deduplicateOptions(options); // exclude commonOptions
          }
          case "kementerian": {
            const kementarianOptions = KDDEPT.map((item) => ({
              value: item.kddept,
              label: `${item.kddept} - ${item.nmdept}`,
            }));
            return deduplicateOptions([...commonOptions, ...kementarianOptions]);
          }

          case "eselonI": {
            let eselonIData = KDUNIT;
            const selectedKementerian = activeFilterValues?.kementerian;
            if (selectedKementerian && selectedKementerian !== "all") {
              eselonIData = eselonIData.filter(
                (item) => item.kddept === selectedKementerian,
              );
            }
            const eselonIOptions = eselonIData.map((item) => ({
              value: item.kdunit,
              label: `${item.kdunit} - ${item.nmunit}`,
            }));
            return deduplicateOptions([...commonOptions, ...eselonIOptions]);
          }

          case "kanwil": {
            let kanwilData = KDKANWIL;
            const selectedProvinsiForKanwil = activeFilterValues?.provinsi;
            if (
              selectedProvinsiForKanwil &&
              selectedProvinsiForKanwil !== "all"
            ) {
              kanwilData = kanwilData.filter(
                (item) => item.kdlokasi === selectedProvinsiForKanwil,
              );
            }
            const kanwilOptions = kanwilData.map((item) => ({
              value: item.kdkanwil,
              label: `${item.kdkanwil} - ${item.nmkanwil}`,
            }));
            return deduplicateOptions([...commonOptions, ...kanwilOptions]);
          }

          case "kppn": {
            let kppnData = KDKPPN;
            const selectedKanwil = activeFilterValues?.kanwil;
            if (selectedKanwil && selectedKanwil !== "all") {
              kppnData = kppnData.filter(
                (item) => item.kdkanwil === selectedKanwil,
              );
            }
            const kppnOptions = kppnData.map((item) => ({
              value: item.kdkppn,
              label: `${item.kdkppn} - ${item.nmkppn}`,
            }));
            return deduplicateOptions([...commonOptions, ...kppnOptions]);
          }
          case "kewenangan": {
            const kewenanganOptions = KDDEKON.map((item) => ({
              value: item.kddekon,
              label: `${item.kddekon} - ${item.nmdekon}`,
            }));
            return deduplicateOptions([...commonOptions, ...kewenanganOptions]);
          }

          case "provinsi": {
            const provinsiOptions = KDLOKASI.map((item) => ({
              value: item.kdlokasi,
              label: `${item.kdlokasi} - ${item.nmlokasi}`,
            }));
            return deduplicateOptions([...commonOptions, ...provinsiOptions]);
          }

          case "kabkota": {
            let kabkotaData = KDKABKOTA;
            const selectedProvinsi = activeFilterValues?.provinsi;
            if (selectedProvinsi && selectedProvinsi !== "all") {
              kabkotaData = kabkotaData.filter(
                (item) => item.kdlokasi === selectedProvinsi,
              );
            }
            const kabkotaOptions = kabkotaData.map((item) => ({
              value: item.kdkabkota,
              label: `${item.kdkabkota} - ${item.nmkabkota}`,
            }));
            return deduplicateOptions([...commonOptions, ...kabkotaOptions]);
          }

          case "satker":
            // Use kdsatker.json data - filter by selected Kementerian, Kanwil, and KPPN
            let satkerData = kdsatkerData as Array<{
              kdsatker: string;
              nmsatker: string;
              kddept: string;
              kdkanwil: string;
              kdkppn: string;
            }>;

            // Filter by parent Kementerian if selected
            const selectedKementarianForSatker =
              activeFilterValues?.kementerian;
            if (
              selectedKementarianForSatker &&
              selectedKementarianForSatker !== "all"
            ) {
              satkerData = satkerData.filter(
                (item) => item.kddept === selectedKementarianForSatker,
              );
            }

            // Filter by parent Kanwil if selected
            const selectedKanwilForSatker = activeFilterValues?.kanwil;
            if (selectedKanwilForSatker && selectedKanwilForSatker !== "all") {
              satkerData = satkerData.filter(
                (item) => item.kdkanwil === selectedKanwilForSatker,
              );
            }

            // Filter by parent KPPN if selected
            const selectedKppnForSatker = activeFilterValues?.kppn;
            if (selectedKppnForSatker && selectedKppnForSatker !== "all") {
              satkerData = satkerData.filter(
                (item) => item.kdkppn === selectedKppnForSatker,
              );
            }

            const satkerOptions = satkerData.map((item) => ({
              value: item.kdsatker,
              label: `${item.kdsatker} - ${item.nmsatker}`,
            }));
            return deduplicateOptions([...commonOptions, ...satkerOptions]);

          // For other filter types, return mock data
          case "fungsi":
            // Use kdfungsi.json data
            const fungsiOptions = (
              kdfungsiData as Array<{ kdfungsi: string; nmfungsi: string }>
            ).map((item) => ({
              value: item.kdfungsi,
              label: `${item.kdfungsi} - ${item.nmfungsi}`,
            }));
            return deduplicateOptions([...commonOptions, ...fungsiOptions]);
          case "subFungsi":
            // Use kdsfung.json data - filter by selected Fungsi
            let subFungsiData = kdsfungData as Array<{
              kdfungsi: string;
              kdsfung: string;
              nmsfung: string;
            }>;

            // Filter by parent Fungsi if selected
            const selectedFungsi = activeFilterValues?.fungsi;
            if (selectedFungsi && selectedFungsi !== "all") {
              subFungsiData = subFungsiData.filter(
                (item) => item.kdfungsi === selectedFungsi,
              );
            }

            const subFungsiOptions = subFungsiData.map((item) => ({
              value: item.kdsfung,
              label: `${item.kdfungsi}.${item.kdsfung} - ${item.nmsfung}`,
            }));
            return deduplicateOptions([...commonOptions, ...subFungsiOptions]);
          case "program":
            // Use kdprogram.json data - filter by selected Kementerian and Unit Eselon 1
            let programData = kdprogramData as Array<{
              kdprogram: string;
              nmprogram: string;
              kddept: string;
              kdunit: string;
            }>;

            // Filter by parent Kementerian if selected
            const selectedKementarianForProgram =
              activeFilterValues?.kementerian;
            if (
              selectedKementarianForProgram &&
              selectedKementarianForProgram !== "all"
            ) {
              programData = programData.filter(
                (item) => item.kddept === selectedKementarianForProgram,
              );
            }

            // Filter by parent Unit Eselon 1 if selected
            const selectedEselonI = activeFilterValues?.eselonI;
            if (selectedEselonI && selectedEselonI !== "all") {
              programData = programData.filter(
                (item) => item.kdunit === selectedEselonI,
              );
            }

            const programOptions = programData.map((item) => ({
              value: item.kdprogram,
              label: `${item.kdprogram} - ${item.nmprogram}`,
            }));
            return deduplicateOptions([...commonOptions, ...programOptions]);
          case "kegiatan":
            // Use kdgiat.json data - filter by selected Kementerian, Unit, and Program
            let kegiatanData = kdgiatData as Array<{
              kdgiat: string;
              nmgiat: string;
              kddept: string;
              kdunit: string;
              kdprogram: string;
            }>;

            // Filter by parent Kementerian if selected
            const selectedKementarianForKegiatan =
              activeFilterValues?.kementerian;
            if (
              selectedKementarianForKegiatan &&
              selectedKementarianForKegiatan !== "all"
            ) {
              kegiatanData = kegiatanData.filter(
                (item) => item.kddept === selectedKementarianForKegiatan,
              );
            }

            // Filter by parent Unit if selected
            const selectedUnitForKegiatan = activeFilterValues?.eselonI;
            if (selectedUnitForKegiatan && selectedUnitForKegiatan !== "all") {
              kegiatanData = kegiatanData.filter(
                (item) => item.kdunit === selectedUnitForKegiatan,
              );
            }

            // Filter by parent Program if selected
            const selectedProgram = activeFilterValues?.program;
            if (selectedProgram && selectedProgram !== "all") {
              kegiatanData = kegiatanData.filter(
                (item) => item.kdprogram === selectedProgram,
              );
            }

            const kegiatanOptions = kegiatanData.map((item) => ({
              value: item.kdgiat,
              label: `${item.kdgiat} - ${item.nmgiat}`,
            }));
            return deduplicateOptions([...commonOptions, ...kegiatanOptions]);

          case "outputKro":
            // Use kdoutput.json data - filter by selected Kementerian, Unit, Program, and Kegiatan
            let outputData = kdoutputData as Array<{
              kdoutput: string;
              nmoutput: string;
              kddept: string;
              kdunit: string;
              kdprogram: string;
              kdgiat: string;
            }>;

            // Filter by parent Kementerian if selected
            const selectedKementarianForOutput =
              activeFilterValues?.kementerian;
            if (
              selectedKementarianForOutput &&
              selectedKementarianForOutput !== "all"
            ) {
              outputData = outputData.filter(
                (item) => item.kddept === selectedKementarianForOutput,
              );
            }

            // Filter by parent Unit if selected
            const selectedUnitForOutput = activeFilterValues?.eselonI;
            if (selectedUnitForOutput && selectedUnitForOutput !== "all") {
              outputData = outputData.filter(
                (item) => item.kdunit === selectedUnitForOutput,
              );
            }

            // Filter by parent Program if selected
            const selectedProgramForOutput = activeFilterValues?.program;
            if (
              selectedProgramForOutput &&
              selectedProgramForOutput !== "all"
            ) {
              outputData = outputData.filter(
                (item) => item.kdprogram === selectedProgramForOutput,
              );
            }

            // Filter by parent Kegiatan if selected
            const selectedKegiatan = activeFilterValues?.kegiatan;
            if (selectedKegiatan && selectedKegiatan !== "all") {
              outputData = outputData.filter(
                (item) => item.kdgiat === selectedKegiatan,
              );
            }

            const outputOptions = outputData.map((item) => ({
              value: item.kdoutput,
              label: `${item.kdoutput} - ${item.nmoutput}`,
            }));
            return deduplicateOptions([...commonOptions, ...outputOptions]);

          case "subOutputRo":
            // Use kdsoutput.json data - filter by selected Kementerian, Unit, Program, Kegiatan, and Output
            let subOutputData = kdsoutputData as Array<{
              kdsoutput: string;
              nmsoutput: string;
              kddept: string;
              kdunit: string;
              kdprogram: string;
              kdgiat: string;
              kdoutput: string;
            }>;

            // Filter by parent Kementerian if selected
            const selectedKementarianForSubOutput =
              activeFilterValues?.kementerian;
            if (
              selectedKementarianForSubOutput &&
              selectedKementarianForSubOutput !== "all"
            ) {
              subOutputData = subOutputData.filter(
                (item) => item.kddept === selectedKementarianForSubOutput,
              );
            }

            // Filter by parent Unit if selected
            const selectedUnitForSubOutput = activeFilterValues?.eselonI;
            if (
              selectedUnitForSubOutput &&
              selectedUnitForSubOutput !== "all"
            ) {
              subOutputData = subOutputData.filter(
                (item) => item.kdunit === selectedUnitForSubOutput,
              );
            }

            // Filter by parent Program if selected
            const selectedProgramForSubOutput = activeFilterValues?.program;
            if (
              selectedProgramForSubOutput &&
              selectedProgramForSubOutput !== "all"
            ) {
              subOutputData = subOutputData.filter(
                (item) => item.kdprogram === selectedProgramForSubOutput,
              );
            }

            // Filter by parent Kegiatan if selected
            const selectedKegiatanForSubOutput = activeFilterValues?.kegiatan;
            if (
              selectedKegiatanForSubOutput &&
              selectedKegiatanForSubOutput !== "all"
            ) {
              subOutputData = subOutputData.filter(
                (item) => item.kdgiat === selectedKegiatanForSubOutput,
              );
            }

            // Filter by parent Output if selected
            const selectedOutput = activeFilterValues?.outputKro;
            if (selectedOutput && selectedOutput !== "all") {
              subOutputData = subOutputData.filter(
                (item) => item.kdoutput === selectedOutput,
              );
            }

            const subOutputOptions = subOutputData.map((item) => ({
              value: item.kdsoutput,
              label: `${item.kdsoutput} - ${item.nmsoutput}`,
            }));
            return deduplicateOptions([...commonOptions, ...subOutputOptions]);

          // Prioritas Nasional hierarchy filters
          case "jenisPn": {
            const pnOptions = (
              kdpnData as Array<{ kdpn: string; nmpn: string }>
            ).map((item) => ({
              value: item.kdpn,
              label: `${item.kdpn} - ${item.nmpn}`,
            }));
            return deduplicateOptions([...commonOptions, ...pnOptions]);
          }

          case "programPrioritas": {
            let data = kdppData as Array<{
              kdpn: string;
              kdpp: string;
              nmpp: string;
            }>;
            const selectedPn = activeFilterValues?.jenisPn;
            if (selectedPn && selectedPn !== "all") {
              data = data.filter((item) => item.kdpn === selectedPn);
            }
            const options = data.map((item) => ({
              value: item.kdpp,
              label: `${item.kdpp} - ${item.nmpp}`,
            }));
            return deduplicateOptions([...commonOptions, ...options]);
          }

          case "kegiatanPrioritas": {
            let data = kdkpData as Array<{
              kdpn: string;
              kdpp: string;
              kdkp: string;
              deskripsi: string;
            }>;
            const selectedPn = activeFilterValues?.jenisPn;
            const selectedPp = activeFilterValues?.programPrioritas;
            if (selectedPn && selectedPn !== "all") {
              data = data.filter((item) => item.kdpn === selectedPn);
            }
            if (selectedPp && selectedPp !== "all") {
              data = data.filter((item) => item.kdpp === selectedPp);
            }
            const options = data.map((item) => ({
              value: item.kdkp,
              label: `${item.kdkp} - ${item.deskripsi}`,
            }));
            return deduplicateOptions([...commonOptions, ...options]);
          }

          case "proyekPrioritas": {
            let data = kdproyData as Array<{
              kdpn: string;
              kdpp: string;
              kdkp: string;
              kdproy: string;
              deskripsi: string;
            }>;
            const selectedPn = activeFilterValues?.jenisPn;
            const selectedPp = activeFilterValues?.programPrioritas;
            const selectedKp = activeFilterValues?.kegiatanPrioritas;
            if (selectedPn && selectedPn !== "all") {
              data = data.filter((item) => item.kdpn === selectedPn);
            }
            if (selectedPp && selectedPp !== "all") {
              data = data.filter((item) => item.kdpp === selectedPp);
            }
            if (selectedKp && selectedKp !== "all") {
              data = data.filter((item) => item.kdkp === selectedKp);
            }
            const options = data.map((item) => ({
              value: item.kdproy,
              label: `${item.kdproy} - ${item.deskripsi}`,
            }));
            return deduplicateOptions([...commonOptions, ...options]);
          }

          case "jenisMajorProject": {
            const majorProjectOptions = (
              kdmpData as Array<{ kdmp: string; nmmp: string }>
            ).map((item) => ({
              value: item.kdmp,
              label: `${item.kdmp} - ${item.nmmp}`,
            }));
            return deduplicateOptions([...commonOptions, ...majorProjectOptions]);
          }

          case "akun":
            // Use different JSON data based on account type selection
            const akunType = filterData.akunType || "jenisBelanja";

            if (akunType === "jenisBelanja") {
              // Use kdgbkpk.json data for Jenis Belanja (2 Digit)
              const jenisBelanjaOptions = (
                kdgbkpkData as Array<{ kdgbkpk: string; nmgbkpk: string }>
              ).map((item) => ({
                value: item.kdgbkpk,
                label: `${item.kdgbkpk} - ${item.nmgbkpk}`,
              }));
              return deduplicateOptions([...commonOptions, ...jenisBelanjaOptions]);
            } else if (akunType === "kodeBkpk") {
              // Use kdbkpk.json data for Kode BKPK (4 Digit)
              const kodeBkpkOptions = (
                kdbkpkData as Array<{ kdbkpk: string; nmbkpk: string }>
              ).map((item) => ({
                value: item.kdbkpk,
                label: `${item.kdbkpk} - ${item.nmbkpk}`,
              }));
              return deduplicateOptions([...commonOptions, ...kodeBkpkOptions]);
            } else if (akunType === "kodeAkun") {
              // Use kdakun.json data for Kode Akun (6 Digit)
              const kodeAkunOptions = (
                kdakunData as Array<{ kdakun: string; nmakun: string }>
              ).map((item) => ({
                value: item.kdakun,
                label: `${item.kdakun} - ${item.nmakun}`,
              }));
              return deduplicateOptions([...commonOptions, ...kodeAkunOptions]);
            }

            return commonOptions;

          case "sumberDana":
            // Use kdsdana.json data for Sumber Dana
            const sumberDanaOptions = (
              kdsdanaData as Array<{ kdsdana: string; nmsdana: string }>
            ).map((item) => ({
              value: item.kdsdana,
              label: `${item.kdsdana} - ${item.nmsdana}`,
            }));
            return deduplicateOptions([...commonOptions, ...sumberDanaOptions]);

          case "jenisInflasiIntervensi": {
            // Use inf_intervensi.json data for Jenis Inflasi Intervensi
            const inflationIntervensiOptions = (
              infIntervensiData as Array<{
                inf_intervensi: string;
                ur_inf_intervensi: string;
              }>
            ).map((item) => ({
              value: item.inf_intervensi,
              label: `${item.inf_intervensi} - ${item.ur_inf_intervensi}`,
            }));
            return deduplicateOptions([...commonOptions, ...inflationIntervensiOptions]);
          }

          case "jenisInflasiPengeluaran": {
            // Use inf_pengeluaran.json data for Jenis Inflasi Pengeluaran
            const inflationPengeluaranOptions = (
              infPengeluaranData as Array<{
                inf_pengeluaran: string;
                ur_inf_pengeluaran: string;
              }>
            ).map((item) => ({
              value: item.inf_pengeluaran,
              label: `${item.inf_pengeluaran} - ${item.ur_inf_pengeluaran}`,
            }));
            return deduplicateOptions([...commonOptions, ...inflationPengeluaranOptions]);
          }
          case "stuntingIntervensi": {
            // Static options for Penanganan Stunting Intervensi
            const options: Option[] = [
              { value: "I1", label: "I1 - Intervensi Dukungan" },
              { value: "I2", label: "I2 - Intervensi Sensitif" },
              { value: "I3", label: "I3 - Intervensi Spesifik" },
            ];
            return [...commonOptions, ...options];
          }
          case "mbgIntervensi": {
            // Static options for Makan Bergizi Gratis (MBG) Intervensi
            const options: Option[] = [
              { value: "utama", label: "Intervensi Utama" },
              { value: "pendukung", label: "Intervensi Pendukung" },
              { value: "dukman", label: "Intervensi Dukman" },
            ];
            return [...commonOptions, ...options];
          }
          case "jenisProgramStrategis": {
            // Static options from kdprogis.json for Program Strategis
            const options = (
              kdprogisData as Array<{
                kdprogis: string;
                nmprogis: string;
              }>
            ).map((item) => ({
              value: item.kdprogis,
              label: `${item.kdprogis} - ${item.nmprogis}`,
            }));
            return deduplicateOptions([...commonOptions, ...options]);
          }

          case "cutOff":
            // Generate month options (without year since year is selected in Pilih Laporan card)
            const months = [
              "Januari",
              "Februari",
              "Maret",
              "April",
              "Mei",
              "Juni",
              "Juli",
              "Agustus",
              "September",
              "Oktober",
              "November",
              "Desember",
            ];

            const monthOptions: Array<{ value: string; label: string }> = [];

            // Add months 1-12
            for (let month = 1; month <= 12; month++) {
              const monthStr = String(month).padStart(2, "0");
              const value = monthStr;
              const label = months[month - 1] as string; // assert to satisfy TS (index is within range)
              monthOptions.push({ value, label });
            }

            return monthOptions;

          case "kemiskinanEkstrim": {
            // Boolean-only flag: no explicit option; keep default "Semua" only
            return commonOptions;
          }
          case "belanjaPemilu": {
            // Boolean-only flag: no explicit option; keep default "Semua" only
            return commonOptions;
          }
          case "ibuKotaNusantara": {
            // Boolean-only flag: no explicit option; keep default "Semua" only
            return commonOptions;
          }
          case "ketahananPangan": {
            // Boolean-only flag: no explicit option; keep default "Semua" only
            return commonOptions;
          }
          case "swasembadaPangan": {
            // Boolean-only flag: no explicit option; keep default "Semua" only
            return commonOptions;
          }
          case "belanjaPemerintah": {
            // Boolean-only flag/switch: WHERE-only handling; options remain default
            return commonOptions;
          }

          case "statusSumber": {
            // Status Sumber filter with predefined options
            const statusSumberOptions = (
              statusSumberData as Array<{ value: string; label: string }>
            ).map((item) => ({
              value: item.value,
              label: item.label,
            }));
            // Replace "all" option with "Semua Status" from data
            return deduplicateOptions(statusSumberOptions);
          }

          default:
            return commonOptions;
        }
      } catch (error) {
        console.error(`Error loading data for filter ${key}:`, error);
        return commonOptions;
      }
    },
    [activeFilterValues, filterData],
  );

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
        // Exception: cutOff filter always needs kondisiCode = "equals"
        if (filterKey === "cutOff") {
          newData.kondisiCode = "equals";
        } else {
          newData.kondisiCode = "";
        }
        newData.mengandungKata = "";

        // Notify parent about cleared fields
        if (onFilterChange) {
          setTimeout(() => {
            onFilterChange(
              filterKey,
              "kondisiCode",
              filterKey === "cutOff" ? "equals" : "",
            );
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
        // Exception: cutOff filter always needs kondisiCode = "equals"
        if (filterKey === "cutOff") {
          newData.kondisiCode = "equals";
        } else {
          newData.kondisiCode = "";
        }

        // Notify parent about cleared fields
        if (onFilterChange) {
          setTimeout(() => {
            onFilterChange(filterKey, "selection", "all");
            onFilterChange(
              filterKey,
              "kondisiCode",
              filterKey === "cutOff" ? "equals" : "",
            );
          }, 0);
        }
      }

      // Auto-change jenisTampilan to "kode_uraian" when mengandungKata is entered
      // This makes sense because mengandungKata searches in description, so user should see both code and description
      if (
        field === "mengandungKata" &&
        value.trim() &&
        prev.jenisTampilan !== "kode_uraian"
      ) {
        newData.jenisTampilan = "kode_uraian";

        // Notify parent about the auto-change
        if (onFilterChange) {
          setTimeout(() => {
            onFilterChange(filterKey, "jenisTampilan", "kode_uraian");
          }, 0);
        }
      }

      // Reset jenisTampilan back to "kode" if mengandungKata is cleared and it was auto-changed
      if (
        field === "mengandungKata" &&
        !value.trim() &&
        prev.jenisTampilan === "kode_uraian"
      ) {
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
      <CardContent>
        {/* Responsive layout: 1 col on mobile, 2 on tablet, 5 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start sm:items-center">
          {/* Column 1: Filter Title with Icon */}
          <div className="flex items-center space-x-2 min-w-0 sm:col-span-1 lg:col-span-1">
            {getFilterIcon(filterKey)}
            <div className="text-sm font-medium truncate" title={filterLabel}>
              {filterLabel}
            </div>
          </div>

          {/* Column 2: Selection/Account Type */}
          <div className="space-y-2 sm:col-span-1 lg:col-span-1">
            {filterKey === "akun" ? (
              <>
                <Label className="text-xs font-medium">Tipe Akun</Label>
                <Select
                  value={filterData.akunType}
                  onValueChange={(value) => {
                    handleInputChange("akunType", value);
                    handleInputChange("selection", "all");
                  }}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Pilih tipe" />
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
              </>
            ) : filterKey === "levelAPBD" ? (
              <>
                <Label className="text-xs font-medium">Tipe Level</Label>
                <Select
                  value={filterData.subSelection || "6"}
                  onValueChange={(value) =>
                    handleInputChange("subSelection", value)
                  }
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Pilih tipe level" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        Level {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : filterKey === "cutOff" ? (
              <>
                <Label className="text-xs font-medium">Pilih Bulan</Label>
                <SearchableSelect
                  key={`${filterKey}-${
                    currentFilterValue?.selection || "default"
                  }`}
                  options={getFilterOptions(filterKey)}
                  value={filterData.selection}
                  onValueChange={(value) =>
                    handleInputChange("selection", value)
                  }
                  placeholder="Pilih bulan"
                  className="w-full h-8 text-xs"
                />
              </>
            ) : (
              <>
                <Label className="text-xs font-medium">Pilihan</Label>
                <SearchableSelect
                  key={`${filterKey}-${
                    currentFilterValue?.selection || "default"
                  }`}
                  options={getFilterOptions(filterKey)}
                  value={filterData.selection}
                  onValueChange={(value) =>
                    handleInputChange("selection", value)
                  }
                  placeholder={`Pilih ${filterLabel.toLowerCase()}`}
                  className={cn(
                    "w-full h-8 text-xs",
                    ((filterData.kondisiCode &&
                      filterData.kondisiCode.trim()) ||
                      (filterData.mengandungKata &&
                        filterData.mengandungKata.trim())) &&
                      "opacity-50 cursor-not-allowed",
                  )}
                  disabled={
                    !!(
                      (filterData.kondisiCode &&
                        filterData.kondisiCode.trim() !== "") ||
                      (filterData.mengandungKata &&
                        filterData.mengandungKata.trim() !== "")
                    )
                  }
                />
              </>
            )}
          </div>

          {/* Column 3: Kondisi */}
          {filterKey !== "cutOff" && (
            <div className="space-y-2 sm:col-span-1 lg:col-span-1">
              <Label className="text-xs font-medium">Kondisi</Label>
              <Input
                placeholder="Kode kondisi"
                value={filterData.kondisiCode}
                onChange={(e) =>
                  handleInputChange("kondisiCode", e.target.value)
                }
                disabled={
                  isBooleanSwitch ||
                  !!(
                    (filterData.selection && filterData.selection !== "all") ||
                    (filterData.mengandungKata &&
                      filterData.mengandungKata.trim() !== "")
                  )
                }
                className={cn(
                  "w-full h-8 text-xs placeholder:text-xs",
                  (isBooleanSwitch ||
                    (filterData.selection && filterData.selection !== "all") ||
                    (filterData.mengandungKata &&
                      filterData.mengandungKata.trim())) &&
                    "opacity-50 cursor-not-allowed",
                )}
              />
            </div>
          )}

          {/* Column 4: Mengandung Kata */}
          {filterKey !== "cutOff" && (
            <div className="space-y-2 sm:col-span-1 lg:col-span-1">
              <Label className="text-xs font-medium">Kata Kunci</Label>
              <Input
                placeholder="Kata kunci"
                value={filterData.mengandungKata}
                onChange={(e) =>
                  handleInputChange("mengandungKata", e.target.value)
                }
                disabled={
                  isBooleanSwitch ||
                  !!(
                    (filterData.selection && filterData.selection !== "all") ||
                    (filterData.kondisiCode &&
                      filterData.kondisiCode.trim() !== "")
                  )
                }
                className={cn(
                  "w-full h-8 text-xs placeholder:text-xs",
                  (isBooleanSwitch ||
                    (filterData.selection && filterData.selection !== "all") ||
                    (filterData.kondisiCode &&
                      filterData.kondisiCode.trim())) &&
                    "opacity-50 cursor-not-allowed",
                )}
              />
            </div>
          )}

          {/* Column 5: Jenis Tampilan */}
          {filterKey !== "cutOff" && (
            <div className="space-y-2 sm:col-span-1 lg:col-span-1">
              <Label className="text-xs font-medium">Tampilan</Label>
              <Select
                value={filterData.jenisTampilan}
                onValueChange={(value) => {
                  if (isBooleanSwitch) return; // disabled
                  handleInputChange("jenisTampilan", value);
                }}
              >
                <SelectTrigger
                  className={cn(
                    "w-full h-8 text-xs",
                    isBooleanSwitch && "opacity-50 cursor-not-allowed",
                  )}
                  disabled={isBooleanSwitch}
                >
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
          )}
        </div>

        {/* Status Messages */}
        {filterKey !== "cutOff" && (
          <div className="mt-2 space-y-1">
            {filterData.kondisiCode && filterData.kondisiCode.trim() && (
              <>
                {filterKey === "akun" ||
                filterKey === "kodeBkpk" ||
                filterKey === "jenisBelanja" ? (
                  <p className="text-xs text-muted-foreground">
                    💡 Partial: 5 (5xxx) atau Exact: 5211 | Exclude: !5 atau
                    !5211
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    💡 Include: 001,002,003 atau Exclude: !001,002,003
                  </p>
                )}
                {(filterData.kondisiCode.startsWith("!") ||
                  filterData.kondisiCode.startsWith("-")) && (
                  <p className="text-xs text-red-600">
                    🚫 Mode Exclude aktif - data dengan kode ini akan
                    dikecualikan
                  </p>
                )}
              </>
            )}
            {filterData.mengandungKata && filterData.mengandungKata.trim() && (
              <p className="text-xs text-muted-foreground">
                💡 Pencarian dilakukan pada kolom deskripsi
              </p>
            )}
            {((filterData.kondisiCode && filterData.kondisiCode.trim()) ||
              (filterData.mengandungKata &&
                filterData.mengandungKata.trim())) && (
              <p className="text-xs text-amber-600">
                ⚠️ Dropdown dinonaktifkan karena filter lain sedang digunakan
              </p>
            )}
            {filterData.mengandungKata &&
              filterData.mengandungKata.trim() &&
              filterData.jenisTampilan === "kode_uraian" && (
                <p className="text-xs text-blue-600">
                  ℹ️ Otomatis diubah ke &quot;Kode Uraian&quot; untuk pencarian
                  teks
                </p>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
