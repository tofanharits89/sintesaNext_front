"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { apiClient } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";

interface UploadSpmProps {
  id?: string;
  cekupload?: boolean;
}

const expectedColumns = ["tgspm", "nospm", "nilai_spm", "tgbast", "nobast"];
const maxRows = 200;

export default function UploadSPM({ id, cekupload }: UploadSpmProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [processSuccess, setProcessSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<any[]>([]);
  const [fileName, setFileName] = useState("Pilih File Excel");
  const [formatDispen, setFormatDispen] = useState("Template Excel");

  useEffect(() => {
    if (cekupload && id) fetchFormData();
  }, [cekupload, id]);

  async function fetchFormData() {
    try {
      const query =
        `SELECT id,thang,kddept,kdunit,kdkanwil,kdlokasi,kdsatker,tgpermohonan,nopermohonan,kd_dispensasi,rpata FROM  laporan_2023.dispensasi_spm WHERE id='${id}'`
      ;
      const encryptedQuery = btoa(query);
      const url = apiPath(`/dispensasi/${encryptedQuery}?limit=1&page=0`);
      const resp = await fetch(url, { credentials: "include" });
      if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);
      const json = await resp.json();
      setFormData(json?.result || json?.data || json || []);
    } catch (err: any) {
      console.warn("fetchFormData error:", err?.message || err);
    }
  }

  const isValidDate = (dateString: string) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date as any);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true);
    setError(null);
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setLoading(false);
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const binaryStr = event.target?.result as string;
        const workbook = XLSX.read(binaryStr, { type: "binary" });
        const sheetName = workbook.SheetNames?.[0];
        if (!sheetName) {
          setError("Workbook tidak memiliki sheet");
          setData([]);
          setLoading(false);
          return;
        }
        const sheet = workbook.Sheets[sheetName as string];
        if (!sheet) {
          setError("Sheet tidak dapat diakses");
          setData([]);
          setLoading(false);
          return;
        }

        // Read rows as array (header row expected)
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
        }) as any[];
        if (!rows || rows.length === 0) {
          setError("File kosong atau tidak dapat dibaca");
          setData([]);
          setLoading(false);
          return;
        }

        const headers = rows[0];
        if (
          !headers ||
          headers.length !== expectedColumns.length ||
          !headers.every(
            (h: any, idx: number) => String(h) === expectedColumns[idx]
          )
        ) {
          setError(
            `Header tidak valid. Susunan kolom: ${expectedColumns.join(", ")}`
          );
          setLoading(false);
          setData([]);
          return;
        }

        // remove header row
        rows.shift();

        // convert rows to objects with expected columns
        const processedData = rows.map((row) =>
          Object.fromEntries(
            row.map((cell: any, index: number) => [
              expectedColumns[index],
              cell,
            ])
          )
        );

        if (processedData.length > maxRows) {
          setError(
            `Jumlah baris [${processedData.length}] Error : Maksimum ${maxRows} baris yang diizinkan`
          );
          setLoading(false);
          setData([]);
          return;
        }

        const invalidRows = processedData.filter(
          (row) =>
            !isValidDate(String(row.tgspm)) || !isValidDate(String(row.tgbast))
        );
        if (invalidRows.length > 0) {
          setError(
            `Data pada kolom tgspm atau tgbast harus berformat tanggal (yyyy-mm-dd).`
          );
          setLoading(false);
          setData([]);
          return;
        }

        setData(processedData as any[]);
      } catch (err: any) {
        setError(err?.message || "Gagal membaca file");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleProcessData = async () => {
    if (data.length === 0) return toast.error("Tidak ada data untuk diupload");
    if (!confirm("Apakah anda yakin ingin upload data ini?")) return;

    setProcessing(true);
    setProcessError(null);
    setProcessSuccess(null);

    try {
      const body = { formData, data };

      await apiClient.post("/dispensasi/upload-spm", body);

      setProcessSuccess("Data berhasil di Upload.");
      toast.success("Data berhasil di Upload.");
      setData([]);
      setFileName("Pilih File Excell");
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || err?.message || "Gagal upload data";
      setProcessError(errMsg);
      toast.error(errMsg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-red-600 font-semibold">
        *) Catatan : Excel berisi 5 kolom (tgspm|nospm|nilai_spm|tgbast|nobast)
        <br /> Maksimal 200 baris per upload. Gunakan format TEXT pada setiap
        kolom.
      </div>

      <div className="flex gap-3 items-center">
        <a
          className={buttonVariants({ variant: "destructive" })}
          href={`${process.env.NEXT_PUBLIC_FORMAT_DISPEN ||
            "/format_dispen/format_dispen_spm.xlsx"
            }`}
        >
          {formatDispen}
        </a>

        <label className={buttonVariants({ variant: "default", className: "cursor-pointer" })}>
          {fileName}
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {loading && <div className="text-sm text-muted">Memuat file...</div>}

      {error && <div className="text-sm text-red-600">{error}</div>}

      {data.length > 0 && (
        <div className="overflow-y-auto max-h-60 border rounded p-2">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr>
                {Object.keys(data[0]).map((k) => (
                  <th
                    key={k}
                    className="text-left px-2 py-1 font-semibold text-gray-900"
                  >
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="even:bg-muted/50">
                  {Object.values(row).map((cell, i) => (
                    <td key={i} className="px-2 py-1">
                      {String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.length > 0 && (
        <div className="flex items-center justify-between">
          <div>Jumlah data: {data.length}</div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setData([]);
                setFileName("Pilih File Excel");
              }}
            >
              Reset
            </Button>
            <Button onClick={handleProcessData} disabled={processing}>
              {processing ? "Uploading..." : "Upload Data"}
            </Button>
          </div>
        </div>
      )}

      {processSuccess && (
        <div className="text-sm text-green-600">{processSuccess}</div>
      )}
      {processError && (
        <div className="text-sm text-red-600">{processError}</div>
      )}
    </div>
  );
}
