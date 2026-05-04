import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { ResetButton } from "@/components/ui/reset-button";
import {
  Play,
  Database,
  Loader2,
  FileText,
  FileSpreadsheet,
  FileDown,
  Settings2
} from "lucide-react";
import { MONTHS, SelectOption } from "./types";

interface DakFisikFiltersProps {
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  yearOptions: SelectOption[];
  selectedkanwil: string;
  setSelectedkanwil: (value: string) => void;
  kanwilOptions: SelectOption[];
  selectedkppn: string;
  setSelectedkppn: (value: string) => void;
  kppnOptions: SelectOption[];
  selectedLokasi: string;
  setSelectedLokasi: (value: string) => void;
  lokasiOptions: SelectOption[];
  selectedJenisDana: string;
  setSelectedJenisDana: (value: string) => void;
  jenisDanaOptions: SelectOption[];
  selectedBidang: string;
  setSelectedBidang: (value: string) => void;
  bidangOptions: SelectOption[];
  selectedSubBidang: string;
  setSelectedSubBidang: (value: string) => void;
  subBidangOptions: SelectOption[];
  startMonth: string;
  setStartMonth: (value: string) => void;
  endMonth: string;
  setEndMonth: (value: string) => void;
  role: string;
  onTayang: () => void;
  onDownloadCSV: () => void;
  onDownloadExcel: () => void;
  onDownloadPDF: () => void;
  onShowSQL: () => void;
  onReset: () => void;
  loadingResults: boolean;
}

export const DakFisikFilters: React.FC<DakFisikFiltersProps> = ({
  selectedYear, setSelectedYear, yearOptions,
  selectedkanwil, setSelectedkanwil, kanwilOptions,
  selectedkppn, setSelectedkppn, kppnOptions,
  selectedLokasi, setSelectedLokasi, lokasiOptions,
  selectedJenisDana, setSelectedJenisDana, jenisDanaOptions,
  selectedBidang, setSelectedBidang, bidangOptions,
  selectedSubBidang, setSelectedSubBidang, subBidangOptions,
  startMonth, setStartMonth,
  endMonth, setEndMonth,
  role,
  onTayang,
  onDownloadCSV,
  onDownloadExcel,
  onDownloadPDF,
  onShowSQL,
  onReset,
  loadingResults,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Filter Data DAK Fisik</CardTitle>
          </div>
          <ResetButton onReset={onReset} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] space-y-2">
            <Label>Tahun</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Semua --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">-- Semua --</SelectItem>
                {yearOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[250px] space-y-2">
            <Label>Kanwil</Label>
            <SearchableSelect
              options={[
                { label: "-- Semua --", value: "" },
                ...kanwilOptions
              ]}
              value={selectedkanwil}
              onValueChange={setSelectedkanwil}
              disabled={role === "2" || role === "3"}
              placeholder="-- Semua --"
            />
          </div>

          <div className="flex-1 min-w-[250px] space-y-2">
            <Label>KPPN</Label>
            <SearchableSelect
              options={[
                { label: "-- Semua --", value: "" },
                ...kppnOptions
              ]}
              value={selectedkppn}
              onValueChange={setSelectedkppn}
              disabled={role === "3"}
              placeholder="-- Semua --"
            />
          </div>

          <div className="flex-1 min-w-[250px] space-y-2">
            <Label>Lokasi</Label>
            <SearchableSelect
              options={[
                { label: "-- Semua --", value: "" },
                ...lokasiOptions
              ]}
              value={selectedLokasi}
              onValueChange={setSelectedLokasi}
              placeholder="-- Semua --"
            />
          </div>

          <div className="flex-1 min-w-[200px] space-y-2">
            <Label>Jenis Dana</Label>
            <Select
              value={selectedJenisDana}
              onValueChange={setSelectedJenisDana}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Semua --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">-- Semua --</SelectItem>
                {jenisDanaOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px] space-y-2">
            <Label>Bidang</Label>
            <Select value={selectedBidang} onValueChange={setSelectedBidang}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Semua --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">-- Semua --</SelectItem>
                {bidangOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedBidang && (
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label>Sub Bidang</Label>
              <Select
                value={selectedSubBidang}
                onValueChange={setSelectedSubBidang}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- Semua --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">-- Semua --</SelectItem>
                  {subBidangOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex-1 min-w-[300px] space-y-2">
            <Label>Bulan SP2D</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select value={startMonth} onValueChange={setStartMonth}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Dari" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-sm px-1 shrink-0">s.d.</span>
              <div className="flex-1">
                <Select value={endMonth} onValueChange={setEndMonth}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sampai" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-6 mt-2">
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={onTayang}
              disabled={loadingResults}
              className="w-36 h-10"
            >
              {loadingResults ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Tayang
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={onDownloadCSV}
              className="w-36 h-10 gap-2 bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100 hover:text-sky-800"
            >
              <FileText className="h-4 w-4" />
              CSV
            </Button>

            <Button
              variant="outline"
              onClick={onDownloadExcel}
              className="w-36 h-10 gap-2 bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 hover:text-emerald-800"
            >
              <FileSpreadsheet className="h-4 w-4" />
              EXCEL
            </Button>

            <Button
              variant="outline"
              onClick={onDownloadPDF}
              className="w-36 h-10 gap-2 bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100 hover:text-rose-800"
            >
              <FileDown className="h-4 w-4" />
              PDF
            </Button>

            {role === "X" && (
              <Button
                variant="outline"
                onClick={onShowSQL}
                className="w-36 h-10 bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100 hover:text-slate-800"
              >
                <Database className="h-4 w-4 mr-2" />
                SQL
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
