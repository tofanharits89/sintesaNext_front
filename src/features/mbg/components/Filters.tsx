import { ProvinceSelect } from "@/components/mbg/ProvinceRegencySelectors";
import { MBG_INDICATOR_OPTIONS, type MbgIndicatorKey } from "@/features/mbg/types/domain";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Filters({
  provinceId,
  indicator,
  onProvinceChange,
  onIndicatorChange,
}: {
  provinceId: string;
  indicator: MbgIndicatorKey;
  onProvinceChange: (v: string) => void;
  onIndicatorChange: (v: MbgIndicatorKey) => void;
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
      <Select value={indicator} onValueChange={(value) => onIndicatorChange(value as MbgIndicatorKey)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Pilih Indikator" />
        </SelectTrigger>
        <SelectContent>
          {MBG_INDICATOR_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
