"use client";

import type { FilterValue } from "@/components/inquiry-data/filters/types";

interface WhereClauseConfig {
  tahun?: string;
  tipeLaporan?: string;
  tematikKategori?: string;
  pembulatan?: string;
  jenisAkumulasi?: string;
}

type WhereClause = string;

/**
 * Builder class for constructing WHERE clauses with strategy pattern
 * Replaces the complex conditional logic in where-clause.ts
 */
export class WhereClauseBuilder {
  private conditions: WhereClause[] = [];

  /**
   * Add a WHERE condition based on filter configuration
   */
  addFilter(filterKey: string, filterValue: FilterValue, reportParams?: WhereClauseConfig) {
    const strategies: Record<string, (value: FilterValue, config?: WhereClauseConfig) => WhereClause | null> = {
      "selection": this.buildSelectionCondition.bind(this),
      "kondisiCode": this.buildKondisiCodeCondition.bind(this),
      "mengandungKata": this.buildTextSearchCondition.bind(this),
      // Add more strategies as needed
    };

    const strategy = strategies[filterKey];
    if (strategy) {
      const condition = strategy(filterValue, reportParams);
      if (condition) {
        this.conditions.push(condition);
      }
    }
  }

  private buildSelectionCondition(value: FilterValue, config?: WhereClauseConfig): WhereClause | null {
    if (!value.selection || value.selection === "all") {
      return null;
    }

    return `selection = '${value.selection}'`;
  }

  private buildKondisiCodeCondition(value: FilterValue, config?: WhereClauseConfig): WhereClause | null {
    if (!value.kondisiCode) {
      return null;
    }

    return `kondisi_code = '${value.kondisiCode}'`;
  }

  private buildTextSearchCondition(value: FilterValue, config?: WhereClauseConfig): WhereClause | null {
    if (!value.mengandungKata) {
      return null;
    }

    return `text_content LIKE '%${value.mengandungKata}%'`;
  }

  /**
   * Build the final WHERE clause
   */
  build(): WhereClause[] {
    return [...this.conditions];
  }

  /**
   * Reset the builder to initial state
   */
  reset() {
    this.conditions = [];
  }
}

/**
 * Factory function to create a configured builder
 */
export function createWhereClauseBuilder(): WhereClauseBuilder {
  return new WhereClauseBuilder();
}

/**
 * Main function to build WHERE clause (replaces the old buildWhereClause)
 */
export function buildWhereClause(
  activeFilters: string[],
  filterValues: Record<string, FilterValue>,
  reportParams?: WhereClauseConfig
): WhereClause[] {
  const builder = createWhereClauseBuilder();

  // Process each active filter
  activeFilters.forEach((filterKey) => {
    const filterValue = filterValues[filterKey];
    if (filterValue) {
      builder.addFilter(filterKey, filterValue, reportParams);
    }
  });

  return builder.build();
}
