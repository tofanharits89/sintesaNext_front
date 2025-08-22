import { useState, useEffect, useMemo } from "react";

// Import JSON data directly
import departmentsData from "@/data/kddept.json";
import kanwilsData from "@/data/kdkanwil.json";
import kppnsData from "@/data/kdkppn.json";

// Types for the data structures
export interface Department {
  kddept: string;
  nmdept: string;
}

export interface Kanwil {
  kdlokasi: string;
  nmlokasi: string;
  kdkanwil: string;
  nmkanwil: string;
}

export interface KPPN {
  kdlokasi: string;
  nmlokasi: string;
  kdkanwil: string;
  nmkanwil: string;
  kdkppn: string;
  nmkppn: string;
}

export interface EPAFilters {
  tahun: string;
  periode: string;
  kementerian: string;
  kanwil: string;
  kppn: string;
}

export function useEPAFilters() {
  // Filter states
  const [filters, setFilters] = useState<EPAFilters>(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-based month

    return {
      tahun: currentYear.toString(),
      periode: currentMonth.toString().padStart(2, "0"), // Current month for current year
      kementerian: "all",
      kanwil: "all",
      kppn: "all",
    };
  });

  // Data states - initialize with imported data
  const [departments] = useState<Department[]>(departmentsData);
  const [kanwils] = useState<Kanwil[]>(kanwilsData);
  const [kppns] = useState<KPPN[]>(kppnsData);
  const [isLoading] = useState(false); // No loading needed since data is imported

  // Available kanwils based on selected kementerian (if needed for filtering)
  const availableKanwils = useMemo(() => {
    return kanwils; // For now, return all kanwils. Can be filtered if needed
  }, [kanwils]);

  // Available KPPNs based on selected kanwil
  const availableKPPNs = useMemo(() => {
    if (!filters.kanwil || filters.kanwil === "all") return [];
    return kppns.filter((kppn) => kppn.kdkanwil === filters.kanwil);
  }, [kppns, filters.kanwil]);

  // Generate year options (current year and previous 5 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 6; i++) {
      years.push({
        value: (currentYear - i).toString(),
        label: (currentYear - i).toString(),
      });
    }
    return years;
  }, []);

  // Generate month options (just months, no year)
  const monthOptions = useMemo(() => {
    const months = [
      { value: "01", label: "Januari" },
      { value: "02", label: "Februari" },
      { value: "03", label: "Maret" },
      { value: "04", label: "April" },
      { value: "05", label: "Mei" },
      { value: "06", label: "Juni" },
      { value: "07", label: "Juli" },
      { value: "08", label: "Agustus" },
      { value: "09", label: "September" },
      { value: "10", label: "Oktober" },
      { value: "11", label: "November" },
      { value: "12", label: "Desember" },
    ];

    return months;
  }, []);

  // Update filter function
  const updateFilter = (key: keyof EPAFilters, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };

      // Reset dependent filters when parent changes
      if (key === "kanwil") {
        newFilters.kppn = "all";
      }

      // Handle year change - set appropriate default month
      if (key === "tahun") {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const selectedYear = parseInt(value);

        if (selectedYear === currentYear) {
          // Current year: default to current month
          newFilters.periode = currentMonth.toString().padStart(2, "0");
        } else {
          // Previous years: default to December
          newFilters.periode = "12";
        }
      }

      return newFilters;
    });
  };

  // Reset all filters
  const resetFilters = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    setFilters({
      tahun: currentYear.toString(),
      periode: currentMonth.toString().padStart(2, "0"),
      kementerian: "all",
      kanwil: "all",
      kppn: "all",
    });
  };

  return {
    filters,
    updateFilter,
    resetFilters,
    departments,
    availableKanwils,
    availableKPPNs,
    yearOptions,
    monthOptions,
    isLoading,
  };
}
