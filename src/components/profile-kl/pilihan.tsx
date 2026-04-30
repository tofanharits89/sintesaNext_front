"use client";

import { useState } from "react";
import kddept from "@/data/kddept.json";
import kdperiode from "@/data/kdperiode.json";

export interface FilterParams {
  thang: string;
  periode: string;
  dept: string;
}

interface PilihanProps {
  onInputChange: (id: string, value: string) => void;
  defaultDept?: string;
}

const TAHUN_OPTIONS = ["2020", "2021", "2022", "2023", "2024", "2025", "2026"];

export default function Pilihan({
  onInputChange,
  defaultDept = "027",
}: PilihanProps) {
  const [selectedTA, setSelectedTA] = useState("2025");
  const [selectedPeriode, setSelectedPeriode] = useState("1");
  const [selectedDept, setSelectedDept] = useState(defaultDept);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { id, value } = e.target;
    if (id === "thang") {
      setSelectedTA(value);
      onInputChange("thang", value);
    } else if (id === "periode") {
      setSelectedPeriode(value);
      onInputChange("periode", value);
    } else if (id === "dept") {
      setSelectedDept(value);
      onInputChange("dept", value);
    }
  };

  const selectCls =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100";

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 p-2">
      <div>
        <label htmlFor="thang" className="block text-xs text-gray-500 mb-1">
          Pilih TA
        </label>
        <select
          id="thang"
          value={selectedTA}
          onChange={handleChange}
          className={selectCls}
        >
          {TAHUN_OPTIONS.map((ta) => (
            <option key={ta} value={ta}>
              TA {ta}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="periode" className="block text-xs text-gray-500 mb-1">
          Pilih Periode
        </label>
        <select
          id="periode"
          value={selectedPeriode}
          onChange={handleChange}
          className={selectCls}
        >
          {kdperiode.map((p) => (
            <option key={p.kdperiode} value={p.kdperiode}>
              {p.kdperiode} - {p.nmperiode}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="dept" className="block text-xs text-gray-500 mb-1">
          Pilih Kementerian / Lembaga
        </label>
        <select
          id="dept"
          value={selectedDept}
          onChange={handleChange}
          className={selectCls}
        >
          {(kddept as { kddept: string; nmdept: string }[]).map((k) => (
            <option key={k.kddept} value={k.kddept}>
              {k.kddept} - {k.nmdept}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
