import { DataSP2DMBG } from "@/components/mbg/data-mbg/data-sp2d-mbg";

export default function DataMbgPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Data MBG</h1>
        <p className="text-sm text-muted-foreground">
          Tarik data realisasi BGN COA dan rekap lokus penerima manfaat MBG
        </p>
      </div>
      <DataSP2DMBG />
    </div>
  );
}
