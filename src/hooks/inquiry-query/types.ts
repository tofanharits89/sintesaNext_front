export interface FilterConfig {
  key: string;
  columnName: string;
  referenceTable?: string;
  referenceDatabase?: string;
  joinKey?: string;
  nameColumn?: string;
  noYearSuffix?: boolean;
}

export interface QueryBuilderState {
  selectColumns: string[];
  whereConditions: string[];
  joinTables: string[];
}

export interface FilterValue {
  selection: string;
  kondisiCode: string;
  mengandungKata: string;
  jenisTampilan: "kode" | "kode_uraian" | "uraian" | "jangan_tampilkan";
  akunType?: "kodeAkun" | "kodeBkpk" | "jenisBelanja";
}

export type ReportTypeConfig = {
  includePaguDipa?: boolean;
  addBlokirAfterReal?: boolean;
  requiresGroupByBlokirJenis?: boolean;
  isVolumeOutput?: boolean;
  tableNameBuilder?: (thang: string, baseTable: string) => string;
};
