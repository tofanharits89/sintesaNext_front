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
  const tahunProyeksi = 2026;

  // --- State Management ---

  // Filter States
  const [jenisLaporan, setJenisLaporan] = useState("1");
  const [selectedKddept, setSelectedKddept] = useState("");
  const [selectedJenisBelanja, setSelectedJenisBelanja] = useState("all");
  const [selectedBaseline, setSelectedBaseline] = useState("");
  const [selectedMetode, setSelectedMetode] = useState("xgboost");
  const [selectedTargetProyeksi, setSelectedTargetProyeksi] = useState("12");

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
  const [pagu2026, setPagu2026] = useState<number>(0);
  const [dynamicStartMonth, setDynamicStartMonth] = useState<number>(1);
  const [dynamicStartYear, setDynamicStartYear] = useState<number>(currentYear);

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
        // Tahun dimulai dari 2009 hingga tahun berjalan
        for (let y = 2009; y <= currentYear; y++) {
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

  // Fetch jenis belanja ketika kementerian berubah
  useEffect(() => {
    const fetchJenisBelanjaByKddept = async () => {
      if (selectedKddept) {
        try {
          const belanjas = await apiClient.get(
            `/prognosis/getJenisBelanja?kddept=${selectedKddept}`
          );
          setJenisBelanjaOptions(belanjas || []);
          // Reset pilihan jenis belanja ke "all" ketika kementerian berubah
          setSelectedJenisBelanja("all");
        } catch (error) {
          console.error("Failed to fetch jenis belanja for kddept", error);
        }
      }
    };
    fetchJenisBelanjaByKddept();
  }, [selectedKddept]);

  // Ambil pagu tahun proyeksi (2026) untuk pengali nominal proyeksi
  useEffect(() => {
    const fetchPagu2026 = async () => {
      if (!selectedKddept) return;
      try {
        const params = new URLSearchParams({
          kddept: selectedKddept,
          tahun: String(tahunProyeksi),
          jenbel: selectedJenisBelanja || "all",
        });
        const res = await apiClient.get(
          `/prognosis/getPagu?${params.toString()}`
        );
        const pagu = Number((res as any)?.pagu ?? 0);
        setPagu2026(Number.isFinite(pagu) ? pagu : 0);
      } catch (error) {
        console.error("Failed to fetch pagu 2026", error);
        setPagu2026(0);
      }
    };
    fetchPagu2026();
  }, [selectedKddept, selectedJenisBelanja, tahunProyeksi]);

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
      // console.log("[handleTayang] Historical data fetched:", historical);

      if (historical && historical.length > 0) {
        await fetchPredictionData(historical);
        setShowResults(true);
      } else {
        console.warn("[handleTayang] No historical data returned");
        Swal.fire({
          icon: "warning",
          title: "Data Historis Kosong",
          text: "Tidak ada data historis untuk parameter yang dipilih",
        });
      }
    } catch (error) {
      console.error("[handleTayang] Error:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Gagal memproses data prognosis";
      Swal.fire({
        icon: "error",
        title: "Kesalahan",
        text: errorMsg,
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

      const actualJenbel =
        selectedJenisBelanja === "all" ? "" : selectedJenisBelanja;
      query = `SELECT kddept, nmdept, '${
        actualJenbel || "Semua Jenis Belanja"
      }' as jenbel, tahun, ROUND(SUM(pagu)/${pembulatan}, 0) as pagu ${realbulananakumulatif} FROM prognosis.mapping_ba_long WHERE kddept = '${selectedKddept}' AND tahun >= '${selectedBaseline}' AND tahun <= '${currentYear}'`;
      if (actualJenbel) query += ` AND jenbel = '${actualJenbel}'`;
      query += ` GROUP BY kddept, nmdept, tahun ORDER BY tahun`;
    } else {
      const actualJenbel =
        selectedJenisBelanja === "all" ? "" : selectedJenisBelanja;
      query = `SELECT kddept, nmdept, '${
        actualJenbel || "Semua Jenis Belanja"
      }' as jenbel, tahun, ROUND(SUM(pagu)/${pembulatan}, 0) as pagu, ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9 + real10 + real11 + real12)/${pembulatan}, 0) as total_realisasi FROM prognosis.mapping_ba_long WHERE kddept = '${selectedKddept}' AND tahun >= '${selectedBaseline}' AND tahun <= '${currentYear}'`;
      if (actualJenbel) query += ` AND jenbel = '${actualJenbel}'`;
      query += ` GROUP BY kddept, nmdept, tahun ORDER BY tahun`;
    }

    setSqlQuery(query);
    try {
      const response = await apiClient.post(`/prognosis/getDataKinerja`, {
        queryParams: query,
      });
      // console.log("[fetchHistoricalData] Raw Response:", response);

      // Handle different response formats
      let data = response;
      if (response && typeof response === "object") {
        // If response is wrapped in a data property, unwrap it
        if ("data" in response && Array.isArray(response.data)) {
          data = response.data;
        }
        // If response is directly an array, use it
        else if (Array.isArray(response)) {
          data = response;
        }
      }

      // console.log("[fetchHistoricalData] Processed Data:", data);

      if (!Array.isArray(data)) {
        console.error("[fetchHistoricalData] Response is not an array:", data);
        throw new Error("Invalid response format from server");
      }

      setTableData(data);
      return data;
    } catch (error) {
      console.error("[fetchHistoricalData] Error:", error);
      throw error;
    }
  };

  const fetchPredictionData = async (historical: any[]) => {
    let mlData: any[] = [];
    if (jenisLaporan === "1") {
      historical.forEach((item) => {
        const months = [
          "JAN",
          "FEB",
          "MAR",
          "APR",
          "MEI",
          "JUN",
          "JUL",
          "AGS",
          "SEP",
          "OKT",
          "NOV",
          "DES",
        ];
        months.forEach((month, index) => {
          // Check for both uppercase (SQL AS 'JAN') and lowercase (Postgres default) keys
          const val = item[month] ?? item[month.toLowerCase()];

          // Keep 0 values; dropping them can produce empty payloads and 400 from backend
          if (val !== null && val !== undefined) {
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

    // Defensive: backend returns 400 if data is empty
    if (!mlData || mlData.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Data Tidak Tersedia",
        text: "Data realisasi untuk parameter yang dipilih masih kosong. Silakan ubah baseline / kementerian / jenis belanja, lalu coba lagi.",
      });
      return;
    }

    // Proyeksi untuk tahun berjalan (2026) dari Januari sampai Desember
    let predictionStartMonth = 1;
    let predictionStartYear = currentYear;

    if (jenisLaporan === "1") {
      // Untuk laporan bulanan, proyeksi dimulai dari Januari tahun berjalan
      predictionStartMonth = 1;
      predictionStartYear = currentYear;
    } else {
      // Untuk laporan tahunan, proyeksi dimulai dari tahun berjalan
      predictionStartMonth = 1;
      predictionStartYear = currentYear;
    }

    // Simpan ke state untuk digunakan di chart
    setDynamicStartMonth(predictionStartMonth);
    setDynamicStartYear(predictionStartYear);

    const predictionRequest = {
      method: selectedMetode,
      data: mlData,
      parameters: {
        targetPeriods: parseInt(selectedTargetProyeksi),
        baseline_year: parseInt(selectedBaseline),
        training_end_year: currentYear,
        prediction_start_year: predictionStartYear,
        prediction_start_month: predictionStartMonth,
        kddept: selectedKddept,
        jenis_belanja:
          selectedJenisBelanja === "all" ? "" : selectedJenisBelanja,
      },
    };

    try {
      // console.log(
      //   "[fetchPredictionData] Sending prediction request:",
      //   predictionRequest
      // );
      const res = await apiClient.post("/prognosis/predict", predictionRequest);
      // console.log("[fetchPredictionData] Raw Response:", res);

      // Handle wrapped response
      let prediction = res;
      if (res && typeof res === "object") {
        if ("prediction" in res) {
          prediction = res.prediction;
        }
      }

      if (prediction) {
        setPredictionData(res);
        prepareChartData(
          historical,
          prediction,
          predictionStartMonth,
          predictionStartYear
        );
      } else {
        console.warn("[fetchPredictionData] No prediction data in response");
      }
    } catch (error) {
      console.error("[fetchPredictionData] Error:", error);
      throw error;
    }
  };

  const prepareChartData = (
    historical: any[],
    prediction: any,
    startMonth: number,
    startYear: number
  ) => {
    const data: any[] = [];
    historical.forEach((item) => {
      if (jenisLaporan === "1") {
        const months = [
          "JAN",
          "FEB",
          "MAR",
          "APR",
          "MEI",
          "JUN",
          "JUL",
          "AGS",
          "SEP",
          "OKT",
          "NOV",
          "DES",
        ];
        months.forEach((m, i) => {
          const val = item[m];
          if (val) {
            data.push({
              name: `${item.tahun}-${(i + 1).toString().padStart(2, "0")}`,
              realisasi: (val / item.pagu) * 100,
              type: "Historical",
            });
          }
        });
      } else {
        data.push({
          name: item.tahun.toString(),
          realisasi: (item.total_realisasi / item.pagu) * 100,
          type: "Historical",
        });
      }
    });

    if (prediction.predictions) {
      prediction.predictions.forEach((pred: any, i: number) => {
        const percentage = Number(
          pred?.cumulative_percentage ?? pred?.percentage ?? 0
        );
        let pName = "";
        if (jenisLaporan === "1") {
          // Gunakan parameter startMonth langsung, bukan state
          const monthIndex = (startMonth - 1 + i) % 12; // 0-11
          const month = monthIndex + 1; // 1-12
          const year = startYear + Math.floor((startMonth - 1 + i) / 12);
          pName = `${year}-${month.toString().padStart(2, "0")}`;
        } else {
          // Untuk laporan tahunan, mulai dari tahun berikutnya
          pName = (startYear + i).toString();
        }
        data.push({ name: pName, prediksi: percentage, type: "Prediction" });
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
      cancelButtonText: "Batal",
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
          <h1 className="text-2xl font-semibold tracking-tight">Prognosis</h1>
          <p className="text-sm text-muted-foreground">
            Sistem Prediksi Realisasi Anggaran Berbasis Machine Learning dengan
            parameter yang dapat disesuaikan
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
              <h3 className="font-semibold text-lg">
                Belum Ada Data Ditampilkan
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Klik tombol <strong>Tayang</strong> setelah mengatur parameter
                filter untuk memproses data prognosis.
              </p>
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
              pagu2026={pagu2026}
              jenisLaporan={jenisLaporan}
              currentYear={currentYear}
              startMonth={1}
              startYear={currentYear}
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

export const dynamic = "force-dynamic";
