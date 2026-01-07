"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Info, Settings, Keyboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api/httpClient";
import Swal from "sweetalert2";

// Components
import { PrognosisFilters } from "@/components/prognosis/filters";
import { PrognosisActionBar } from "@/components/prognosis/action-bar";
import { PrognosisChart } from "@/components/prognosis/chart-proyeksi";
import { PrognosisAIAnalysis } from "@/components/prognosis/ai-analysis";
import { PrognosisTableDetail } from "@/components/prognosis/table-detail";
import { PrognosisSQLModal } from "@/components/prognosis/sql-modal";

export default function PrognosisPage() {
    const { user } = useAuth();
    const role = user?.role;
    const currentYear = new Date().getFullYear();

    // --- State Management ---

    // Filter States
    const [jenisLaporan, setJenisLaporan] = useState("1");
    const [selectedKddept, setSelectedKddept] = useState("");
    const [selectedJenisBelanja, setSelectedJenisBelanja] = useState("all");
    const [selectedBaseline, setSelectedBaseline] = useState("");
    const [selectedMetode, setSelectedMetode] = useState("arima");
    const [selectedTargetProyeksi, setSelectedTargetProyeksi] = useState("3");

    // Options States
    const [kementerianOptions, setKementerianOptions] = useState<any[]>([]);
    const [jenisBelanjaOptions, setJenisBelanjaOptions] = useState<any[]>([]);
    const [baselineOptions, setBaselineOptions] = useState<any[]>([]);

    // UI States
    const [loading, setLoading] = useState(false);
    const [loadingResults, setLoadingResults] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showModalSQL, setShowModalSQL] = useState(false);
    const [sqlQuery, setSqlQuery] = useState("");

    // Data States
    const [tableData, setTableData] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [predictionData, setPredictionData] = useState<any>(null);

    // Chart zoom state
    const [selectedZoomYear, setSelectedZoomYear] = useState<number | null>(null);

    // --- Effects ---

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                setLoading(true);
                const depts = await apiClient.get("/prognosis/getKementerian");
                setKementerianOptions(depts || []);

                const belanjas = await apiClient.get("/prognosis/getJenisBelanja");
                setJenisBelanjaOptions(belanjas || []);

                const baselines = [];
                for (let y = currentYear - 5; y <= currentYear; y++) {
                    baselines.push({ label: y.toString(), value: y.toString() });
                }
                setBaselineOptions(baselines);

                if (depts?.length > 0) setSelectedKddept(depts[0].value);
                setSelectedBaseline((currentYear - 3).toString());
            } catch (error) {
                console.error("Failed to fetch options", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOptions();
    }, [currentYear]);

    // --- Handlers ---

    const handleTayang = async () => {
        if (!selectedKddept || !selectedBaseline) {
            Swal.fire({
                icon: "warning",
                title: "Parameter Tidak Lengkap",
                text: "Silakan pilih Kementerian dan Baseline terlebih dahulu",
            });
            return;
        }

        try {
            setLoadingResults(true);
            setShowResults(false);

            const historical = await fetchHistoricalData();
            if (historical && historical.length > 0) {
                await fetchPredictionData(historical);
                setShowResults(true);
            }
        } catch (error) {
            console.error("Error in handleTayang:", error);
            Swal.fire({
                icon: "error",
                title: "Kesalahan",
                text: "Gagal memproses data prognosis",
            });
        } finally {
            setLoadingResults(false);
        }
    };

    const fetchHistoricalData = async () => {
        const pembulatan = 1;
        let query = "";

        if (jenisLaporan === "1") {
            const realbulananakumulatif = `
                , ROUND(SUM(real1)/${pembulatan}, 0) AS JAN
                , ROUND(SUM(real1 + real2)/${pembulatan}, 0) AS FEB
                , ROUND(SUM(real1 + real2 + real3)/${pembulatan}, 0) AS MAR
                , ROUND(SUM(real1 + real2 + real3 + real4)/${pembulatan}, 0) AS APR
                , ROUND(SUM(real1 + real2 + real3 + real4 + real5)/${pembulatan}, 0) AS MEI
                , ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6)/${pembulatan}, 0) AS JUN
                , ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7)/${pembulatan}, 0) AS JUL
                , ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8)/${pembulatan}, 0) AS AGS
                , ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9)/${pembulatan}, 0) AS SEP
                , ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9 + real10)/${pembulatan}, 0) AS OKT
                , ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9 + real10 + real11)/${pembulatan}, 0) AS NOV
                , ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9 + real10 + real11 + real12)/${pembulatan}, 0) AS DES
            `;

            const actualJenbel = selectedJenisBelanja === "all" ? "" : selectedJenisBelanja;
            query = `SELECT kddept, nmdept, '${actualJenbel || "Semua Jenis Belanja"}' as jenbel, tahun, ROUND(SUM(pagu)/${pembulatan}, 0) as pagu ${realbulananakumulatif} FROM prognosis.mapping_ba_long WHERE kddept = '${selectedKddept}' AND tahun >= '${selectedBaseline}' AND tahun <= '${currentYear}'`;
            if (actualJenbel) query += ` AND jenbel = '${actualJenbel}'`;
            query += ` GROUP BY kddept, nmdept, tahun ORDER BY tahun`;
        } else {
            const actualJenbel = selectedJenisBelanja === "all" ? "" : selectedJenisBelanja;
            query = `SELECT kddept, nmdept, '${actualJenbel || "Semua Jenis Belanja"}' as jenbel, tahun, ROUND(SUM(pagu)/${pembulatan}, 0) as pagu, ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9 + real10 + real11 + real12)/${pembulatan}, 0) as total_realisasi FROM prognosis.mapping_ba_long WHERE kddept = '${selectedKddept}' AND tahun >= '${selectedBaseline}' AND tahun <= '${currentYear}'`;
            if (actualJenbel) query += ` AND jenbel = '${actualJenbel}'`;
            query += ` GROUP BY kddept, nmdept, tahun ORDER BY tahun`;
        }

        setSqlQuery(query);
        const data = await apiClient.get(`/prognosis/getDataKinerja?queryParams=${encodeURIComponent(query)}`);
        setTableData(data || []);
        return data;
    };

    const fetchPredictionData = async (historical: any[]) => {
        let mlData: any[] = [];
        if (jenisLaporan === "1") {
            historical.forEach((item) => {
                const months = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGS", "SEP", "OKT", "NOV", "DES"];
                months.forEach((month, index) => {
                    const val = item[month];
                    if (val !== null && val !== undefined && val !== 0) {
                        mlData.push({
                            tahun: parseInt(item.tahun),
                            bulan: index + 1,
                            pagu: parseFloat(item.pagu || 0),
                            realisasi: parseFloat(val || 0),
                            kddept: parseInt(selectedKddept),
                            jenbel: item.jenbel,
                        });
                    }
                });
            });
        } else {
            mlData = historical.map((item) => ({
                tahun: parseInt(item.tahun),
                bulan: 12,
                pagu: parseFloat(item.pagu || 0),
                realisasi: parseFloat(item.total_realisasi || 0),
                kddept: parseInt(selectedKddept),
                jenbel: item.jenbel,
            }));
        }

        const predictionRequest = {
            method: selectedMetode,
            data: mlData,
            parameters: {
                targetPeriods: parseInt(selectedTargetProyeksi),
                baseline_year: parseInt(selectedBaseline),
                training_end_year: currentYear,
                prediction_start_year: currentYear,
                prediction_start_month: 10,
                kddept: selectedKddept,
                jenis_belanja: selectedJenisBelanja === "all" ? "" : selectedJenisBelanja,
            },
        };

        const res = await apiClient.post("/prognosis/predict", predictionRequest);
        if (res?.prediction) {
            setPredictionData(res);
            prepareChartData(historical, res.prediction);
        }
    };

    const prepareChartData = (historical: any[], prediction: any) => {
        const data: any[] = [];
        historical.forEach((item) => {
            if (jenisLaporan === "1") {
                const months = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGS", "SEP", "OKT", "NOV", "DES"];
                months.forEach((m, i) => {
                    const val = item[m];
                    if (val) {
                        data.push({
                            name: `${item.tahun}-${(i + 1).toString().padStart(2, '0')}`,
                            realisasi: (val / item.pagu) * 100,
                            type: 'Historical'
                        });
                    }
                });
            } else {
                data.push({
                    name: item.tahun.toString(),
                    realisasi: (item.total_realisasi / item.pagu) * 100,
                    type: 'Historical'
                });
            }
        });

        if (prediction.predictions) {
            prediction.predictions.forEach((pred: any, i: number) => {
                const percentage = pred.cumulative_percentage || pred.percentage || 0;
                let pName = "";
                if (jenisLaporan === "1") {
                    const startMonth = 10;
                    const month = ((startMonth + i - 1) % 12) + 1;
                    const year = currentYear + Math.floor((startMonth + i - 1) / 12);
                    pName = `${year}-${month.toString().padStart(2, '0')}`;
                } else {
                    pName = (currentYear + i + 1).toString();
                }
                data.push({ name: pName, prediksi: percentage, type: 'Prediction' });
            });
        }
        setChartData(data);
    };

    const handleRefresh = () => {
        Swal.fire({
            title: "Refresh Halaman?",
            text: "Data yang belum disimpan akan hilang.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya",
            cancelButtonText: "Batal"
        }).then((result) => {
            if (result.isConfirmed) window.location.reload();
        });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);
    };

    // --- Render ---

    return (
        <div className="space-y-6">
            {/* Page Header - Matched with Belanja Page style */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Prognosis
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Sistem Prediksi Realisasi Anggaran Berbasis Machine Learning dengan parameter yang dapat disesuaikan
                    </p>
                </div>

                {/* Header Action area */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="flex items-center gap-2 bg-white dark:bg-card hover:bg-zinc-200"
                    >
                        <Settings className="w-4 h-4" />
                        Pengaturan
                    </Button>

                    {/* Keyboard shortcut hint */}
                    <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        <Keyboard className="w-3 h-3" />
                        <span>Ctrl+P</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">

                {/* 1. Filters Card */}
                <PrognosisFilters
                    jenisLaporan={jenisLaporan}
                    setJenisLaporan={setJenisLaporan}
                    selectedKddept={selectedKddept}
                    setSelectedKddept={setSelectedKddept}
                    selectedJenisBelanja={selectedJenisBelanja}
                    setSelectedJenisBelanja={setSelectedJenisBelanja}
                    selectedBaseline={selectedBaseline}
                    setSelectedBaseline={setSelectedBaseline}
                    selectedMetode={selectedMetode}
                    setSelectedMetode={setSelectedMetode}
                    selectedTargetProyeksi={selectedTargetProyeksi}
                    setSelectedTargetProyeksi={setSelectedTargetProyeksi}
                    kementerianOptions={kementerianOptions}
                    jenisBelanjaOptions={jenisBelanjaOptions}
                    baselineOptions={baselineOptions}
                />

                {/* 2. Action Bar */}
                <PrognosisActionBar
                    loadingResults={loadingResults}
                    handleTayang={handleTayang}
                    handleRefresh={handleRefresh}
                    setShowModalSQL={setShowModalSQL}
                    role={role}
                />

                {/* 3. Results Area */}
                {!showResults && !loadingResults && (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/40 rounded-3xl border-2 border-dashed space-y-4">
                        <div className="p-4 bg-muted/50 rounded-full">
                            <Info className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-lg">Belum Ada Data Ditampilkan</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">Klik tombol <strong>Tayang</strong> setelah mengatur parameter filter untuk memproses data prognosis.</p>
                        </div>
                    </div>
                )}

                {showResults && (
                    <div className="space-y-6">
                        <PrognosisChart
                            chartData={chartData}
                            selectedMetode={selectedMetode}
                            selectedBaseline={selectedBaseline}
                            selectedZoomYear={selectedZoomYear}
                            currentYear={currentYear}
                        />

                        <PrognosisAIAnalysis
                            selectedMetode={selectedMetode}
                            predictionData={predictionData}
                        />

                        <PrognosisTableDetail
                            predictionData={predictionData}
                            tableData={tableData}
                            jenisLaporan={jenisLaporan}
                            currentYear={currentYear}
                            formatCurrency={formatCurrency}
                        />
                    </div>
                )}
            </div>

            <PrognosisSQLModal
                showModalSQL={showModalSQL}
                setShowModalSQL={setShowModalSQL}
                sqlQuery={sqlQuery}
            />
        </div>
    );
}

export const dynamic = 'force-dynamic';
