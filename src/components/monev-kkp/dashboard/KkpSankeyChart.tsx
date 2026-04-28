"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChartCardSkeleton } from "@/components/ui/dashboard-skeletons";
import { useKkpSankey } from "@/features/monev-kkp/hooks/useKkpSankey";
import {
  SankeyChart,
  SankeyLink,
  SankeyNode,
  SankeyTooltip,
  type SankeyData,
  type SankeyNodeDatum,
  type SankeyLinkDatum,
} from "@/components/charts/sankey";

// ---------------------------------------------------------------------------
// Jenis Belanja lookup (2-digit akun prefix)
// ---------------------------------------------------------------------------
const JENIS_BELANJA: Record<string, string> = {
  "51": "Belanja Pegawai",
  "52": "Belanja Barang",
  "53": "Belanja Modal",
  "54": "Belanja Bunga Utang",
  "55": "Belanja Subsidi",
  "56": "Belanja Hibah",
  "57": "Belanja Bansos",
  "58": "Belanja Lain-lain",
};

function getJenisBelanja(kdakun: string): string {
  const prefix = kdakun.trim().slice(0, 2);
  return JENIS_BELANJA[prefix] ?? `Belanja ${prefix}`;
}

function getJenisBelanjaKey(kdakun: string): string {
  return kdakun.trim().slice(0, 2);
}

// Max number of detailed kode akun nodes (right column)
const MAX_AKUN_NODES = 10;

function formatRupiahShort(value: number): string {
  if (Math.abs(value) >= 1e12) return `Rp ${(value / 1e12).toFixed(2)} T`;
  if (Math.abs(value) >= 1e9) return `Rp ${(value / 1e9).toFixed(1)} M`;
  if (Math.abs(value) >= 1e6) return `Rp ${(value / 1e6).toFixed(0)} jt`;
  return `Rp ${value.toLocaleString("id-ID")}`;
}

interface KkpSankeyChartProps {
  year: string;
  triwulan: string;
  kdkanwil?: string | undefined;
  kdkppn?: string | undefined;
}

export function KkpSankeyChart({
  year,
  triwulan,
  kdkanwil,
  kdkppn,
}: KkpSankeyChartProps) {
  const { data: rawData, isLoading } = useKkpSankey(year, triwulan, kdkanwil, kdkppn);

  const sankeyData = useMemo((): SankeyData | null => {
    if (!rawData || rawData.length === 0) return null;

    // -----------------------------------------------------------------------
    // Step 1: Aggregate raw data into flows
    // -----------------------------------------------------------------------

    // prinsipal → jenis_belanja aggregation
    const prinsipalToJB = new Map<string, Map<string, { nilai: number; trx: number }>>();
    // jenis_belanja → kode_akun aggregation
    const jbToAkun = new Map<string, Map<string, { nmakun: string; nilai: number; trx: number }>>();

    for (const item of rawData) {
      const prinsipal = item.jns_kkp_prinsipal;
      const jbKey = getJenisBelanjaKey(item.kdakun);
      const jbName = getJenisBelanja(item.kdakun);
      const nilai = Number(item.total_nilai) || 0;
      const trx = Number(item.jml_transaksi) || 0;

      if (nilai <= 0) continue;

      // prinsipal → jenis_belanja
      if (!prinsipalToJB.has(prinsipal)) prinsipalToJB.set(prinsipal, new Map());
      const jbMap = prinsipalToJB.get(prinsipal)!;
      const existing = jbMap.get(jbKey) || { nilai: 0, trx: 0 };
      jbMap.set(jbKey, { nilai: existing.nilai + nilai, trx: existing.trx + trx });

      // jenis_belanja → kode_akun
      if (!jbToAkun.has(jbKey)) jbToAkun.set(jbKey, new Map());
      const akunMap = jbToAkun.get(jbKey)!;
      const existingAkun = akunMap.get(item.kdakun) || { nmakun: item.nmakun, nilai: 0, trx: 0 };
      akunMap.set(item.kdakun, {
        nmakun: item.nmakun || existingAkun.nmakun,
        nilai: existingAkun.nilai + nilai,
        trx: existingAkun.trx + trx,
      });
    }

    // -----------------------------------------------------------------------
    // Step 2: Build node lists
    // -----------------------------------------------------------------------

    // Column 1: Prinsipal (source)
    const prinsipalList = [...prinsipalToJB.keys()].sort();

    // Column 2: Jenis Belanja (landing)
    const jbKeys = [...jbToAkun.keys()].sort();
    const jbList = jbKeys.map((key) => ({
      key,
      name: `${key} - ${JENIS_BELANJA[key] ?? `Belanja ${key}`}`,
    }));

    // Column 3: Top N kode akun (outcome) — ranked by total nilai across all jenis belanja
    const allAkun = new Map<string, { nmakun: string; nilai: number; trx: number; jbKey: string }>();
    for (const [jbKey, akunMap] of jbToAkun) {
      for (const [kdakun, data] of akunMap) {
        const existing = allAkun.get(kdakun);
        if (existing) {
          existing.nilai += data.nilai;
          existing.trx += data.trx;
        } else {
          allAkun.set(kdakun, { ...data, jbKey });
        }
      }
    }

    const sortedAkun = [...allAkun.entries()]
      .sort((a, b) => b[1].nilai - a[1].nilai);

    const topAkun = sortedAkun.slice(0, MAX_AKUN_NODES);
    const otherAkun = sortedAkun.slice(MAX_AKUN_NODES);
    const topAkunKeys = new Set(topAkun.map(([kd]) => kd));

    // Check if we need an "Akun Lainnya" node
    const hasOther = otherAkun.length > 0;

    // -----------------------------------------------------------------------
    // Step 3: Build Sankey nodes array
    // -----------------------------------------------------------------------
    const nodes: SankeyNodeDatum[] = [];

    // Source nodes (prinsipal)
    for (const name of prinsipalList) {
      nodes.push({ name, category: "source" });
    }

    // Landing nodes (jenis belanja)
    for (const jb of jbList) {
      nodes.push({ name: jb.name, category: "landing" });
    }

    // Outcome nodes (top kode akun)
    for (const [kdakun, data] of topAkun) {
      nodes.push({ name: data.nmakun || kdakun, category: "outcome", kdakun });
    }

    // "Lainnya" node if needed
    if (hasOther) {
      nodes.push({ name: `Akun Lainnya (${otherAkun.length})`, category: "outcome" });
    }

    // Index maps
    const prinsipalIdx = new Map(prinsipalList.map((p, i) => [p, i]));
    const jbIdx = new Map(jbList.map((jb, i) => [jb.key, prinsipalList.length + i]));
    const akunStartIdx = prinsipalList.length + jbList.length;
    const akunIdx = new Map(topAkun.map(([kd], i) => [kd, akunStartIdx + i]));
    const lainnyaIdx = hasOther ? akunStartIdx + topAkun.length : -1;

    // -----------------------------------------------------------------------
    // Step 4: Build links
    // -----------------------------------------------------------------------
    const links: (SankeyLinkDatum & { jmlTransaksi: number })[] = [];

    // Links: prinsipal → jenis_belanja
    for (const [prinsipal, jbMap] of prinsipalToJB) {
      const sIdx = prinsipalIdx.get(prinsipal);
      if (sIdx === undefined) continue;
      for (const [jbKey, data] of jbMap) {
        const tIdx = jbIdx.get(jbKey);
        if (tIdx === undefined) continue;
        links.push({
          source: sIdx,
          target: tIdx,
          value: data.nilai,
          jmlTransaksi: data.trx,
        });
      }
    }

    // Links: jenis_belanja → kode_akun (top N + lainnya)
    for (const [jbKey, akunMap] of jbToAkun) {
      const sIdx = jbIdx.get(jbKey);
      if (sIdx === undefined) continue;

      let lainnyaNilai = 0;
      let lainnyaTrx = 0;

      for (const [kdakun, data] of akunMap) {
        if (topAkunKeys.has(kdakun)) {
          const tIdx = akunIdx.get(kdakun);
          if (tIdx === undefined) continue;
          links.push({
            source: sIdx,
            target: tIdx,
            value: data.nilai,
            jmlTransaksi: data.trx,
          });
        } else {
          lainnyaNilai += data.nilai;
          lainnyaTrx += data.trx;
        }
      }

      // Link to "Lainnya" if there are grouped akun
      if (hasOther && lainnyaNilai > 0) {
        links.push({
          source: sIdx,
          target: lainnyaIdx,
          value: lainnyaNilai,
          jmlTransaksi: lainnyaTrx,
        });
      }
    }

    if (links.length === 0) return null;

    return { nodes, links };
  }, [rawData]);

  if (isLoading) return <ChartCardSkeleton />;

  if (!sankeyData) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Alur Jenis KKP → Kode Akun
          </CardTitle>
          <CardDescription>Belum ada data transaksi KKP</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Tidak ada data untuk ditampilkan
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Alur Jenis KKP (Prinsipal) → Jenis Belanja → Kode Akun
        </CardTitle>
        <CardDescription>
          Distribusi nilai transaksi dari prinsipal kartu ke jenis belanja (top {MAX_AKUN_NODES} akun)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-6 pt-0 pb-4">
        <div className="flex-1 min-h-[280px] w-full">
          <SankeyChart
            data={sankeyData}
            aspectRatio="16 / 9"
            nodeWidth={12}
            nodePadding={46}
            margin={{ top: 16, right: 260, bottom: 16, left: 150 }}
          >
            <SankeyLink
              stroke="var(--foreground)"
              strokeOpacity={0.15}
              fadedOpacity={0.04}
              useGradient={false}
            />
            <SankeyNode
              fill="var(--foreground)"
              lineCap={3}
              showLabels={true}
              showValueLabels={true}
              fadedOpacity={0.3}
            />
            <SankeyTooltip formatValue={formatRupiahShort} />
          </SankeyChart>
        </div>
      </CardContent>
    </Card>
  );
}
