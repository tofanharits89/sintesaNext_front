"use client";

import provinces from "@/data/indonesia/provinces.json";
import regencies from "@/data/indonesia/regencies.json";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Province = {
  id: string;
  name: string;
  centroid?: { lat: number; lng: number };
};

export type Regency = {
  id: string;
  provinceId: string;
  name: string;
  centroid?: { lat: number; lng: number };
};

export function useProvinceRegency() {
  const [provinceId, setProvinceId] = useState<string>("");
  const [regencyId, setRegencyId] = useState<string>("");

  const regencyOptions = useMemo(
    () =>
      provinceId
        ? (regencies as Regency[]).filter((r) => r.provinceId === provinceId)
        : [],
    [provinceId]
  );

  const selectedProvince = useMemo(
    () => (provinces as Province[]).find((p) => p.id === provinceId) || null,
    [provinceId]
  );

  const selectedRegency = useMemo(
    () => (regencies as Regency[]).find((r) => r.id === regencyId) || null,
    [regencyId]
  );

  return {
    provinceId,
    setProvinceId,
    regencyId,
    setRegencyId,
    regencyOptions,
    selectedProvince,
    selectedRegency,
  };
}

export function ProvinceSelect({
  value,
  onChange,
}: {
  value?: string;
  onChange: (val: string) => void;
}) {
  // Map external empty string to internal "all" to avoid Radix empty value error
  const internalValue = !value ? "all" : value;
  return (
    <Select
      value={internalValue}
      onValueChange={(val) => onChange(val === "all" ? "" : val)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Pilih Provinsi" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Semua Provinsi</SelectItem>
        {(provinces as Province[]).map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RegencySelect({
  value,
  onChange,
  provinceId,
}: {
  value?: string;
  onChange: (val: string) => void;
  provinceId?: string;
}) {
  const items = useMemo(
    () =>
      provinceId
        ? (regencies as Regency[]).filter((r) => r.provinceId === provinceId)
        : [],
    [provinceId]
  );

  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val)}
      disabled={!provinceId}
    >
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={
            provinceId ? "Pilih Kabupaten/Kota" : "Pilih Provinsi dulu"
          }
        />
      </SelectTrigger>
      <SelectContent>
        {items.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            {r.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
