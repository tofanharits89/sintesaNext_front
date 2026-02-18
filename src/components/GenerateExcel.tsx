"use client";

import React, { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import numeral from "numeral";
import { apiClient } from "@/lib/api/httpClient";

interface GenerateExcelProps {
    query3: string;
    status: (loading: boolean, total: number) => void;
    namafile: string;
    url?: string;
    token?: string;
    sheetName?: string;
}

interface ExcelData {
    [key: string]: any;
}

const GenerateExcel: React.FC<GenerateExcelProps> = ({
    query3,
    status,
    namafile,
    url,
    token,
    sheetName = "Sheet1",
}) => {
    const [data, setData] = useState<ExcelData[]>([]);
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

            // Default URL based on GenerateCSV patterns, but can be overridden
            const endpoint = url
                ? `${url}/${encryptedQuery}?limit=999999&page=0`
                : `/dispensasi/${encryptedQuery}?limit=999999&page=0`;

            const result = await apiClient.get(endpoint, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    "x-bypass-cache": "true",
                },
            });

            const excelData = Array.isArray(result) ? result : result.result || [];

            setData(excelData);
            setLoading(false);

            if (excelData.length === 0) {
                status(false, 0);
                toast.warning("Tidak ada data untuk diekspor");
            }
        } catch (error) {
            console.error("Excel fetch error:", error);
            toast.error(
                "Terjadi Permasalahan Koneksi atau Server Backend saat export Excel"
            );
            setLoading(false);
            status(false, 0);
        }
    };

    useEffect(() => {
        if (data.length > 0 && !hasDownloadedRef.current) {
            hasDownloadedRef.current = true;
            handleExportExcel();
            status(false, data.length);
        }
    }, [data]);

    const handleExportExcel = () => {
        if (!data || data.length === 0) return;

        // Prepare headers (uppercase)
        const formattedData = data.map((item) => {
            const newItem: any = {};
            Object.keys(item).forEach((key) => {
                let value = item[key];

                // Basic number formatting pattern from GenerateCSV
                const columnsToFormatAsNumber = [
                    "pagu_dipa", "pagu", "blokir", "realisasi", "pagu_apbn",
                    "jan", "feb", "mar", "apr", "mei", "jun",
                    "jul", "ags", "sep", "okt", "nov", "des",
                ];

                if (columnsToFormatAsNumber.includes(key.toLowerCase()) && typeof value === "string") {
                    const numericValue = parseFloat(numeral(value).format("0.00"));
                    newItem[key.toUpperCase()] = isNaN(numericValue) ? value : numericValue;
                } else {
                    newItem[key.toUpperCase()] = value;
                }
            });
            return newItem;
        });

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        XLSX.writeFile(workbook, `${namafile || "data"}.xlsx`);
        toast.success("Excel berhasil diunduh");
    };

    return null;
};

export default GenerateExcel;
