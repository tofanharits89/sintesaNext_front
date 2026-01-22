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
import { Section, Field, methodDefinitions } from "./shared";

interface PrognosisFiltersProps {
    jenisLaporan: string;
    setJenisLaporan: (val: string) => void;
    selectedKddept: string;
    setSelectedKddept: (val: string) => void;
    selectedJenisBelanja: string;
    setSelectedJenisBelanja: (val: string) => void;
    selectedBaseline: string;
    setSelectedBaseline: (val: string) => void;
    selectedMetode: string;
    setSelectedMetode: (val: string) => void;
    selectedTargetProyeksi: string;
    setSelectedTargetProyeksi: (val: string) => void;
    kementerianOptions: any[];
    jenisBelanjaOptions: any[];
    baselineOptions: any[];
}

export const PrognosisFilters = ({
    jenisLaporan,
    setJenisLaporan,
    selectedKddept,
    setSelectedKddept,
    selectedJenisBelanja,
    setSelectedJenisBelanja,
    selectedBaseline,
    setSelectedBaseline,
    selectedMetode,
    setSelectedMetode,
    selectedTargetProyeksi,
    setSelectedTargetProyeksi,
    kementerianOptions,
    jenisBelanjaOptions,
    baselineOptions
}: PrognosisFiltersProps) => {
    return (
        <div className="space-y-6">
            <Section title="Pilih Laporan">
                <RadioGroup
                    defaultValue={jenisLaporan}
                    onValueChange={setJenisLaporan}
                    className="flex flex-col space-y-4"
                >
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted transition-colors cursor-pointer">
                        <RadioGroupItem value="1" id="l-bulanan" />
                        <Label htmlFor="l-bulanan" className="flex-1 cursor-pointer">
                            <span className="block font-semibold">1 - Laporan Bulanan</span>
                            <span className="text-xs text-muted-foreground">Analisis tren musiman per bulan</span>
                        </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted transition-colors cursor-pointer">
                        <RadioGroupItem value="2" id="l-tahunan" />
                        <Label htmlFor="l-tahunan" className="flex-1 cursor-pointer">
                            <span className="block font-semibold">2 - Laporan Tahunan</span>
                            <span className="text-xs text-muted-foreground">Proyeksi pertumbuhan jangka panjang</span>
                        </Label>
                    </div>
                </RadioGroup>
            </Section>

            <Section title="Parameter Filter">
                <div className="space-y-4">
                    <Field label="Kementerian / Lembaga">
                        <Select value={selectedKddept} onValueChange={setSelectedKddept}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih Kementerian" />
                            </SelectTrigger>
                            <SelectContent>
                                {kementerianOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Jenis Belanja">
                        <Select value={selectedJenisBelanja} onValueChange={setSelectedJenisBelanja}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Semua Jenis Belanja" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Jenis Belanja</SelectItem>
                                {jenisBelanjaOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Baseline Tahun Data">
                        <Select value={selectedBaseline} onValueChange={setSelectedBaseline}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                {baselineOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                </div>
            </Section>

            <Section title="Setting Model & AI">
                <div className="space-y-4">
                    <Field label="Metode Prediksi">
                        <Select value={selectedMetode} onValueChange={setSelectedMetode}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(methodDefinitions).map((key) => (
                                    <SelectItem key={key} value={key}>
                                        {key.toUpperCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label={`Target Proyeksi (${jenisLaporan === "1" ? "Bulan" : "Tahun"})`}>
                        <Select value={selectedTargetProyeksi} onValueChange={setSelectedTargetProyeksi}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 6, 12, 24].map((v) => (
                                    <SelectItem key={v} value={v.toString()}>
                                        {v} {jenisLaporan === "1" ? "Bulan" : "Tahun"}
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
