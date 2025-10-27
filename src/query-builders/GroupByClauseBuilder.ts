"use client";

import type { FilterValue } from "@/components/inquiry-data/filters/types";

interface GroupByClauseConfig {
  tipeLaporan: string;
  tematikKategori?: string;
}

type GroupByColumn = string;

/**
 * Builder class for constructing GROUP BY clauses with strategy pattern
 * Replaces the repetitive logic in groupby-clause.ts
 */
export class GroupByClauseBuilder {
  private columns: GroupByColumn[] = [];

  /**
   * Add a GROUP BY column based on filter configuration
   */
  addFilter(filterKey: string, filterValue: FilterValue, reportParams: GroupByClauseConfig) {
    const strategies: Record<string, (value: FilterValue, config: GroupByClauseConfig) => GroupByColumn | null> = {
      "selection": this.buildSelectionGroupBy.bind(this),
      "kondisiCode": this.buildKondisiCodeGroupBy.bind(this),
      // Add more strategies as needed
    };

    const strategy = strategies[filterKey];
    if (strategy) {
      const column = strategy(filterValue, reportParams);
      if (column && !this.columns.includes(column)) {
        this.columns.push(column);
      }
    }
  }

  private buildSelectionGroupBy(value: FilterValue, config: GroupByClauseConfig): GroupByColumn | null {
    if (!value.selection || value.selection === "all") {
      return null;
    }

    return "selection";
  }

  private buildKondisiCodeGroupBy(value: FilterValue, config: GroupByClauseConfig): GroupByColumn | null {
    if (!value.kondisiCode) {
      return null;
    }

    return "kondisi_code";
  }

  /**
   * Build the final GROUP BY clause
   */
  build(): GroupByColumn[] {
    return [...this.columns];
  }

  /**
   * Reset the builder to initial state
   */
  reset() {
    this.columns = [];
  }
}

/**
 * Factory function to create a configured builder
 */
export function createGroupByClauseBuilder(): GroupByClauseBuilder {
  return new GroupByClauseBuilder();
}

/**
 * Main function to build GROUP BY clause (replaces the old buildGroupByClause)
 */
export function buildGroupByClause(
  activeFilters: string[],
  filterValues: Record<string, FilterValue>,
  reportParams: GroupByClauseConfig
): GroupByColumn[] {
  const builder = createGroupByClauseBuilder();

  // Process each active filter
  activeFilters.forEach((filterKey) => {
    const filterValue = filterValues[filterKey];
    if (filterValue) {
      builder.addFilter(filterKey, filterValue, reportParams);
    }
  });

  return builder.build();
}
