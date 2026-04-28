"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import kddept from "@/data/kddept.json";
import kdunit from "@/data/kdunit.json";
import kanwil from "@/data/kdkanwil.json";

interface KdDept {
  kddept: string;
  nmdept: string;
}

interface KdUnit {
  kddept: string;
  kdunit: string;
  nmunit: string;
}

interface Kanwil {
  kdkanwil: string;
  nmkanwil: string;
}

export interface FilterParams {
  thang: string;
  dept: string;
  unit: string;
  prov: string;
}

interface PilihanProps {
  onInputChange: (id: string, value: string) => void;
}

const TAHUN_OPTIONS = ["2020", "2021", "2022", "2023", "2024", "2025", "2026"];

const selectClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

const labelClass =
  "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

export default function Pilihan({ onInputChange }: PilihanProps) {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const kdkanwil = user?.kdkanwil ?? "";

  const [selectedDept, setSelectedDept] = useState("000");
  const [selectedTA, setSelectedTA] = useState("2026");

  const isPusat = role !== "kanwil_djpb" && role !== "kppn";

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { id, value } = event.target;

    if (id === "dept") {
      const deptCode = value.split("//")[0];
      setSelectedDept(deptCode ?? "");
    }

    if (id === "thang") {
      setSelectedTA(value);
    }

    onInputChange(id, value);
  };

  return (
    <div className="sticky top-0 z-10 rounded-xl border border-gray-100 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/90 mb-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* Tahun Anggaran */}
        <div>
          <label htmlFor="thang" className={labelClass}>
            Tahun Anggaran
          </label>
          <select
            id="thang"
            className={selectClass}
            value={selectedTA}
            onChange={handleChange}
          >
            {TAHUN_OPTIONS.map((ta) => (
              <option key={ta} value={ta}>
                TA {ta}
              </option>
            ))}
          </select>
        </div>

        {/* Kementerian */}
        <div className="xl:col-span-1">
          <label htmlFor="dept" className={labelClass}>
            Kementerian / Lembaga
          </label>
          <select id="dept" className={selectClass} onChange={handleChange}>
            <option value="000">Semua Kementerian / Lembaga</option>
            {(kddept as KdDept[]).map((kl, index) => (
              <option key={index} value={`${kl.kddept}//${kl.nmdept}`}>
                {kl.kddept} - {kl.nmdept}
              </option>
            ))}
          </select>
        </div>

        {/* Eselon I */}
        <div>
          <label htmlFor="unit" className={labelClass}>
            Eselon I
          </label>
          <select id="unit" className={selectClass} onChange={handleChange}>
            <option value="00">Semua Unit</option>
            {(kdunit as KdUnit[])
              .filter((item) => item.kddept === selectedDept)
              .map((item, index) => (
                <option key={index} value={item.kdunit}>
                  {item.kdunit} - {item.nmunit}
                </option>
              ))}
          </select>
        </div>

        {/* Kanwil */}
        <div>
          <label htmlFor="prov" className={labelClass}>
            Kanwil DJPB
          </label>
          <select id="prov" className={selectClass} onChange={handleChange}>
            {isPusat ? (
              <>
                <option value="00">Semua Kanwil</option>
                {(kanwil as Kanwil[]).map((item) => (
                  <option key={item.kdkanwil} value={item.kdkanwil}>
                    {item.kdkanwil} - {item.nmkanwil}
                  </option>
                ))}
              </>
            ) : (
              (kanwil as Kanwil[])
                .filter((item) => item.kdkanwil === kdkanwil)
                .map((item) => (
                  <option key={item.kdkanwil} value={item.kdkanwil}>
                    {item.kdkanwil} - {item.nmkanwil}
                  </option>
                ))
            )}
          </select>
        </div>
      </div>
    </div>
  );
}
