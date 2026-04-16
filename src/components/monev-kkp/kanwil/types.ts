export interface RingkasanKanwilData {
  id: string | number;
  kodeKppn: string;
  namaKppn: string;
  kodeBA: string;
  kodeSatker: string;
  namaSatker: string;
  upKkpPerBulan: number;
  porsiUpKkp: number;
  bankPenerbit: string;
  jmlKartuUsul: number | null;
  jumlahKartu: number;
  jmlKartuOpr: number;
  limitOpr: number;
  jmlKartuPd: number;
  limitPd: number;
  nilaiTagihan: number;
  nilaiTransaksi: number;
  kendala: string;
  detil_kendala?: string;
  detil_masukan_kendala?: string;
  nomor_pks?: string;
  tanggal_pks?: string;
  nomor_surat_up?: string;
  tanggal_surat_up?: string;
  tanggal_ctk_tagihan?: string;
  tanggal_jth_tempo?: string;
  nomor_sp2d_list?: string;
  tanggal_sp2d_list?: string;
  jenis_belanja_list?: string;
}

export interface MonitoringKppnData {
  id: string | number;
  kdkppn: string;
  nmkppn: string;
  jumlah_satker_up_kkp: number;
  jumlah_satker_transaksi: number;
  nilai_transaksi: number;
  status?: string;
  tanggalKirim?: string | null;
}

export interface KanwilContentRef {
  getData: () => RingkasanKanwilData[];
  getSelectedPeriode: () => { year: string; periode: string };
}

export interface KanwilContentProps {
  contentType?: "ringkasan" | "monitoring";
  statusLaporan?: "sent" | "not_sent";
  tglKirimKanwil?: string | null;
  kppnCompletionStatus?: "complete" | "incomplete";
  onPeriodeChange?: (year: string, periode: string) => void;
}
