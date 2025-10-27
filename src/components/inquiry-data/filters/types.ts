export type Option = { value: string; label: string };

export interface FilterConfig {
  filterKey: string;
  filterLabel: string;
  icon?: React.ComponentType<{ className?: string }> | undefined;
  removable?: boolean;
}

export interface FilterValue {
  selection?: string;
  kondisiCode?: string;
  mengandungKata?: string;
  jenisTampilan?: string;
  akunType?: string;
}

export interface FilterOptions {
  options: Option[];
  dependencies?: string[];
  hasCommonOptions?: boolean;
}

export interface FilterState {
  selection: string;
  kondisiCode?: string;
  mengandungKata?: string;
  jenisTampilan?: string;
  akunType?: string;
}

export interface FilterChangeHandler {
  (filterKey: string, field: string, value: string): void;
}
