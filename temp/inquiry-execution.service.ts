import sequelizeMonev2025 from "../../../config/sequelizeMonev2025.js";
import logger from "../../../config/logger.js";
import { QueryEncryptionService } from "./query-encryption.service.js";
import { QueryValidationService } from "./query-validation.service.js";
import { SqlOptimizationService } from "./sql-optimization.service.js";
import { RbacQueryService } from "./rbac-query.service.js";
import { PaginationService } from "./pagination.service.js";
import { ExportService } from "./export.service.js";
import type { ConversionInfo } from "../types/index.js";

/**
 * Inquiry Execution Service
 * Main orchestrator for query execution
 */

export class InquiryExecutionService {
  private encryptionService: QueryEncryptionService;
  private validationService: QueryValidationService;
  private optimizationService: SqlOptimizationService;
  private rbacService: RbacQueryService;
  private paginationService: PaginationService;
  private exportService: ExportService;

  constructor() {
    this.encryptionService = new QueryEncryptionService();
    this.validationService = new QueryValidationService();
    this.optimizationService = new SqlOptimizationService();
    this.rbacService = new RbacQueryService();
    this.paginationService = new PaginationService();
    this.exportService = new ExportService();
  }

  /**
   * Execute query and return JSON with pagination
   */
  async executeQueryJson(
    encryptedQuery: string,
    user: any,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<any> {
    // Decrypt
    let rawSql = this.encryptionService.decrypt(encryptedQuery);

    // Optimize for PostgreSQL
    logger.debug(`Original SQL: ${rawSql.substring(0, 200)}...`);
    rawSql = this.optimizationService.optimizeForPostgreSQL(rawSql);
    logger.debug(`Optimized SQL: ${rawSql.substring(0, 200)}...`);

    // Validate
    const validation = this.validationService.validatePostgreSQLQuery(rawSql);
    if (!validation.isValid) {
      throw new Error(validation.error || "Query validation failed");
    }

    // Apply RBAC
    rawSql = this.rbacService.applyRbacToQuery(rawSql, user);

    // Check table existence
    await this.checkTableExists(rawSql);

    // Execute with pagination
    const stripOrderBy = this.optimizationService.stripTrailingOrderBy.bind(this.optimizationService);
    const hasLimit = this.validationService.hasLimitClause.bind(this.validationService);
    
    const { data, columns, totalCount, executionTime } = await this.paginationService.runPaged(
      rawSql,
      stripOrderBy,
      page,
      pageSize,
    );

    // Calculate grand totals
    const grandTotals = await this.paginationService.runGrandTotals(rawSql, stripOrderBy, columns);

    const response: any = {
      success: true,
      data,
      columns,
      rowCount: data.length,
      totalCount,
      executionTime,
      grandTotals,
    };

    if (process.env.NODE_ENV !== "production") {
      response.query = rawSql;
    }

    return response;
  }

  /**
   * Execute query and return CSV
   */
  async executeQueryCsv(encryptedQuery: string, user: any): Promise<string> {
    // Decrypt
    let rawSql = this.encryptionService.decrypt(encryptedQuery);

    // Optimize for PostgreSQL
    rawSql = this.optimizationService.optimizeForPostgreSQL(rawSql);

    // Validate
    const validation = this.validationService.validatePostgreSQLQuery(rawSql);
    if (!validation.isValid) {
      throw new Error(validation.error || "Query validation failed");
    }

    // Apply RBAC
    rawSql = this.rbacService.applyRbacToQuery(rawSql, user);

    // Check table existence
    await this.checkTableExists(rawSql);

    // Execute with cap
    const hasLimit = this.validationService.hasLimitClause.bind(this.validationService);
    const { data, columns } = await this.paginationService.runWithCap(rawSql, hasLimit);

    // Convert to CSV
    return this.exportService.toCsv(data, columns);
  }

  /**
   * Execute query and return data for Excel
   */
  async executeQueryExcel(encryptedQuery: string, user: any): Promise<any> {
    // Decrypt
    let rawSql = this.encryptionService.decrypt(encryptedQuery);

    // Optimize for PostgreSQL
    rawSql = this.optimizationService.optimizeForPostgreSQL(rawSql);

    // Validate
    const validation = this.validationService.validatePostgreSQLQuery(rawSql);
    if (!validation.isValid) {
      throw new Error(validation.error || "Query validation failed");
    }

    // Apply RBAC
    rawSql = this.rbacService.applyRbacToQuery(rawSql, user);

    // Check table existence
    await this.checkTableExists(rawSql);

    // Execute with cap
    const hasLimit = this.validationService.hasLimitClause.bind(this.validationService);
    const result = await this.paginationService.runWithCap(rawSql, hasLimit);

    return { success: true, ...result, format: "excel" };
  }

  /**
   * Preview converted query without execution
   */
  async previewConvertedQuery(encryptedQuery: string, user: any): Promise<any> {
    // Decrypt
    let rawSql = this.encryptionService.decrypt(encryptedQuery);
    const originalQuery = rawSql;

    // Optimize for PostgreSQL
    logger.debug(`Original SQL: ${rawSql.substring(0, 200)}...`);
    rawSql = this.optimizationService.optimizeForPostgreSQL(rawSql);
    logger.debug(`Converted SQL: ${rawSql.substring(0, 200)}...`);

    // Validate
    const validation = this.validationService.validatePostgreSQLQuery(rawSql);
    if (!validation.isValid) {
      throw new Error(validation.error || "Query validation failed");
    }

    // Apply RBAC
    rawSql = this.rbacService.applyRbacToQuery(rawSql, user);

    const conversions: ConversionInfo = {
      hasConvert: /CONVERT\s*\(/i.test(originalQuery),
      hasIfnull: /IFNULL\s*\(/i.test(originalQuery),
      hasDateFormat: /DATE_FORMAT\s*\(/i.test(originalQuery),
      hasGroupConcat: /GROUP_CONCAT\s*\(/i.test(originalQuery),
      hasMysqlLimit: /LIMIT\s+\d+\s*,\s*\d+/i.test(originalQuery),
    };

    return {
      success: true,
      originalQuery,
      convertedQuery: rawSql,
      conversions,
    };
  }

  /**
   * Check if table exists in database
   */
  private async checkTableExists(rawSql: string): Promise<void> {
    const tableMatch = rawSql.match(/FROM\s+([^\s]+)/i);
    if (!tableMatch || !tableMatch[1]) return;

    const fullTableRef = tableMatch[1].trim();
    logger.info(`Checking if table exists: ${fullTableRef}`);

    let schemaName = "public";
    let tableName = fullTableRef;

    if (fullTableRef.includes(".")) {
      [schemaName, tableName] = fullTableRef.split(".");
    }

    try {
      const [result] = await (sequelizeMonev2025 as any).query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = '${schemaName.toLowerCase()}'
          AND table_name = '${tableName.toLowerCase()}'
        ) as exists`,
        { raw: true },
      );
      const tableExists = result?.[0]?.exists || false;

      if (!tableExists) {
        logger.error(
          `Table does not exist in PostgreSQL: ${fullTableRef} (schema: ${schemaName}, table: ${tableName})`,
        );

        const [schemas] = await (sequelizeMonev2025 as any).query(
          "SELECT table_schema, table_name FROM information_schema.tables ORDER BY table_schema, table_name LIMIT 20",
          { raw: true },
        );

        if (schemas && Array.isArray(schemas)) {
          const availableTables = schemas.map((t: any) => `${t.table_schema}.${t.table_name}`);
          const availableSchemas = [...new Set(schemas.map((t: any) => t.table_schema))];

          throw new Error(
            `Table "${fullTableRef}" does not exist. Available schemas: ${availableSchemas.join(", ")}. Available tables: ${availableTables.join(", ")}`,
          );
        } else {
          throw new Error(
            `Table "${fullTableRef}" does not exist in schema "${schemaName}"`,
          );
        }
      } else {
        logger.info(`Table exists: ${fullTableRef} (schema: ${schemaName}, table: ${tableName})`);
      }
    } catch (diagError: any) {
      if (diagError.message.includes("does not exist")) {
        throw diagError;
      }
      logger.warn("Could not check table existence", { error: diagError.message });
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await (sequelizeMonev2025 as any).authenticate();
      return true;
    } catch (err: any) {
      return false;
    }
  }
}
