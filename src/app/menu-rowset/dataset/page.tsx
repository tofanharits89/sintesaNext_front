"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, FileDown, Copy, CheckCircle } from "lucide-react";

export default function DatasetPage() {
  const [loading, setLoading] = useState(false);
  const [sumber, setSumber] = useState("");
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [where, setWhere] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("json");
  const [isCopied, setIsCopied] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [hasilQuery, setHasilQuery] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  // Dummy data untuk placeholder
  const databases = ["dbref", "laporan_2023", "tkd", "data_omspan"];
  const tables = ["tabel_1", "tabel_2", "tabel_3"];
  const dataCol = [
    "id",
    "kode_kementerian",
    "nama_kementerian",
    "kode_satker",
    "nama_satker",
    "tahun",
    "bulan",
    "nilai_pagu",
    "nilai_realisasi",
    "created_at",
    "updated_at",
  ];

  const handleCopy = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleGenerate = () => {
    setLoading(true);
    // Simulasi loading
    setTimeout(() => {
      setLoading(false);
      setTotal(100);
      setHasilQuery([
        { id: 1, nama: "Sample Data 1" },
        { id: 2, nama: "Sample Data 2" },
      ]);
    }, 1500);
  };

  const displayJSON = (data: any) => {
    if (!data || Object.keys(data).length === 0) {
      return "Tidak ada hasil yang ditemukan";
    }
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Generate Data</h1>
          <p className="text-sm text-muted-foreground">DB → Tabel</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Form Card */}
        <div className="bg-white dark:bg-card border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Sumber */}
            <div className="space-y-2">
              <Label htmlFor="sumber" className="text-foreground">
                Sumber
              </Label>
              <Select value={sumber} onValueChange={setSumber}>
                <SelectTrigger className="w-full bg-background border-input text-foreground">
                  <SelectValue placeholder="--- Pilih Sumber Data ---" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DITPA">MYSQL (DITPA)</SelectItem>
                  <SelectItem value="SITP">ORACLE (SITP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Database */}
            <div className="space-y-2">
              <Label htmlFor="database" className="text-foreground">
                Database
              </Label>
              <Select
                value={selectedDatabase}
                onValueChange={setSelectedDatabase}
                disabled={!sumber}
              >
                <SelectTrigger className="w-full bg-background border-input text-foreground">
                  <SelectValue placeholder="Pilih Database" />
                </SelectTrigger>
                <SelectContent>
                  {databases.map((db) => (
                    <SelectItem key={db} value={db}>
                      {db}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tabel */}
            <div className="space-y-2">
              <Label htmlFor="tabel" className="text-foreground">
                Tabel
              </Label>
              <Select
                value={selectedTable}
                onValueChange={setSelectedTable}
                disabled={!selectedDatabase || sumber === "SITP"}
              >
                <SelectTrigger className="w-full bg-background border-input text-foreground">
                  <SelectValue placeholder="Pilih Tabel" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t border-border pt-6 mb-6"></div>

          {/* Pilih Fields Data */}
          {selectedTable && (
            <div className="mb-6">
              <div className="mb-4">
                <h3 className="text-base font-medium text-foreground">
                  Pilih Fields Data
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-h-[200px] border border-border rounded-lg p-4">
                {dataCol.map((field, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={field}
                      defaultChecked
                      disabled
                      className="border-input"
                    />
                    <label
                      htmlFor={field}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground"
                    >
                      {field.toUpperCase()}
                    </label>
                  </div>
                ))}
              </div>

              {/* Where Clause */}
              <div className="mt-4">
                <Input
                  type="text"
                  placeholder="tambahkan klausa untuk memperkecil baris data ( contoh : <namakolom>='XXX' AND <namakolom>='YYY' dst ...)"
                  value={where}
                  onChange={(e) => setWhere(e.target.value)}
                  disabled={sumber === "SITP"}
                  className="bg-background border-input text-foreground"
                />
              </div>
            </div>
          )}

          {/* Footer Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="text-muted-foreground text-xl">⬢</div>
              <span className="text-xl font-normal text-foreground">
                sintesa
              </span>
            </div>

            {/* Radio Format */}
            <RadioGroup
              value={selectedFormat}
              onValueChange={setSelectedFormat}
              className="flex items-center gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label
                  htmlFor="json"
                  className="text-foreground cursor-pointer"
                >
                  JSON
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="text-foreground cursor-pointer">
                  CSV
                </Label>
              </div>
            </RadioGroup>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={loading || !selectedDatabase}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Loading..." : "Generate"}
            </Button>
          </div>
        </div>

        {/* Results Card */}
        <div className="bg-white dark:bg-card border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-lg">
          <div className="p-6 max-h-[400px] overflow-auto">
            {selectedFormat === "csv" && hasilQuery.length > 0 && (
              <div className="text-center">
                <Button
                  onClick={() => setLoadingStatus(true)}
                  disabled={loadingStatus}
                  className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
                >
                  {loadingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </div>
            )}

            {selectedFormat === "json" && hasilQuery.length > 0 && (
              <>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {total === 0 ? (
                      <p className="text-center text-muted-foreground">
                        Data kosong
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                          <h4 className="text-lg font-medium text-foreground bg-muted px-4 py-2 rounded">
                            Format JSON
                          </h4>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                              {total} data ditemukan
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleCopy}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {isCopied ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <Copy className="w-5 h-5" />
                              )}
                            </Button>
                            {isCopied && (
                              <span className="text-green-600 text-sm">
                                Copied!
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <textarea
                            className="w-full min-h-[200px] p-4 bg-muted text-foreground border-0 rounded font-mono text-sm"
                            value={displayJSON(hasilQuery)}
                            readOnly
                            rows={10}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* Empty State */}
            {hasilQuery.length === 0 && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                Belum ada hasil. Silakan generate data terlebih dahulu.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
