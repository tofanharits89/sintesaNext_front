import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ChevronDown, 
  Download, 
  RotateCcw, 
  Play, 
  Database, 
  Loader2,
  FileText,
  FileSpreadsheet,
  FileDown
} from "lucide-react";
import { SelectOption, MONTHS } from "../dnf-types";

interface FilterTPGProps {
  selectedYear: string;
  setSelectedYear: (v: string) => void;
  yearOptions: SelectOption[];
  selectedKanwil: string;
  setSelectedKanwil: (v: string) => void;
  kanwilOptions: SelectOption[];
  selectedKppn: string;
  setSelectedKppn: (v: string) => void;
  kppnOptions: SelectOption[];
  selectedPeriode: string;
  setSelectedPeriode: (v: string) => void;
  periodeOptions: SelectOption[];
  selectedGelombang: string;
  setSelectedGelombang: (v: string) => void;
  gelombangOptions: SelectOption[];
  selectedJenisTkd: string;
  setSelectedJenisTkd: (v: string) => void;
  jenisTkdOptions: SelectOption[];
  startMonth: string;
  setStartMonth: (v: string) => void;
  endMonth: string;
  setEndMonth: (v: string) => void;
  role: string;
  onTayang: () => void;
  onDownloadCSV: () => void;
  onDownloadExcel: () => void;
  onDownloadPDF: () => void;
  onRefresh: () => void;
  onShowSQL: () => void;
  loading: boolean;
}

export const FilterTPG: React.FC<FilterTPGProps> = ({
  selectedYear,
  setSelectedYear,
  yearOptions,
  selectedKanwil,
  setSelectedKanwil,
  kanwilOptions,
  selectedKppn,
  setSelectedKppn,
  kppnOptions,
  selectedPeriode,
  setSelectedPeriode,
  periodeOptions,
  selectedGelombang,
  setSelectedGelombang,
  gelombangOptions,
  selectedJenisTkd,
  setSelectedJenisTkd,
  jenisTkdOptions,
  startMonth,
  setStartMonth,
  endMonth,
  setEndMonth,
  role,
  onTayang,
  onDownloadCSV,
  onDownloadExcel,
  onDownloadPDF,
  onRefresh,
  onShowSQL,
  loading,
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base font-semibold">Filter Data TPG</CardTitle>
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
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[250px] space-y-2">
          <Label>Kanwil</Label>
          <SearchableSelect
            options={[{ label: "-- Semua --", value: "" }, ...kanwilOptions]}
            value={selectedKanwil}
            onValueChange={setSelectedKanwil}
            disabled={role === "2" || role === "3"}
            placeholder="-- Semua --"
          />
        </div>

        <div className="flex-1 min-w-[250px] space-y-2">
          <Label>KPPN</Label>
          <SearchableSelect
            options={[{ label: "-- Semua --", value: "" }, ...kppnOptions]}
            value={selectedKppn}
            onValueChange={setSelectedKppn}
            disabled={role === "3"}
            placeholder="-- Semua --"
          />
        </div>

        <div className="flex-1 min-w-[200px] space-y-2">
          <Label>Periode</Label>
          <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="-- Semua --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">-- Semua --</SelectItem>
              {periodeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px] space-y-2">
          <Label>Gelombang</Label>
          <Select value={selectedGelombang} onValueChange={setSelectedGelombang}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="-- Semua --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">-- Semua --</SelectItem>
              {gelombangOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px] space-y-2">
          <Label>Jenis TKD</Label>
          <Select value={selectedJenisTkd} onValueChange={setSelectedJenisTkd}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="-- Semua --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">-- Semua --</SelectItem>
              {jenisTkdOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[300px] space-y-2">
          <Label>Bulan SP2D</Label>
          <div className="flex items-center gap-2">
            <Select value={startMonth} onValueChange={setStartMonth}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Dari" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm shrink-0">s.d.</span>
            <Select value={endMonth} onValueChange={setEndMonth}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sampai" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t pt-6 mt-2">
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={onTayang}
            disabled={loading}
            className="min-w-[150px] h-10"
          >
            {loading ? (
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[150px] h-10 gap-2">
                <Download className="h-4 w-4" />
                Download
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[150px]">
              <DropdownMenuItem onClick={onDownloadCSV} className="gap-2">
                <FileText className="h-4 w-4" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDownloadExcel} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                EXCEL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDownloadPDF} className="gap-2">
                <FileDown className="h-4 w-4" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={onRefresh}
            className="min-w-[150px] h-10"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          {role === "X" && (
            <Button
              variant="outline"
              onClick={onShowSQL}
              className="min-w-[150px] h-10 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
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

interface FilterBosBopProps {
  selectedYear: string;
  setSelectedYear: (v: string) => void;
  yearOptions: SelectOption[];
  selectedKanwil: string;
  setSelectedKanwil: (v: string) => void;
  kanwilOptions: SelectOption[];
  selectedKppn: string;
  setSelectedKppn: (v: string) => void;
  kppnOptions: SelectOption[];
  selectedProgram: string;
  setSelectedProgram: (v: string) => void;
  programOptions: SelectOption[];
  selectedJenisBos: string;
  setSelectedJenisBos: (v: string) => void;
  jenisBosOptions: SelectOption[];
  selectedJenjang: string;
  setSelectedJenjang: (v: string) => void;
  jenjangOptions: SelectOption[];
  startMonth: string;
  setStartMonth: (v: string) => void;
  endMonth: string;
  setEndMonth: (v: string) => void;
  role: string;
  onTayang: () => void;
  onDownloadCSV: () => void;
  onDownloadExcel: () => void;
  onDownloadPDF: () => void;
  onRefresh: () => void;
  onShowSQL: () => void;
  loading: boolean;
}

export const FilterBosBop: React.FC<FilterBosBopProps> = ({
  selectedYear,
  setSelectedYear,
  yearOptions,
  selectedKanwil,
  setSelectedKanwil,
  kanwilOptions,
  selectedKppn,
  setSelectedKppn,
  kppnOptions,
  selectedProgram,
  setSelectedProgram,
  programOptions,
  selectedJenisBos,
  setSelectedJenisBos,
  jenisBosOptions,
  selectedJenjang,
  setSelectedJenjang,
  jenjangOptions,
  startMonth,
  setStartMonth,
  endMonth,
  setEndMonth,
  role,
  onTayang,
  onDownloadCSV,
  onDownloadExcel,
  onDownloadPDF,
  onRefresh,
  onShowSQL,
  loading,
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base font-semibold">Filter Data BOS / BOP</CardTitle>
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
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[250px] space-y-2">
          <Label>Kanwil</Label>
          <SearchableSelect
            options={[{ label: "-- Semua --", value: "" }, ...kanwilOptions]}
            value={selectedKanwil}
            onValueChange={setSelectedKanwil}
            disabled={role === "2" || role === "3"}
            placeholder="-- Semua --"
          />
        </div>

        <div className="flex-1 min-w-[250px] space-y-2">
          <Label>KPPN</Label>
          <SearchableSelect
            options={[{ label: "-- Semua --", value: "" }, ...kppnOptions]}
            value={selectedKppn}
            onValueChange={setSelectedKppn}
            disabled={role === "3"}
            placeholder="-- Semua --"
          />
        </div>

        <div className="flex-1 min-w-[200px] space-y-2">
          <Label>Program</Label>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="-- Semua --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">-- Semua --</SelectItem>
              {programOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px] space-y-2">
          <Label>Jenis BOS</Label>
          <Select value={selectedJenisBos} onValueChange={setSelectedJenisBos}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="-- Semua --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">-- Semua --</SelectItem>
              {jenisBosOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px] space-y-2">
          <Label>Jenjang</Label>
          <Select value={selectedJenjang} onValueChange={setSelectedJenjang}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="-- Semua --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">-- Semua --</SelectItem>
              {jenjangOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[300px] space-y-2">
          <Label>Bulan SP2D</Label>
          <div className="flex items-center gap-2">
            <Select value={startMonth} onValueChange={setStartMonth}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Dari" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm shrink-0">s.d.</span>
            <Select value={endMonth} onValueChange={setEndMonth}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sampai" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);
