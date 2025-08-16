export default function DashboardUtamaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Utama</h1>
        <p className="text-sm text-muted-foreground">Ringkasan cepat realisasi APBN dan indikator makro.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow">
          <p className="text-sm text-muted-foreground">Penerimaan Negara (YTD)</p>
          <p className="mt-2 text-2xl font-semibold">Rp 1.250 T</p>
          <div className="mt-4 h-16 rounded bg-muted" />
        </div>
        <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow">
          <p className="text-sm text-muted-foreground">Belanja Negara (YTD)</p>
          <p className="mt-2 text-2xl font-semibold">Rp 1.100 T</p>
          <div className="mt-4 h-16 rounded bg-muted" />
        </div>
        <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow">
          <p className="text-sm text-muted-foreground">Saldo Anggaran</p>
          <p className="mt-2 text-2xl font-semibold">Rp 150 T</p>
          <div className="mt-4 h-16 rounded bg-muted" />
        </div>
        <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow">
          <p className="text-sm text-muted-foreground">Inflasi (YoY)</p>
          <p className="mt-2 text-2xl font-semibold">2.8%</p>
          <div className="mt-4 h-16 rounded bg-muted" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Realisasi APBN vs Target</p>
            <span className="text-xs text-muted-foreground">2025</span>
          </div>
          <div className="mt-4 h-48 rounded bg-muted" />
        </div>
        <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Realisasi per K/L (Top 10)</p>
            <span className="text-xs text-muted-foreground">2025</span>
          </div>
          <div className="mt-4 h-48 rounded bg-muted" />
        </div>
      </div>

      <div className="rounded-lg p-4 bg-white dark:bg-neutral-900 shadow">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Realisasi per Fungsi</p>
          <span className="text-xs text-muted-foreground">2025</span>
        </div>
        <div className="mt-4 h-64 rounded bg-muted" />
      </div>
    </div>
  );
}

