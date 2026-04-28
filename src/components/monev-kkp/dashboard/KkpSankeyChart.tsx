"use client";

import { useEffect, useMemo, useState } from "react";
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

// Matte/dusty muted colors for nodes and links (better contrast on white bg)
const MATTE_COLORS = [
  "#CD5C5C", // dusty rose
  "#E07A5F", // terracotta
  "#D4A373", // muted ochre
  "#81B29A", // sage green
  "#5A7D9A", // muted blue
  "#9D8189", // dusty mauve
  "#4A6D7C", // muted teal
  "#B5838D", // rosewood
  "#6C5B7B", // dusty purple
  "#C38D9E", // dusty pink
  "#41B3A3", // muted mint
  "#E27D60", // muted coral
  "#59A68D", // matte sea green
  "#C28258", // matte bronze
  "#747C92", // slate blue
];

function formatRupiahShort(value: number): string {
  if (Math.abs(value) >= 1e12) return `Rp ${(value / 1e12).toFixed(2)} T`;
  if (Math.abs(value) >= 1e9) return `Rp ${(value / 1e9).toFixed(1)} M`;
  if (Math.abs(value) >= 1e6) return `Rp ${(value / 1e6).toFixed(0)} jt`;
  return `Rp ${value.toLocaleString("id-ID")}`;
}

// ---------------------------------------------------------------------------
// Responsive breakpoint hook
// ---------------------------------------------------------------------------
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
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
  const isMobile = useIsMobile();

  // -------------------------------------------------------------------------
  // Responsive chart config
  // -------------------------------------------------------------------------
  const chartConfig = useMemo(() => {
    if (isMobile) {
      return {
        aspectRatio: "3 / 4",
        nodeWidth: 8,
        nodePadding: 36,
        margin: { top: 8, right: 140, bottom: 8, left: 100 },
        minHeight: "500px",
        showValueLabels: false,
        wrapChars: 16,
      };
    }
    return {
      aspectRatio: "16 / 9",
      nodeWidth: 12,
      nodePadding: 46,
      margin: { top: 16, right: 260, bottom: 20, left: 150 },
      minHeight: "280px",
      showValueLabels: true,
      wrapChars: 38,
    };
  }, [isMobile]);

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
      const name = data.nmakun ? `${kdakun} - ${data.nmakun}` : kdakun;
      nodes.push({ name, category: "outcome", kdakun });
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
        <div className="flex-1 w-full" style={{ minHeight: chartConfig.minHeight }}>
          <SankeyChart
            data={sankeyData}
            aspectRatio={chartConfig.aspectRatio}
            nodeWidth={chartConfig.nodeWidth}
            nodePadding={chartConfig.nodePadding}
            margin={chartConfig.margin}
          >
            <SankeyLink
              useGradient={false}
              strokeOpacity={0.4}
              fadedOpacity={0.04}
              getLinkColor={(link) => {
                const sourceNode = link.source as any;
                const idx = typeof sourceNode === "number" ? sourceNode : Number(sourceNode.index ?? 0);
                return MATTE_COLORS[idx % MATTE_COLORS.length] ?? "#000";
              }}
            />
            <SankeyNode
              lineCap={3}
              showLabels={true}
              showValueLabels={chartConfig.showValueLabels}
              fadedOpacity={0.3}
              wrapChars={chartConfig.wrapChars}
              getNodeColor={(_, index) => MATTE_COLORS[index % MATTE_COLORS.length] ?? "#000"}
            />
            <SankeyTooltip formatValue={formatRupiahShort} />
          </SankeyChart>
        </div>
      </CardContent>
    </Card>
  );
}
