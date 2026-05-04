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
import { DDHeaderFiltersProps } from "./types";
import { MONTHS } from "./utils";
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

export const DDHeaderFilters: React.FC<DDHeaderFiltersProps> = ({
  selectedYear,
  setSelectedYear,
  yearOptions,
  selectedkanwil,
  setSelectedkanwil,
  kanwilOptions,
  selectedkppn,
  setSelectedkppn,
  kppnOptions,
  selectedLokasi,
  setSelectedLokasi,
  lokasiOptions,
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
  loadingResults,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Filter Data</CardTitle>
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
              className="min-w-[150px] h-10"
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
};
