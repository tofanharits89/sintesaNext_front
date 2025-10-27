"use client";

import type { FilterValue } from "@/components/inquiry-data/filters/types";

interface SelectClauseConfig {
  pembulatan: string;
  tahun: string;
  tipeLaporan: string;
  jenisAkumulasi?: string;
}

interface SelectClauseResult {
  selectColumns: string[];
  joinTables: string[];
}

/**
 * Builder class for constructing SELECT clauses with a strategy pattern
 * Replaces the massive switch statement in select-clause.ts
 */
export class SelectClauseBuilder {
  private columns: string[] = [];
  private joins: string[] = [];

  /**
   * Add a column or group of columns based on filter configuration
   */
  addFilter(filterKey: string, filterConfig: { active: boolean; value?: FilterValue }, reportParams: SelectClauseConfig) {
    const strategies: Record<string, (config: SelectClauseConfig) => void> = {
      "selection": (config) => this.addSelectionColumns(config),
      "kondisiCode": () => this.addKondisiCodeColumns(),
      "mengandungKata": () => this.addTextSearchColumns(),
      // Add more strategies as needed
    };

    const strategy = strategies[filterKey];
    if (strategy && filterConfig.active) {
      strategy(reportParams);
    }
  }

  private addSelectionColumns(config: SelectClauseConfig) {
    // Add selection-related columns
    // Implementation depends on specific requirements
    this.columns.push("selection_field");
  }

  private addKondisiCodeColumns() {
    this.columns.push("kondisi_code");
  }

  private addTextSearchColumns() {
    this.columns.push("text_content");
    this.columns.push("search_match");
  }

  /**
   * Build the final SELECT clause result
   */
  build(): SelectClauseResult {
    return {
      selectColumns: [...this.columns],
      joinTables: [...this.joins],
    };
  }

  /**
   * Reset the builder to initial state
   */
  reset() {
    this.columns = [];
    this.joins = [];
  }
}

/**
 * Factory function to create a configured builder
 */
export function createSelectClauseBuilder(): SelectClauseBuilder {
  return new SelectClauseBuilder();
}

/**
 * Main function to build SELECT clause (replaces the old buildSelectClause)
 */
export function buildSelectClause(
  activeFilters: string[],
  filterValues: Record<string, FilterValue>,
  reportParams: SelectClauseConfig
): SelectClauseResult {
  const builder = createSelectClauseBuilder();

  // Process each active filter
  activeFilters.forEach((filterKey) => {
    const filterValue = filterValues[filterKey];
    if (filterValue) {
      builder.addFilter(
        filterKey,
        { active: true, value: filterValue },
        reportParams
      );
    }
  });

  return builder.build();
}
