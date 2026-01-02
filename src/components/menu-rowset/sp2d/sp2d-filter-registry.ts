export interface Sp2dFilterDef {
  key: string;
  label: string;
  order: number;
  showInUI?: boolean;
}

export const SP2D_FILTER_DEFS: Sp2dFilterDef[] = [
  {
    key: "kementerian",
    label: "Kementerian",
    order: 1,
    showInUI: true,
  },
  {
    key: "eselonI",
    label: "Eselon I",
    order: 2,
    showInUI: true,
  },
  {
    key: "kewenangan",
    label: "Kewenangan",
    order: 3,
    showInUI: true,
  },
  {
    key: "kppn",
    label: "KPPN",
    order: 4,
    showInUI: true,
  },
  {
    key: "satker",
    label: "Satker",
    order: 5,
    showInUI: true,
  },
  {
    key: "program",
    label: "Program",
    order: 6,
    showInUI: true,
  },
  {
    key: "kegiatan",
    label: "Kegiatan",
    order: 7,
    showInUI: true,
  },
  {
    key: "sumberDana",
    label: "Sumber Dana",
    order: 8,
    showInUI: true,
  },
  {
    key: "output",
    label: "Output",
    order: 9,
    showInUI: true,
  },
  {
    key: "akun",
    label: "Akun",
    order: 10,
    showInUI: true,
  },
];

export type Sp2dFilterKey = (typeof SP2D_FILTER_DEFS)[number]["key"];

export const getSp2dUIFilters = (): Sp2dFilterDef[] =>
  SP2D_FILTER_DEFS.filter((d) => d.showInUI !== false).sort(
    (a, b) => a.order - b.order
  );

export const getSp2dFilterLabel = (key: string): string => {
  const def = SP2D_FILTER_DEFS.find((d) => d.key === key);
  return def?.label || key;
};
