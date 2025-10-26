export interface CarisatkerData {
  kdsatker: string;
  nmsatker: string;
  email?: string;
  kddept?: string;
  nmdept?: string;
  kdunit?: string;
  nmunit?: string;
  kddekon?: string;
  nmdekon?: string;
  kdkanwil: string;
  nmkanwil?: string;
  kdkppn: string;
  nmkppn?: string;
  thang?: string;
  kpa?: string;
  bendahara?: string;
  ppspm?: string;
  npwp?: string;
  statusblu?: string | boolean;
  kdjendok?: string;
}

export interface SatkerProfileData {
  namaSatker: string;
  emailSatker?: string;
  kementerian: string;
  unitEselonI: string;
  kewenangan: string;
  kanwilDJPb: string;
  kppn: string;
  tahunAnggaran?: string;
  kuasaPenggunaAnggaran?: string;
  bendahara?: string;
  ppspm?: string;
  npwp?: string;
  statusBLU: boolean;
  jenisDokumen?: string;
}
