"use client";

import React, { useEffect, useState, useRef } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import numeral from "numeral";

import { apiClient } from "@/lib/api/httpClient";

interface GenerateCSVProps {
  query3: string;
  status: (loading: boolean, total: number) => void;
  namafile: string;
}

interface CSVData {
  [key: string]: string | number;
}

const GenerateCSV: React.FC<GenerateCSVProps> = ({
  query3,
  status,
  namafile,
}) => {
  const [data, setData] = useState<CSVData[]>([]);
  const [loading, setLoading] = useState(false);
  const hasDownloadedRef = useRef(false);

  useEffect(() => {
    if (query3) {
      hasDownloadedRef.current = false;
      getData();
    }
  }, [query3]);

  const getData = async () => {
    setLoading(true);
    try {
      const cleanedQuery = query3
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const encryptedQuery = btoa(cleanedQuery);

      const result = await apiClient.get(
        `/dispensasi/${encryptedQuery}?limit=999999&page=0`
      );

      const csvData = Array.isArray(result) ? result : result.result || [];

      console.log("[GenerateCSV] API Response:", result);
      console.log("[GenerateCSV] CSV Data extracted:", csvData);
      console.log("[GenerateCSV] CSV Data length:", csvData.length);

      setData(csvData);
      setLoading(false);

      if (csvData.length === 0) {
        status(false, 0);
        toast.warning("Tidak ada data untuk diekspor");
      }
    } catch (error) {
      console.error("CSV fetch error:", error);
      toast.error(
        "Terjadi Permasalahan Koneksi atau Server Backend saat export CSV"
      );
      setLoading(false);
      status(false, 0);
    }
  };

  useEffect(() => {
    if (data.length > 0 && !hasDownloadedRef.current) {
      hasDownloadedRef.current = true;
      console.log("[GenerateCSV] Triggering download");
      handleExportCSV();
      status(false, data.length);
    }
  }, [data]);

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      console.warn("[GenerateCSV] No data to export, data:", data);
      return;
    }

    console.log("[GenerateCSV] Starting export with", data.length, "rows");

    const config = {
      delimiter: ";", // Gunakan semicolon sebagai delimiter
    };

    const keys = Object.keys(data[0] || {}).map((key) => key.toUpperCase());
    console.log("[GenerateCSV] CSV Headers:", keys);

    const csvData = data.map((item) => {
      const row = Object.keys(item).map((key) => {
        let value = item[key];

        // Wrap in single quotes jika dimulai dengan '0'
        if (typeof value === "string" && value.charAt(0) === "0") {
          value = `'${value}`;
        }

        // List of columns to format as numbers
        const columnsToFormatAsNumber = [
          "pagu_dipa",
          "pagu",
          "blokir",
          "realisasi",
          "pagu_apbn",
          "jan",
          "feb",
          "mar",
          "apr",
          "mei",
          "jun",
          "jul",
          "ags",
          "sep",
          "okt",
          "nov",
          "des",
          "renc1",
          "real1",
          "renc2",
          "real2",
          "renc3",
          "real3",
          "renc4",
          "real4",
          "renc5",
          "real5",
          "renc6",
          "real6",
          "renc7",
          "real7",
          "renc8",
          "real8",
          "renc9",
          "real9",
          "renc10",
          "real10",
          "renc11",
          "real11",
          "renc12",
          "real12",
          "jmlkontrak",
          "nilaitup",
          "jmltup",
        ];

        // Format column sebagai number jika ada di list
        if (
          columnsToFormatAsNumber.includes(key.toLowerCase()) &&
          typeof value === "string"
        ) {
          value = numeral(value.toString()).format("0");
        }

        return value;
      });
      return row;
    });

    const formattedData = [keys, ...csvData];

    const csv = Papa.unparse(formattedData, config);
    console.log("[GenerateCSV] CSV Generated, length:", csv.length);
    console.log("[GenerateCSV] First 500 chars:", csv.substring(0, 500));

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    console.log("[GenerateCSV] Blob created, size:", blob.size);

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = namafile ? `${namafile}.csv` : "data.csv";
    link.setAttribute("target", "_blank");

    console.log("[GenerateCSV] Triggering download:", link.download);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    console.log("[GenerateCSV] Download completed");
  };

  return null;
};

export default GenerateCSV;
