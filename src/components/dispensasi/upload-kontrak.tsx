"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiPath } from "@/lib/config/base-path";

interface UploadKontrakProps {
  id?: string;
  cekupload?: boolean;
}

const expectedColumns = ["tgkontrak", "nokontrak", "nilkontrak"];
const maxRows = 200;

export default function UploadKontrak({ id, cekupload }: UploadKontrakProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [processSuccess, setProcessSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<any[]>([]);
  const [fileName, setFileName] = useState("Pilih File Excel");
  const [formatDispenName, setFormatDispenName] = useState("Template Excel");

  useEffect(() => {
    if (cekupload && id) {
      fetchFormData();
    }
  }, [cekupload, id]);

  async function fetchFormData() {
    try {
      const query =
        `SELECT id,thang,kddept,kdunit,kdkanwil,kdlokasi,kdsatker,tgpermohonan,nopermohonan FROM  laporan_2023.dispensasi_kontrak WHERE id='${id}' GROUP BY id`
      ;
      const encryptedQuery = btoa(query);
      const url = apiPath(`/dispensasi/${encryptedQuery}?limit=1&page=0`);

      const resp = await fetch(url, { credentials: "include" });
      if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);
      const json = await resp.json();
      // Keep the same shape as original where response.data contained values
      setFormData(json?.result || json?.data || json || []);
    } catch (err: any) {
      // Non-fatal: keep quiet and allow upload without formData
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
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!jsonData || jsonData.length === 0) {
          setError("File kosong atau tidak dapat dibaca");
          setData([]);
          setLoading(false);
          return;
        }

        // Validate header order
        const headers = Object.keys(jsonData[0]);
        if (!expectedColumns.every((col, idx) => col === headers[idx])) {
          setError(
            `Header tidak sesuai. Susunan kolom: ${expectedColumns.join(", ")}`
          );
          setData([]);
          setLoading(false);
          return;
        }

        if (headers.length !== expectedColumns.length) {
          setError(`Jumlah kolom [${headers.length}] tidak sesuai format`);
          setData([]);
          setLoading(false);
          return;
        }

        if (jsonData.length > maxRows) {
          setError(
            `Jumlah baris [${jsonData.length}] maksimal ${maxRows} baris yang diizinkan`
          );
          setData([]);
          setLoading(false);
          return;
        }

        const invalidRows = jsonData.filter(
          (row) => !isValidDate(String(row.tgkontrak))
        );
        if (invalidRows.length > 0) {
          setError(
            "Data pada kolom tgkontrak harus berformat tanggal (yyyy-mm-dd)."
          );
          setData([]);
          setLoading(false);
          return;
        }

        setData(jsonData);
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
      const url = apiPath("/dispensasi/upload-kontrak");

      const body = { formData, data };

      const resp = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson?.error || `Server error: ${resp.status}`);
      }

      setProcessSuccess("Data berhasil di Upload.");
      toast.success("Data berhasil di Upload.");
      setData([]);
      setFileName("Pilih File Excel");
    } catch (err: any) {
      setProcessError(err?.message || "Gagal upload data");
      toast.error(err?.message || "Gagal upload data");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-red-600 font-semibold">
        *) Catatan : Excel berisi 3 kolom (tgkontrak | nokontrak | nilkontrak).
        Maksimal 200 baris per upload. Gunakan format TEXT pada setiap kolom.
      </div>

      <div className="flex gap-3 items-center">
        <a
          className={buttonVariants({ variant: "destructive" })}
          href={`${process.env.NEXT_PUBLIC_FORMAT_DISPEN ||
            "/format_dispen/format_dispen_kontrak.xlsx"
            }`}
        >
          {formatDispenName}
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {Object.keys(data[0]).map((k) => (
                  <TableHead key={k} className="font-semibold text-gray-900">
                    {k}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={idx}>
                  {Object.values(row).map((cell, i) => (
                    <TableCell key={i}>{String(cell)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
