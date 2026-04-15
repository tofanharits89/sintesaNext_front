export interface RingkasanData {
  id: string | number;
  kodeKanwil?: string;
  namaLokasi?: string;
  kodeKppn?: string;
  namaKppn?: string;
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

export interface MonitoringKanwilData {
  id: string | number;
  kdkanwil: string;
  nmlokasi: string;
  jumlah_kppn: number;
  jumlah_satker_up_kkp: number;
  jumlah_satker_transaksi: number;
  nilai_transaksi: number;
  status?: string;
  tanggalKirim?: string | null;
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

export interface DirektoratPaContentRef {
  getData: () => RingkasanData[];
  getFilters: () => {
    selectedYear: string;
    selectedPeriode: string;
    selectedKanwil: string;
    selectedKppn: string;
    kanwilLabel: string;
    kppnLabel: string;
  };
}

export interface DirektoratPaContentProps {
  contentType?:
    | "ringkasan-kanwil"
    | "ringkasan-kppn"
    | "monitoring-kanwil"
    | "monitoring-kppn";
}
