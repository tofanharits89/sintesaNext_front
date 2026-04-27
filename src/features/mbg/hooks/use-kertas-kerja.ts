import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/httpClient";

/**
 * Hook to fetch Kertas Kerja data using encrypted raw SQL queries
 */
export function useKertasKerja(
  tab: string, 
  year: string, 
  page: number = 1, 
  pageSize: number = 1000,
  userRole?: string | null,
  kdkanwil?: string | null
) {
  // Encryption utility: Base64 encode after URI component encoding (as seen in existing patterns)
  const encryptQuery = (query: string): string => btoa(encodeURIComponent(query));

  // SQL Templates based on User Request
  const queryTemplates: Record<string, string> = {
    makrokesra: `
      SELECT a.*, b.nmkanwil
      FROM data_bgn.indikator_bps a
      LEFT JOIN dbref.t_kanwil_{year} b ON a.kode_kanwil = b.kdkanwil
    `,
    "harga-komoditas": `
      SELECT a.*, b.nmkanwil
      FROM data_bgn.indikator_bapanas a
      LEFT JOIN dbref.t_kanwil_{year} b ON a.kode_kanwil = b.kdkanwil
    `,
    "perkembangan-lainnya": `
      SELECT a.*, b.nmkanwil
      FROM data_bgn.indikator_triwulanan a
      LEFT JOIN dbref.t_kanwil_{year} b ON a.kode_kanwil = b.kdkanwil
    `,
    "permasalahan-isu": `
      SELECT
        a.*,
        COALESCE(b.nmkanwil,
          CASE
            WHEN a.kode_kanwil LIKE '%-%' THEN trim(split_part(a.kode_kanwil, '-', 2))
            ELSE a.kode_kanwil
          END
        ) as nmkanwil,
        CASE
          WHEN a.kode_kanwil LIKE '%-%' THEN trim(split_part(a.kode_kanwil, '-', 1))
          ELSE a.kode_kanwil
        END as clean_kode
      FROM data_bgn.permasalahan a
      LEFT JOIN dbref.t_kanwil_{year} b ON (
        CASE
          WHEN a.kode_kanwil LIKE '%-%' THEN trim(split_part(a.kode_kanwil, '-', 1))
          ELSE a.kode_kanwil
        END
      ) = b.kdkanwil
    `,
    "kesimpulan-rekomendasi": `
      SELECT a.*, b.nmkanwil
      FROM data_bgn.kesimpulan_saran a
      LEFT JOIN dbref.t_kanwil_{year} b ON a.kode_kanwil = b.kdkanwil
    `,
  };

  const fetchKertasKerjaData = async () => {
    let template = queryTemplates[tab];
    if (!template) throw new Error(`Invalid tab: ${tab}`);

    // Replace {year} placeholder
    let rawSql = template.replace(/{year}/g, year);

    // Dynamic Filtering
    let filters = [];
    filters.push(`a.tahun = '${year}'`);

    if (userRole === "2" && kdkanwil) {
      filters.push(`a.kode_kanwil = '${kdkanwil}'`);
    }

    if (filters.length > 0) {
      rawSql += " WHERE " + filters.join(" AND ");
    }

    // Add Ordering (Fallback to id DESC for stability across all tables)
    rawSql += " ORDER BY a.id DESC ";

    const encryptedQuery = encryptQuery(rawSql);

    const response = await apiClient.post("/mbg/kertas-kerja/fetch", {
      encryptedQuery,
      page,
      pageSize,
    });

    return response.data;
  };

  return useQuery({
    queryKey: ["kertas-kerja", tab, year, page, pageSize, userRole, kdkanwil],
    queryFn: fetchKertasKerjaData,
    enabled: !!tab && !!year,
  });
}

/**
 * Hook to fetch distinct values for a column to populate dropdowns
 */
export function useKertasKerjaDistinct(
  table: string, 
  column: string, 
  year: string
) {
  const encryptQuery = (query: string): string => btoa(encodeURIComponent(query));

  const fetchDistinctData = async () => {
    const rawSql = `SELECT DISTINCT ${column} FROM ${table} WHERE tahun = '${year}' AND ${column} IS NOT NULL AND ${column} != '' ORDER BY ${column} ASC`;
    const encryptedQuery = encryptQuery(rawSql);

    const response = await apiClient.post("/mbg/kertas-kerja/fetch", {
      encryptedQuery,
      page: 1,
      pageSize: 500, // Reasonable limit for dropdowns
    });

    return response.data;
  };

  return useQuery({
    queryKey: ["kertas-kerja-distinct", table, column, year],
    queryFn: fetchDistinctData,
    enabled: !!table && !!column && !!year,
  });
}
