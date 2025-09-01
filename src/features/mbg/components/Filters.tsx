import { ProvinceSelect, RegencySelect } from "@/components/mbg/ProvinceRegencySelectors";

export function Filters({
  provinceId,
  regencyId,
  onProvinceChange,
  onRegencyChange,
}: {
  provinceId: string;
  regencyId: string;
  onProvinceChange: (v: string) => void;
  onRegencyChange: (v: string) => void;
}) {
  return (
    <>
      <ProvinceSelect
        value={provinceId}
        onChange={(v) => {
          onProvinceChange(v);
          // clearing regency when province changes is handled by parent
        }}
      />
      <RegencySelect value={regencyId} onChange={onRegencyChange} provinceId={provinceId} />
    </>
  );
}
