export function getPembulatanDivisor(pembulatan: string): number {
  switch (pembulatan) {
    case "ribuan":
      return 1000;
    case "jutaan":
      return 1000000;
    case "miliaran":
      return 1000000000;
    case "triliunan":
      return 1000000000000;
    default:
      return 1;
  }
}

export const MONTH_LABELS = [
  "jan","feb","mar","apr","mei","jun","jul","ags","sep","okt","nov","des"
] as const;
