export interface Option {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'text' | 'date' | 'number';
  required?: boolean;
  dependencies?: string[];
  placeholder?: string;
}

export interface FilterValue {
  selection?: string;
  kondisiCode?: string;
  mengandungKata?: string;
  jenisTampilan?: string;
  akunType?: string;
}

export interface FilterState {
  [key: string]: FilterValue;
}
