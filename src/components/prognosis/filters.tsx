import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Section,
  Field,
  metodeOptions,
  levelOptions,
  jenlapOptions,
} from "./shared";

interface PrognosisFiltersProps {
  // Jenis laporan
  jenisLaporan: string;
  setJenisLaporan: (val: string) => void;
  // Level proyeksi
  level: string;
  setLevel: (val: string) => void;
  filteredLevelOptions: { label: string; value: string }[];
  // Kementerian
  selectedKddept: string;
  setSelectedKddept: (val: string) => void;
  // Kementerian untuk level 2 & 3
  selectedKementerian: string;
  onKementerianChange: (val: string) => void;
  kementerianOptions: any[];
  kementerianLevel3Options: any[];
  // Unit Eselon I
  selectedUnit: string;
  onUnitChange: (val: string) => void;
  unitOptions: any[];
  // Satuan Kerja
  selectedSatker: string;
  onSatkerChange: (val: string) => void;
  satkerOptions: any[];
  // Jenis belanja
  selectedJenisBelanja: string;
  setSelectedJenisBelanja: (val: string) => void;
  jenisBelanjaOptions: any[];
  loadingJenisBelanja: boolean;
  // Baseline
  selectedBaseline: string;
  setSelectedBaseline: (val: string) => void;
  baselineOptions: any[];
  loadingBaseline: boolean;
  // Metode & target
  selectedMetode: string;
  setSelectedMetode: (val: string) => void;
  selectedTargetProyeksi: string;
  setSelectedTargetProyeksi: (val: string) => void;
  targetOptions: { label: number; value: number }[];
  // Loading
  loading: boolean;
  loadingSatker: boolean;
  // Role
  role: string | undefined;
}

export const PrognosisFilters = ({
  jenisLaporan,
  setJenisLaporan,
  level,
  setLevel,
  filteredLevelOptions,
  selectedKddept,
  setSelectedKddept,
  selectedKementerian,
  onKementerianChange,
  kementerianOptions,
  kementerianLevel3Options,
  selectedUnit,
  onUnitChange,
  unitOptions,
  selectedSatker,
  onSatkerChange,
  satkerOptions,
  selectedJenisBelanja,
  setSelectedJenisBelanja,
  jenisBelanjaOptions,
  loadingJenisBelanja,
  selectedBaseline,
  setSelectedBaseline,
  baselineOptions,
  loadingBaseline,
  selectedMetode,
  setSelectedMetode,
  selectedTargetProyeksi,
  setSelectedTargetProyeksi,
  targetOptions,
  loading,
  loadingSatker,
  role,
}: PrognosisFiltersProps) => {
  const isKanwilKppn = role === "kanwil_djpb" || role === "kppn";

  // Nilai kementerian yang ditampilkan di dropdown kementerian berdasarkan level
  const kemValue = level === "1" ? selectedKddept : selectedKementerian;
  const kemList = level === "3" ? kementerianLevel3Options : kementerianOptions;

  // Apakah filter primer sudah dipilih (menentukan aktif/tidaknya dropdown berikutnya)
  // Level 1: kementerian sudah dipilih (selectedKddept)
  // Level 2: kementerian sudah dipilih (selectedKementerian) — selectedKddept adalah unit code
  // Level 3: kementerian sudah dipilih (selectedKementerian)
  const hasPrimarySelection =
    level === "1" ? !!selectedKddept : !!selectedKementerian;

  return (
    <div className="space-y-6">
      <Section title="Filter Utama">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Jenis Laporan">
            <Select value={jenisLaporan} onValueChange={setJenisLaporan}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {jenlapOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Level Proyeksi">
            <Select
              value={level}
              onValueChange={setLevel}
              disabled={isKanwilKppn}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filteredLevelOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label={`Target Proyeksi (${jenisLaporan === "1" ? "Bulan" : "Tahun"})`}
          >
            <Select
              value={selectedTargetProyeksi}
              onValueChange={setSelectedTargetProyeksi}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {targetOptions.map((v) => (
                  <SelectItem key={v.value} value={v.value.toString()}>
                    {v.label} {jenisLaporan === "1" ? "Bulan" : "Tahun"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Parameter">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Kementerian / Lembaga */}
          <Field label="Kementerian / Lembaga">
            <Select
              value={kemValue}
              onValueChange={onKementerianChange}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loading ? "Loading..." : "Pilih Kementerian/Lembaga"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {kemList.map((opt: any) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Unit Eselon I - hanya tampil di Level 2 & 3 */}
          {(level === "2" || level === "3") && (
            <Field label="Unit Eselon I">
              <Select
                value={
                  (level === "2" ? selectedKddept : selectedUnit) || "__all__"
                }
                onValueChange={(val) =>
                  onUnitChange(val === "__all__" ? "" : val)
                }
                disabled={loading || !selectedKementerian}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !selectedKementerian
                        ? "Pilih Kementerian terlebih dahulu"
                        : loading
                          ? "Loading..."
                          : "- Pilih Semua -"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">- Pilih Semua -</SelectItem>
                  {unitOptions.map((opt: any) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {/* Satuan Kerja - hanya tampil di Level 3 */}
          {level === "3" && (
            <Field label="Satuan Kerja">
              <Select
                value={selectedSatker || "__all__"}
                onValueChange={(val) =>
                  onSatkerChange(val === "__all__" ? "" : val)
                }
                disabled={loadingSatker || !selectedKementerian}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !selectedKementerian
                        ? "Pilih Kementerian terlebih dahulu"
                        : loadingSatker
                          ? "Loading..."
                          : "- Pilih Semua -"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">- Pilih Semua -</SelectItem>
                  {satkerOptions.map((opt: any) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {/* Jenis Belanja */}
          <Field label="Jenis Belanja">
            <Select
              value={selectedJenisBelanja || "__all__"}
              onValueChange={(val) =>
                setSelectedJenisBelanja(val === "__all__" ? "" : val)
              }
              disabled={loadingJenisBelanja || !hasPrimarySelection}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !hasPrimarySelection
                      ? level === "3"
                        ? "Pilih Kementerian terlebih dahulu"
                        : "Pilih Kementerian/Lembaga terlebih dahulu"
                      : loadingJenisBelanja
                        ? "Loading..."
                        : "Semua Jenis Belanja"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {jenisBelanjaOptions.map((opt: any) => (
                  <SelectItem
                    key={opt.value || "__all__"}
                    value={opt.value || "__all__"}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Baseline */}
          <Field label="Baseline Tahun Data">
            <Select
              value={selectedBaseline}
              onValueChange={setSelectedBaseline}
              disabled={loadingBaseline || !hasPrimarySelection}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !hasPrimarySelection
                      ? level === "3"
                        ? "Pilih Kementerian terlebih dahulu"
                        : "Pilih Kementerian/Lembaga terlebih dahulu"
                      : loadingBaseline
                        ? "Loading..."
                        : "Pilih Tahun Baseline"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {baselineOptions
                  .filter((opt: any) =>
                    level === "2" || level === "3"
                      ? parseInt(opt.value) >= 2017
                      : true,
                  )
                  .map((opt: any) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Metode Prediksi */}
          <Field label="Metode Prediksi">
            <Select value={selectedMetode} onValueChange={setSelectedMetode}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metodeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>
    </div>
  );
};
