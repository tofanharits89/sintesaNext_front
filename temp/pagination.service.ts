import sequelizeMonev2025 from "../../../config/sequelizeMonev2025.js";
import type { PagedResult, QueryResult } from "../types/index.js";
import { isSummableColumn } from "../utils/sql-analyzer.util.js";

const MAX_JSON_PAGE_SIZE = 100;
const DEFAULT_JSON_PAGE_SIZE = 50;
const MAX_DOWNLOAD_ROWS = 50000;

/**
 * Pagination Service
 * Handles paginated query execution and grand totals
 */

export class PaginationService {
  /**
   * Execute query with pagination
   */
  async runPaged(
    rawSql: string,
    stripOrderByFn: (sql: string) => string,
    page: any,
    pageSize: any,
  ): Promise<PagedResult> {
    const safePage = Math.max(1, parseInt(page) || 1);
    const safePageSize = Math.max(
      1,
      Math.min(parseInt(pageSize) || DEFAULT_JSON_PAGE_SIZE, MAX_JSON_PAGE_SIZE),
    );
    const offset = (safePage - 1) * safePageSize;

    // Count
    const countSql = `SELECT COUNT(*) AS cnt FROM (${stripOrderByFn(rawSql)}) AS t`;

    const start = Date.now();
    const [countRows]: any = await (sequelizeMonev2025 as any).query(countSql, { raw: true, timeout: 240000 });
    const totalCount = Number(countRows?.[0]?.cnt || 0);

    // Data page - PostgreSQL-optimized with consistent ordering
    const dataSql = `SELECT * FROM (${rawSql}) AS t ORDER BY (SELECT 1) LIMIT ${safePageSize} OFFSET ${offset}`;
    const [rows, metadata]: any = await (sequelizeMonev2025 as any).query(dataSql, { raw: true, timeout: 240000 });
    const executionTime = Date.now() - start;

    const data = Array.isArray(rows) ? rows : [];
    const columns = data.length ? Object.keys(data[0]) : [];

    return { data, columns, totalCount, executionTime };
  }

  /**
   * Calculate grand totals for summable columns
   */
  async runGrandTotals(rawSql: string, stripOrderByFn: (sql: string) => string, columns: string[]): Promise<Record<string, number>> {
    if (!Array.isArray(columns) || columns.length === 0) return {};
    const cols = columns.filter(isSummableColumn);
    if (cols.length === 0) return {};
    
    const selects = cols.map((c) => `SUM(COALESCE(t.${c}::numeric, 0)) AS ${c}`).join(", ");
    const totalsSql = `SELECT ${selects} FROM (${stripOrderByFn(rawSql)}) AS t`;
    const [rows]: any = await (sequelizeMonev2025 as any).query(totalsSql, { raw: true, timeout: 240000 });
    const row = Array.isArray(rows) && rows.length ? rows[0] : {};
    
    const totals: Record<string, number> = {};
    for (const key of cols as string[]) {
      const v: any = (row as any)[key];
      const num = Number(v);
      if (!isNaN(num) && v != null) totals[key] = num;
    }
    return totals;
  }

  /**
   * Execute query with row cap (for downloads)
   */
  async runWithCap(
    rawSql: string,
    hasLimitFn: (sql: string) => boolean,
    cap: number = MAX_DOWNLOAD_ROWS,
  ): Promise<QueryResult> {
    const finalSql = hasLimitFn(rawSql) ? rawSql : `${rawSql} LIMIT ${cap}`;
    const start = Date.now();
    const [rows]: any = await (sequelizeMonev2025 as any).query(finalSql, { raw: true, timeout: 240000 });
    const executionTime = Date.now() - start;
    const data = Array.isArray(rows) ? rows : [];
    const columns = data.length ? Object.keys(data[0]) : [];
    return { data, columns, executionTime };
  }
}
