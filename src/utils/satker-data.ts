import { CarisatkerData } from "@/types/satker";

export function formatSatkerDisplayName(satker: CarisatkerData): string {
  return satker.nmsatker;
}

export function formatSatkerSubtitle(satker: CarisatkerData): string {
  const parts = [];
  
  if (satker.kdsatker) {
    parts.push(`Kode: ${satker.kdsatker}`);
  }
  
  if (satker.kdkanwil) {
    parts.push(`Kanwil: ${satker.kdkanwil}`);
  }
  
  if (satker.kdkppn) {
    parts.push(`KPPN: ${satker.kdkppn}`);
  }

  return parts.join(" | ");
}

export function formatDepartmentName(satker: CarisatkerData): string {
  if (satker.nmdept) {
    return satker.nmdept;
  }
  if (satker.kddept) {
    return `Kode Dept: ${satker.kddept}`;
  }
  return "Kementerian Keuangan";
}

export function formatUnitName(satker: CarisatkerData): string {
  if (satker.nmunit) {
    return satker.nmunit;
  }
  if (satker.kdunit) {
    return `Kode Unit: ${satker.kdunit}`;
  }
  return "-";
}

export function formatKanwilName(satker: CarisatkerData): string {
  if (satker.nmkanwil) {
    return satker.nmkanwil;
  }
  return `Kanwil ${satker.kdkanwil}`;
}

export function formatKppnName(satker: CarisatkerData): string {
  if (satker.nmkppn) {
    return satker.nmkppn;
  }
  return `KPPN ${satker.kdkppn}`;
}

export function formatKewenanganName(satker: CarisatkerData): string {
  if (satker.nmdekon) {
    return satker.nmdekon;
  }
  if (satker.kddekon) {
    return `Kode Dekon: ${satker.kddekon}`;
  }
  return "-";
}

export function isBLUStatus(statusblu: string | boolean | undefined): boolean {
  if (typeof statusblu === 'boolean') {
    return statusblu;
  }
  if (typeof statusblu === 'string') {
    return statusblu === '1' || statusblu.toLowerCase() === 'true' || statusblu.toLowerCase() === 'ya';
  }
  return false;
}
