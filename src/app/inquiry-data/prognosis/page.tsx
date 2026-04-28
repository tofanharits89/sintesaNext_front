"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { levelOptions } from "@/components/prognosis/shared";

export default function PrognosisPage() {
  const { user } = useAuth();
  const role = user?.role;
  const kdkanwil = user?.kdkanwil;
  const kdkppn = user?.kdkppn;
  const currentYear = new Date().getFullYear();
  const tahunProyeksi = currentYear;

  // --- Role helpers ---
  const isKanwilKppn = role === "kanwil_djpb" || role === "kppn";

  // --- State Management ---

  // Level
  const defaultLevel = isKanwilKppn ? "3" : "1";
  const [level, setLevel] = useState(defaultLevel);

  // Filter States
  const [jenisLaporan, setJenisLaporan] = useState("1");
  const [selectedKddept, setSelectedKddept] = useState(""); // untuk level 1 & 2: ID utama; level 3: kdsatker
  const [selectedKementerian, setSelectedKementerian] = useState(""); // level 2 & 3: kddept
  const [selectedUnit, setSelectedUnit] = useState(""); // level 3: kdunit
  const [selectedJenisBelanja, setSelectedJenisBelanja] = useState("");
  const [selectedBaseline, setSelectedBaseline] = useState("");
  const [selectedMetode, setSelectedMetode] = useState("arima");
  const [selectedTargetProyeksi, setSelectedTargetProyeksi] = useState("12");

  // Options States
  const [kementerianOptions, setKementerianOptions] = useState<any[]>([]);
  const [kementerianLevel3Options, setKementerianLevel3Options] = useState<
    any[]
  >([]);
  const [jenisBelanjaOptions, setJenisBelanjaOptions] = useState<any[]>([
    { label: "Semua Jenis Belanja", value: "" },
  ]);
  const [baselineOptions, setBaselineOptions] = useState<any[]>([]);
  const [unitOptions, setUnitOptions] = useState<any[]>([]);
  const [satkerOptions, setSatkerOptions] = useState<any[]>([]);
  const [targetOptions, setTargetOptions] = useState<
    { label: number; value: number }[]
  >([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [loadingJenisBelanja, setLoadingJenisBelanja] = useState(false);
  const [loadingBaseline, setLoadingBaseline] = useState(false);
  const [loadingSatker, setLoadingSatker] = useState(false);
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

  // --- Computed ---

  // Filter level options berdasarkan role
  const filteredLevelOptions = useMemo(() => {
    if (isKanwilKppn) return levelOptions.filter((o) => o.value === "3");
    return levelOptions;
  }, [isKanwilKppn]);

  // --- Effects ---

  // Target options berdasarkan jenis laporan
  useEffect(() => {
    if (jenisLaporan === "1") {
      setTargetOptions(
        Array.from({ length: 12 }, (_, i) => ({ label: i + 1, value: i + 1 })),
      );
    } else {
      setTargetOptions(
        Array.from({ length: 3 }, (_, i) => ({ label: i + 1, value: i + 1 })),
      );
    }
  }, [jenisLaporan]);

  // Set default level untuk kanwil/kppn
  useEffect(() => {
    if (isKanwilKppn && level !== "3") setLevel("3");
  }, [isKanwilKppn]);

  // Reset state ketika level berubah
  useEffect(() => {
    setSelectedKddept("");
    setSelectedKementerian("");
    setSelectedUnit("");
    setSelectedJenisBelanja("");
    setSelectedBaseline("");
    setUnitOptions([]);
    setSatkerOptions([]);
    setTableData([]);
    setChartData([]);
    setPredictionData(null);
    setShowResults(false);

    if (level === "1") {
      fetchKementerianData();
    } else if (level === "2") {
      fetchKementerianData();
    } else if (level === "3") {
      fetchKementerianForLevel3();
    }
  }, [level]);

  // Fetch pagu tahun proyeksi
  useEffect(() => {
    const fetchPagu = async () => {
      const kddeptForPagu =
        level === "3" ? selectedKementerian : selectedKddept;
      if (!kddeptForPagu) return;
      try {
        const params = new URLSearchParams({
          kddept: kddeptForPagu,
          tahun: String(tahunProyeksi),
          jenbel: selectedJenisBelanja || "all",
        });
        const res = await apiClient.get(
          `/prognosis/getPagu?${params.toString()}`,
        );
        const pagu = Number((res as any)?.pagu ?? 0);
        setPagu2026(Number.isFinite(pagu) ? pagu : 0);
      } catch {
        setPagu2026(0);
      }
    };
    fetchPagu();
  }, [
    selectedKddept,
    selectedKementerian,
    selectedJenisBelanja,
    tahunProyeksi,
    level,
  ]);

  // Fetch jenis belanja ketika kementerian berubah (Level 1 & 2)
  useEffect(() => {
    if (level === "3") return; // Level 3 ditangani via onKementerianChange / onUnitChange / onSatkerChange
    // Level 1: kddept key = selectedKddept (kementerian code)
    // Level 2: kddept key = selectedKementerian (kementerian code), selectedKddept holds unit code
    const kddeptKey = level === "2" ? selectedKementerian : selectedKddept;
    if (kddeptKey) {
      fetchJenisBelanjaData(kddeptKey);
      fetchBaselineData(kddeptKey);
      setSelectedJenisBelanja("");
    } else {
      setJenisBelanjaOptions([{ label: "Semua Jenis Belanja", value: "" }]);
      setBaselineOptions([]);
    }
  }, [selectedKddept, selectedKementerian, level]);

  // --- Data Fetch Functions ---

  const fetchKementerianData = async () => {
    try {
      setLoading(true);
      const depts = await apiClient.get("/prognosis/getKementerian");
      const opts = Array.isArray(depts) ? depts : [];
      setKementerianOptions(opts);
    } catch (e) {
      console.error("Failed to fetch kementerian", e);
      setKementerianOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchKementerianForLevel3 = async () => {
    try {
      setLoading(true);
      const pembulatan = 1;
      let query = "";
      if (isKanwilKppn) {
        let roleFilter = "";
        if (role === "kppn") {
          if (kdkanwil) roleFilter += ` AND h.kdkanwil = '${kdkanwil}'`;
          if (kdkppn) roleFilter += ` AND h.kdkppn = '${kdkppn}'`;
        } else if (role === "kanwil_djpb") {
          if (kdkanwil) roleFilter += ` AND h.kdkanwil = '${kdkanwil}'`;
        }
        query = `SELECT h.kddept, MAX(m.nmdept) AS nmdept FROM prognosis.histori_satker_bulanan h LEFT JOIN prognosis.mapping_ba_long m ON h.kddept = m.kddept WHERE h.kddept IS NOT NULL${roleFilter} GROUP BY h.kddept ORDER BY h.kddept`;
      } else {
        query = `SELECT kddept, MAX(nmdept) AS nmdept FROM prognosis.mapping_ba_long WHERE kddept IS NOT NULL AND nmdept IS NOT NULL AND TRIM(nmdept) != '' GROUP BY kddept ORDER BY kddept`;
      }
      const response = await apiClient.post("/prognosis/getDataKinerja", {
        queryParams: query,
      });
      const data = Array.isArray(response)
        ? response
        : ((response as any)?.data ?? []);
      setKementerianLevel3Options(
        data.map((item: any) => ({
          label: `${item.kddept} - ${item.nmdept || ""}`,
          value: item.kddept,
        })),
      );
    } catch (e) {
      console.error("Failed to fetch kementerian level 3", e);
      setKementerianLevel3Options([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnitData = async (kddept: string) => {
    if (!kddept) {
      setUnitOptions([]);
      return;
    }
    try {
      setLoading(true);
      const res = await apiClient.get(`/prognosis/uniteselon?kddept=${kddept}`);
      const data = Array.isArray(res) ? res : ((res as any)?.data ?? []);
      setUnitOptions(
        data.map((item: any) => ({
          label: `${item.kdunit} - ${item.nmunit || ""}`,
          value: item.kdunit,
        })),
      );
    } catch {
      setUnitOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnitForLevel3 = async (kddept: string) => {
    if (!kddept) {
      setUnitOptions([]);
      return;
    }
    try {
      setLoading(true);
      let roleFilter = "";
      if (role === "kppn") {
        if (kdkanwil) roleFilter += ` AND a.kdkanwil = '${kdkanwil}'`;
        if (kdkppn) roleFilter += ` AND a.kdkppn = '${kdkppn}'`;
      } else if (role === "kanwil_djpb") {
        if (kdkanwil) roleFilter += ` AND a.kdkanwil = '${kdkanwil}'`;
      }
      const query = `SELECT a.kdunit, MAX(b.nmunit) as nmunit FROM prognosis.histori_satker_bulanan a LEFT JOIN dbref.t_unit_2025 b ON a.kddept = b.kddept AND a.kdunit = b.kdunit WHERE a.kddept = '${kddept}' AND a.kdunit IS NOT NULL${roleFilter} GROUP BY a.kdunit ORDER BY a.kdunit`;
      const response = await apiClient.post("/prognosis/getDataKinerja", {
        queryParams: query,
      });
      const data = Array.isArray(response)
        ? response
        : ((response as any)?.data ?? []);
      setUnitOptions(
        data.map((item: any) => ({
          label: `${item.kdunit} - ${item.nmunit || ""}`,
          value: item.kdunit,
        })),
      );
    } catch {
      setUnitOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSatkerData = async (kddept: string, kdunit: string) => {
    if (!kddept || !kdunit) {
      setSatkerOptions([]);
      return;
    }
    try {
      setLoadingSatker(true);
      let queryParams = `kddept=${kddept}&kdunit=${kdunit}`;
      if (role === "kppn") {
        if (kdkanwil) queryParams += `&kdkanwil=${kdkanwil}`;
        if (kdkppn) queryParams += `&kdkppn=${kdkppn}`;
      } else if (role === "kanwil_djpb") {
        if (kdkanwil) queryParams += `&kdkanwil=${kdkanwil}`;
      }
      const res = await apiClient.get(`/prognosis/satker?${queryParams}`);
      const data = Array.isArray(res) ? res : ((res as any)?.data ?? []);
      setSatkerOptions(
        data.map((item: any) => ({
          label: `${item.kdsatker} - ${item.nmsatker || ""}`,
          value: item.kdsatker,
        })),
      );
    } catch {
      setSatkerOptions([]);
    } finally {
      setLoadingSatker(false);
    }
  };

  const fetchJenisBelanjaData = async (kddept: string) => {
    try {
      setLoadingJenisBelanja(true);
      const belanjas = await apiClient.get(
        `/prognosis/getJenisBelanja?kddept=${kddept}`,
      );
      const data = Array.isArray(belanjas) ? belanjas : [];
      setJenisBelanjaOptions([
        { label: "Semua Jenis Belanja", value: "" },
        ...data,
      ]);
    } catch {
      setJenisBelanjaOptions([{ label: "Semua Jenis Belanja", value: "" }]);
    } finally {
      setLoadingJenisBelanja(false);
    }
  };

  const fetchJenisBelanjaForLevel3 = async (
    kddept: string,
    kdunit: string | null,
    kdsatker: string | null,
  ) => {
    try {
      setLoadingJenisBelanja(true);
      const tableName = "prognosis.histori_satker_bulanan";
      let whereClause = `kddept = '${kddept}'`;
      if (kdunit) whereClause += ` AND kdunit = '${kdunit}'`;
      if (kdsatker) whereClause += ` AND kdsatker = '${kdsatker}'`;
      if (role === "kppn") {
        if (kdkanwil) whereClause += ` AND kdkanwil = '${kdkanwil}'`;
        if (kdkppn) whereClause += ` AND kdkppn = '${kdkppn}'`;
      } else if (role === "kanwil_djpb") {
        if (kdkanwil) whereClause += ` AND kdkanwil = '${kdkanwil}'`;
      }
      const jbQuery = `SELECT DISTINCT jenbel FROM ${tableName} WHERE jenbel IS NOT NULL AND ${whereClause} ORDER BY jenbel`;
      const response = await apiClient.post("/prognosis/getDataKinerja", {
        queryParams: jbQuery,
      });
      const data = Array.isArray(response)
        ? response
        : ((response as any)?.data ?? []);
      setJenisBelanjaOptions([
        { label: "Semua Jenis Belanja", value: "" },
        ...data.map((item: any) => ({
          label: item.jenbel,
          value: item.jenbel,
        })),
      ]);

      // Fetch baseline juga
      await fetchBaselineForLevel3(kddept, kdunit, kdsatker, whereClause);
    } catch {
      setJenisBelanjaOptions([{ label: "Semua Jenis Belanja", value: "" }]);
    } finally {
      setLoadingJenisBelanja(false);
    }
  };

  const fetchBaselineData = async (kddept: string) => {
    try {
      setLoadingBaseline(true);
      const baselines: { label: string; value: number }[] = [];
      for (let y = 2009; y <= currentYear; y++) {
        baselines.push({ label: y.toString(), value: y });
      }
      setBaselineOptions(baselines);
      setSelectedBaseline((currentYear - 3).toString());
    } catch {
      setBaselineOptions([]);
    } finally {
      setLoadingBaseline(false);
    }
  };

  const fetchBaselineForLevel3 = async (
    kddept: string,
    kdunit: string | null,
    kdsatker: string | null,
    whereClause: string,
  ) => {
    try {
      setLoadingBaseline(true);
      if (kdsatker) {
        // Satker spesifik: query DB
        const blQuery = `SELECT DISTINCT tahun FROM prognosis.histori_satker_bulanan WHERE ${whereClause} ORDER BY tahun`;
        const blResponse = await apiClient.post("/prognosis/getDataKinerja", {
          queryParams: blQuery,
        });
        const blData = Array.isArray(blResponse)
          ? blResponse
          : ((blResponse as any)?.data ?? []);
        setBaselineOptions(
          blData.map((item: any) => ({
            label: item.tahun.toString(),
            value: item.tahun,
          })),
        );
        if (blData.length > 0) setSelectedBaseline(blData[0].tahun.toString());
      } else {
        // Aggregate: generate 2017 s/d sekarang
        const years: { label: string; value: number }[] = [];
        for (let y = 2017; y <= currentYear; y++)
          years.push({ label: y.toString(), value: y });
        setBaselineOptions(years);
        setSelectedBaseline((currentYear - 3).toString());
      }
    } catch {
      setBaselineOptions([]);
    } finally {
      setLoadingBaseline(false);
    }
  };

  // --- Event Handlers (level-aware kementerian/unit/satker changes) ---

  const handleKementerianChange = (val: string) => {
    if (level === "1") {
      setSelectedKddept(val);
    } else if (level === "2") {
      setSelectedKementerian(val);
      setSelectedKddept("");
      setUnitOptions([]);
      if (val) fetchUnitData(val);
    } else if (level === "3") {
      setSelectedKementerian(val);
      setSelectedUnit("");
      setSelectedKddept("");
      setUnitOptions([]);
      setSatkerOptions([]);
      setSelectedJenisBelanja("");
      setSelectedBaseline("");
      if (val) {
        fetchUnitForLevel3(val);
        fetchJenisBelanjaForLevel3(val, null, null);
      }
    }
  };

  const handleUnitChange = (val: string) => {
    if (level === "2") {
      setSelectedKddept(val);
    } else if (level === "3") {
      setSelectedUnit(val);
      setSelectedKddept("");
      setSatkerOptions([]);
      setSelectedJenisBelanja("");
      setSelectedBaseline("");
      if (val && selectedKementerian) {
        fetchSatkerData(selectedKementerian, val);
        fetchJenisBelanjaForLevel3(selectedKementerian, val, null);
      } else if (selectedKementerian) {
        fetchJenisBelanjaForLevel3(selectedKementerian, null, null);
      }
    }
  };

  const handleSatkerChange = (val: string) => {
    setSelectedKddept(val);
    setSelectedJenisBelanja("");
    setSelectedBaseline("");
    if (selectedKementerian) {
      fetchJenisBelanjaForLevel3(
        selectedKementerian,
        selectedUnit || null,
        val || null,
      );
    }
  };

  // --- Handlers ---

  const handleTayang = async () => {
    // Validasi
    if (level === "3") {
      if (!selectedKementerian) {
        Swal.fire({
          icon: "warning",
          title: "Pilih Kementerian",
          text: "Silakan pilih Kementerian/Lembaga terlebih dahulu",
        });
        return;
      }
    } else if (!selectedKddept) {
      Swal.fire({
        icon: "warning",
        title: "Pilih Kementerian",
        text: "Silakan pilih Kementerian/Lembaga terlebih dahulu",
      });
      return;
    }
    if (!selectedBaseline) {
      Swal.fire({
        icon: "warning",
        title: "Pilih Tahun Baseline",
        text: "Silakan pilih Tahun Baseline terlebih dahulu",
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
      } else {
        Swal.fire({
          icon: "warning",
          title: "Data Historis Kosong",
          text: "Tidak ada data historis untuk parameter yang dipilih",
        });
      }
    } catch (error) {
      console.error("[handleTayang] Error:", error);
      Swal.fire({
        icon: "error",
        title: "Kesalahan",
        text:
          error instanceof Error
            ? error.message
            : "Gagal memproses data prognosis",
      });
    } finally {
      setLoadingResults(false);
    }
  };

  const fetchHistoricalData = async () => {
    const pembulatan = 1;
    let query = "";
    const startYear =
      (level === "2" || level === "3") && parseInt(selectedBaseline) < 2017
        ? 2017
        : parseInt(selectedBaseline);
    // tahun column is character varying — cast to integer for numeric comparison
    const tahunFilter = `tahun::integer >= ${startYear} AND tahun::integer <= ${currentYear}`;

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
        , ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9 + real10 + real11 + real12)/${pembulatan}, 0) AS DES`;

      if (level === "3") {
        const tableName = "prognosis.histori_satker_bulanan";
        let roleFilter = "";
        if (role === "kppn") {
          if (kdkanwil) roleFilter += ` AND kdkanwil = '${kdkanwil}'`;
          if (kdkppn) roleFilter += ` AND kdkppn = '${kdkppn}'`;
        } else if (role === "kanwil_djpb") {
          if (kdkanwil) roleFilter += ` AND kdkanwil = '${kdkanwil}'`;
        }

        if (selectedKddept) {
          // Case 3: satker spesifik
          query = `SELECT kdsatker as kddept, nmsatker as nmdept, '${selectedJenisBelanja || "Semua Jenis Belanja"}' as jenbel, tahun, ROUND(SUM(pagu)/${pembulatan}, 0) as pagu${realbulananakumulatif} FROM ${tableName} WHERE kdsatker = '${selectedKddept}' AND ${tahunFilter}`;
          if (selectedKementerian)
            query += ` AND kddept = '${selectedKementerian}'`;
          if (selectedUnit) query += ` AND kdunit = '${selectedUnit}'`;
          if (selectedJenisBelanja)
            query += ` AND jenbel = '${selectedJenisBelanja}'`;
          query += roleFilter;
          query += ` GROUP BY kdsatker, nmsatker, tahun ORDER BY tahun`;
        } else if (selectedUnit) {
          // Case 2: unit — histori_satker_bulanan has no nmunit, use label from state
          const rawUnitLabelBul =
            unitOptions.find((o: any) => o.value === selectedUnit)?.label ||
            selectedUnit;
          const unitLabelBul = (
            rawUnitLabelBul.includes(" - ")
              ? rawUnitLabelBul.split(" - ").slice(1).join(" - ")
              : rawUnitLabelBul
          ).replace(/'/g, "''");
          query = `SELECT '${selectedUnit}' as kddept, '${unitLabelBul}' as nmdept, '${selectedJenisBelanja || "Semua Jenis Belanja"}' as jenbel, tahun, ROUND(SUM(pagu)/${pembulatan}, 0) as pagu${realbulananakumulatif} FROM ${tableName} WHERE kddept = '${selectedKementerian}' AND kdunit = '${selectedUnit}' AND ${tahunFilter}`;
          if (selectedJenisBelanja)
            query += ` AND jenbel = '${selectedJenisBelanja}'`;
          query += roleFilter;
          query += ` GROUP BY tahun ORDER BY tahun`;
        } else {
          // Case 1: kementerian aggregate
          query = `SELECT kddept, '${selectedJenisBelanja || "Semua Jenis Belanja"}' as jenbel, tahun, ROUND(SUM(pagu)/${pembulatan}, 0) as pagu${realbulananakumulatif} FROM ${tableName} WHERE kddept = '${selectedKementerian}' AND ${tahunFilter}`;
          if (selectedJenisBelanja)
            query += ` AND jenbel = '${selectedJenisBelanja}'`;
          query += roleFilter;
          query += ` GROUP BY kddept, tahun ORDER BY tahun`;
        }
      } else {
        // Level 1 & 2: histori_satker_bulanan has real1-real12, map/unit tables don't
        if (level === "2") {
          const rawLabel =
            unitOptions.find((o: any) => o.value === selectedKddept)?.label ||
            selectedKddept;
          const unitLabel = (
            rawLabel.includes(" - ")
              ? rawLabel.split(" - ").slice(1).join(" - ")
              : rawLabel
          ).replace(/'/g, "''");
          query = `SELECT '${selectedKddept}' as kddept, '${unitLabel}' as nmdept, '${selectedJenisBelanja || "Semua Jenis Belanja"}' as jenbel, tahun, ROUND(SUM(pagu)/${pembulatan}, 0) as pagu${realbulananakumulatif} FROM prognosis.histori_satker_bulanan WHERE kddept = '${selectedKementerian}' AND kdunit = '${selectedKddept}' AND ${tahunFilter}`;
          if (selectedJenisBelanja)
            query += ` AND jenbel = '${selectedJenisBelanja}'`;
          query += ` GROUP BY tahun ORDER BY tahun`;
        } else {
          // Level 1
          const kemLabel = (
            kementerianOptions.find((o: any) => o.value === selectedKddept)
              ?.label || selectedKddept
          ).replace(/'/g, "''");
          query = `SELECT '${selectedKddept}' as kddept, '${kemLabel}' as nmdept, '${selectedJenisBelanja || "Semua Jenis Belanja"}' as jenbel, tahun, ROUND(SUM(pagu)/${pembulatan}, 0) as pagu${realbulananakumulatif} FROM prognosis.histori_satker_bulanan WHERE kddept = '${selectedKddept}' AND ${tahunFilter}`;
          if (selectedJenisBelanja)
            query += ` AND jenbel = '${selectedJenisBelanja}'`;
          query += ` GROUP BY tahun ORDER BY tahun`;
        }
      }
    } else {
      // Tahunan
      const realTahunan = `ROUND(SUM(real1 + real2 + real3 + real4 + real5 + real6 + real7 + real8 + real9 + real10 + real11 + real12)/${pembulatan}, 0) as total_realisasi`;

      if (level === "3") {
        const tableName = "prognosis.histori_satker_bulanan";
        let roleFilter = "";
        if (role === "kppn") {
          if (kdkanwil) roleFilter += ` AND kdkanwil = '${kdkanwil}'`;
          if (kdkppn) roleFilter += ` AND kdkppn = '${kdkppn}'`;
        } else if (role === "kanwil_djpb") {
          if (kdkanwil) roleFilter += ` AND kdkanwil = '${kdkanwil}'`;
        }
        if (selectedKddept) {
          query = `SELECT kdsatker as kddept, nmsatker as nmdept, '${selectedJenisBelanja || "Semua Jenis Belanja"}' as jenbel, tahun, ROUND(SUM(pagu)/${pembulatan}, 0) as pagu, ${realTahunan} FROM ${tableName} WHERE kdsatker = '${selectedKddept}' AND ${tahunFilter}`;
          if (selectedKementerian)
            query += ` AND kddept = '${selectedKementerian}'`;
          if (selectedUnit) query += ` AND kdunit = '${selectedUnit}'`;
          if (selectedJenisBelanja)
            query += ` AND jenbel = '${selectedJenisBelanja}'`;
          query += roleFilter;
          query += ` GROUP BY kdsatker, nmsatker, tahun ORDER BY tahun`;
        } else if (selectedUnit) {
          // histori_satker_bulanan has no nmunit, use label from state
          const rawUnitLabelTah =
            unitOptions.find((o: any) => o.value === selectedUnit)?.label ||
            selectedUnit;
          const unitLabelTah = (
            rawUnitLabelTah.includes(" - ")
              ? rawUnitLabelTah.split(" - ").slice(1).join(" - ")
              : rawUnitLabelTah
          ).replace(/'/g, "''");
          query = `SELECT '${selectedUnit}' as kddept, '${unitLabelTah}' as nmdept, '${selectedJenisBelanja || "Semua Jenis Belanja"}' as jenbel, tahun, ROUND(SUM(pagu)/${pembulatan}, 0) as pagu, ${realTahunan} FROM ${tableName} WHERE kddept = '${selectedKementerian}' AND kdunit = '${selectedUnit}' AND ${tahunFilter}`;
          if (selectedJenisBelanja)
            query += ` AND jenbel = '${selectedJenisBelanja}'`;
          query += roleFilter;
          query += ` GROUP BY tahun ORDER BY tahun`;
        } else {
          query = `SELECT kddept, '${selectedJenisBelanja || "Semua Jenis Belanja"}' as jenbel, tahun, ROUND(SUM(pagu)/${pembulatan}, 0) as pagu, ${realTahunan} FROM ${tableName} WHERE kddept = '${selectedKementerian}' AND ${tahunFilter}`;
          if (selectedJenisBelanja)
            query += ` AND jenbel = '${selectedJenisBelanja}'`;
          query += roleFilter;
          query += ` GROUP BY kddept, tahun ORDER BY tahun`;
        }
      } else {
        // Level 1 & 2: histori_satker_bulanan has real1-real12, map/unit tables don't
        if (level === "2") {
          const rawLabel =
            unitOptions.find((o: any) => o.value === selectedKddept)?.label ||
            selectedKddept;
          const unitLabel = (
            rawLabel.includes(" - ")
              ? rawLabel.split(" - ").slice(1).join(" - ")
              : rawLabel
          ).replace(/'/g, "''");
          query = `SELECT '${selectedKddept}' as kddept, '${unitLabel}' as nmdept, '${selectedJenisBelanja || "Semua Jenis Belanja"}' as jenbel, tahun, ROUND(SUM(pagu)/${pembulatan}, 0) as pagu, ${realTahunan} FROM prognosis.histori_satker_bulanan WHERE kddept = '${selectedKementerian}' AND kdunit = '${selectedKddept}' AND ${tahunFilter}`;
          if (selectedJenisBelanja)
            query += ` AND jenbel = '${selectedJenisBelanja}'`;
          query += ` GROUP BY tahun ORDER BY tahun`;
        } else {
          // Level 1
          const kemLabel = (
            kementerianOptions.find((o: any) => o.value === selectedKddept)
              ?.label || selectedKddept
          ).replace(/'/g, "''");
          query = `SELECT '${selectedKddept}' as kddept, '${kemLabel}' as nmdept, '${selectedJenisBelanja || "Semua Jenis Belanja"}' as jenbel, tahun, ROUND(SUM(pagu)/${pembulatan}, 0) as pagu, ${realTahunan} FROM prognosis.histori_satker_bulanan WHERE kddept = '${selectedKddept}' AND ${tahunFilter}`;
          if (selectedJenisBelanja)
            query += ` AND jenbel = '${selectedJenisBelanja}'`;
          query += ` GROUP BY tahun ORDER BY tahun`;
        }
      }
    }

    setSqlQuery(query);
    try {
      const response = await apiClient.post(`/prognosis/getDataKinerja`, {
        queryParams: query,
      });
      let data = response;
      if (response && typeof response === "object") {
        if (
          "data" in (response as any) &&
          Array.isArray((response as any).data)
        ) {
          data = (response as any).data;
        } else if (Array.isArray(response)) {
          data = response;
        }
      }
      if (!Array.isArray(data))
        throw new Error("Invalid response format from server");
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
          const val = item[month] ?? item[month.toLowerCase()];
          if (val !== null && val !== undefined) {
            mlData.push({
              tahun: parseInt(item.tahun),
              bulan: index + 1,
              pagu: parseFloat(item.pagu || 0),
              realisasi: parseFloat(val || 0),
              kddept: parseInt(
                level === "3" ? selectedKementerian : selectedKddept,
              ),
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
        kddept: parseInt(level === "3" ? selectedKementerian : selectedKddept),
        jenbel: item.jenbel,
      }));
    }

    if (!mlData || mlData.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Data Tidak Tersedia",
        text: "Data realisasi untuk parameter yang dipilih masih kosong.",
      });
      return;
    }

    const predictionStartMonth = 1;
    const predictionStartYear = currentYear;
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
        kddept: level === "3" ? selectedKementerian : selectedKddept,
        jenis_belanja: selectedJenisBelanja || "",
      },
    };

    try {
      const res = await apiClient.post("/prognosis/predict", predictionRequest);
      let prediction = res;
      if (res && typeof res === "object" && "prediction" in (res as any)) {
        prediction = (res as any).prediction;
      }
      if (prediction) {
        setPredictionData(res);
        prepareChartData(
          historical,
          prediction,
          predictionStartMonth,
          predictionStartYear,
        );
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
    startYear: number,
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
          if (val && item.pagu) {
            data.push({
              name: `${item.tahun}-${(i + 1).toString().padStart(2, "0")}`,
              realisasi: (val / item.pagu) * 100,
              type: "Historical",
            });
          }
        });
      } else {
        if (item.pagu) {
          data.push({
            name: item.tahun.toString(),
            realisasi: (item.total_realisasi / item.pagu) * 100,
            type: "Historical",
          });
        }
      }
    });

    if (prediction.predictions) {
      prediction.predictions.forEach((pred: any, i: number) => {
        const percentage = Number(
          pred?.cumulative_percentage ?? pred?.percentage ?? 0,
        );
        let pName = "";
        if (jenisLaporan === "1") {
          const monthIndex = (startMonth - 1 + i) % 12;
          const month = monthIndex + 1;
          const year = startYear + Math.floor((startMonth - 1 + i) / 12);
          pName = `${year}-${month.toString().padStart(2, "0")}`;
        } else {
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

  // --- Download Handlers ---

  const handleDownloadCSV = async () => {
    if (!tableData || tableData.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Data Tidak Tersedia",
        text: "Silakan klik Tayang terlebih dahulu.",
      });
      return;
    }
    try {
      const headerMapping: Record<string, string> = {
        kddept: "Kode",
        nmdept: "Nama",
        jenbel: "Jenis Belanja",
        tahun: "Tahun",
        pagu: "Pagu (Rp)",
        JAN: "Januari",
        FEB: "Februari",
        MAR: "Maret",
        APR: "April",
        MEI: "Mei",
        JUN: "Juni",
        JUL: "Juli",
        AGS: "Agustus",
        SEP: "September",
        OKT: "Oktober",
        NOV: "November",
        DES: "Desember",
        total_realisasi: "Total Realisasi (Rp)",
      };
      const dataKeys = Object.keys(tableData[0]);
      const headers = dataKeys.map((k) => headerMapping[k] || k);
      let csvContent = "\uFEFF" + headers.join(",") + "\n";
      tableData.forEach((row) => {
        const rowValues = dataKeys.map((key) => {
          let value = row[key];
          if (typeof value === "number")
            value = new Intl.NumberFormat("id-ID").format(value);
          if (value == null) value = "";
          value = String(value);
          if (
            value.includes(",") ||
            value.includes('"') ||
            value.includes("\n")
          )
            value = '"' + value.replace(/"/g, '""') + '"';
          return value;
        });
        csvContent += rowValues.join(",") + "\n";
      });
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute(
        "download",
        `prognosis_${currentYear}_${Date.now()}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "File CSV berhasil didownload.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Terjadi kesalahan saat mendownload CSV.",
      });
    }
  };

  const handleDownloadExcel = async () => {
    if (!tableData || tableData.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Data Tidak Tersedia",
        text: "Silakan klik Tayang terlebih dahulu.",
      });
      return;
    }
    try {
      const XLSX = await import("xlsx");
      const headerMapping: Record<string, string> = {
        kddept: "Kode",
        nmdept: "Nama",
        jenbel: "Jenis Belanja",
        tahun: "Tahun",
        pagu: "Pagu (Rp)",
        JAN: "Januari",
        FEB: "Februari",
        MAR: "Maret",
        APR: "April",
        MEI: "Mei",
        JUN: "Juni",
        JUL: "Juli",
        AGS: "Agustus",
        SEP: "September",
        OKT: "Oktober",
        NOV: "November",
        DES: "Desember",
        total_realisasi: "Total Realisasi (Rp)",
      };
      const dataKeys = Object.keys(tableData[0]);
      const renamedData = tableData.map((row) => {
        const newRow: Record<string, any> = {};
        dataKeys.forEach((key) => {
          newRow[headerMapping[key] || key] = row[key] ?? "";
        });
        return newRow;
      });
      const ws = XLSX.utils.json_to_sheet(renamedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Prognosis Data");
      XLSX.writeFile(wb, `prognosis_${currentYear}_${Date.now()}.xlsx`);
      await Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "File Excel berhasil didownload.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Terjadi kesalahan saat mendownload Excel.",
      });
    }
  };

  const handleDownloadPDF = async () => {
    if (!tableData || tableData.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Data Tidak Tersedia",
        text: "Silakan klik Tayang terlebih dahulu.",
      });
      return;
    }
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("Pop-up diblokir");
      const headerMapping: Record<string, string> = {
        kddept: "Kode",
        nmdept: "Nama",
        jenbel: "Jenis Belanja",
        tahun: "Tahun",
        pagu: "Pagu",
        JAN: "Jan",
        FEB: "Feb",
        MAR: "Mar",
        APR: "Apr",
        MEI: "Mei",
        JUN: "Jun",
        JUL: "Jul",
        AGS: "Ags",
        SEP: "Sep",
        OKT: "Okt",
        NOV: "Nov",
        DES: "Des",
        total_realisasi: "Total Realisasi",
      };
      const dataKeys = Object.keys(tableData[0]);
      const headers = dataKeys.map((k) => headerMapping[k] || k);
      let tableHTML = `<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:10px"><thead><tr style="background:#4472C4;color:white">${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>`;
      tableData.forEach((row) => {
        tableHTML += `<tr>${dataKeys.map((k) => `<td>${row[k] != null ? (typeof row[k] === "number" ? new Intl.NumberFormat("id-ID").format(row[k]) : row[k]) : ""}</td>`).join("")}</tr>`;
      });
      tableHTML += "</tbody></table>";
      printWindow.document.write(
        `<html><head><title>Prognosis</title></head><body><h2>Prognosis Data Belanja - ${new Date().toLocaleDateString("id-ID")}</h2>${tableHTML}<script>window.onload=()=>{window.print();window.close();}<\/script></body></html>`,
      );
      printWindow.document.close();
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Terjadi kesalahan saat membuat PDF.",
      });
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prognosis</h1>
          <p className="text-sm text-muted-foreground">
            Sistem Prediksi Realisasi Anggaran Berbasis Machine Learning dengan
            parameter yang dapat disesuaikan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-white dark:bg-card hover:bg-zinc-200"
          >
            <Settings className="w-4 h-4" />
            Pengaturan
          </Button>
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            <Keyboard className="w-3 h-3" />
            <span>Ctrl+P</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* 1. Filters */}
        <PrognosisFilters
          jenisLaporan={jenisLaporan}
          setJenisLaporan={setJenisLaporan}
          level={level}
          setLevel={setLevel}
          filteredLevelOptions={filteredLevelOptions}
          selectedKddept={selectedKddept}
          setSelectedKddept={setSelectedKddept}
          selectedKementerian={selectedKementerian}
          onKementerianChange={handleKementerianChange}
          kementerianOptions={kementerianOptions}
          kementerianLevel3Options={kementerianLevel3Options}
          selectedUnit={selectedUnit}
          onUnitChange={handleUnitChange}
          unitOptions={unitOptions}
          selectedSatker={selectedKddept}
          onSatkerChange={handleSatkerChange}
          satkerOptions={satkerOptions}
          selectedJenisBelanja={selectedJenisBelanja}
          setSelectedJenisBelanja={setSelectedJenisBelanja}
          jenisBelanjaOptions={jenisBelanjaOptions}
          loadingJenisBelanja={loadingJenisBelanja}
          selectedBaseline={selectedBaseline}
          setSelectedBaseline={setSelectedBaseline}
          baselineOptions={baselineOptions}
          loadingBaseline={loadingBaseline}
          selectedMetode={selectedMetode}
          setSelectedMetode={setSelectedMetode}
          selectedTargetProyeksi={selectedTargetProyeksi}
          setSelectedTargetProyeksi={setSelectedTargetProyeksi}
          targetOptions={targetOptions}
          loading={loading}
          loadingSatker={loadingSatker}
          role={role}
        />

        {/* 2. Action Bar */}
        <PrognosisActionBar
          loadingResults={loadingResults}
          handleTayang={handleTayang}
          handleRefresh={handleRefresh}
          setShowModalSQL={setShowModalSQL}
          role={role}
          onDownloadCSV={handleDownloadCSV}
          onDownloadExcel={handleDownloadExcel}
          onDownloadPDF={handleDownloadPDF}
        />

        {/* 3. Empty state */}
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

        {/* 4. Results */}
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
              startMonth={dynamicStartMonth}
              startYear={dynamicStartYear}
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
