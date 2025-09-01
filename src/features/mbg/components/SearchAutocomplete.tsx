import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { toast } from "sonner";

export function SearchAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onPlaceSelected: (place: any) => void;
  disabled?: boolean;
}) {
  const acRef = useRef<any | null>(null);

  useEffect(() => {
    const input = document.getElementById("mbg-map-search") as HTMLInputElement | null;
    if (!input || (window as any).google?.maps?.places == null) return;

    const ac = new google.maps.places.Autocomplete(input, {
      fields: ["geometry", "name", "types", "address_components"],
      componentRestrictions: { country: "id" },
      types: ["(regions)"],
    });
    acRef.current = ac;

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.geometry || !place.geometry.location) {
        toast.error("Lokasi tidak ditemukan");
        return;
      }
      onPlaceSelected(place);
    });

    return () => {
      if (acRef.current) {
        google.maps.event.clearInstanceListeners(acRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <Input
        id="mbg-map-search"
        placeholder="Cari provinsi/kabupaten/kota (Indonesia)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {value && (
        <button
          type="button"
          aria-label="Bersihkan pencarian"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
          onClick={() => {
            onChange("");
            const el = document.getElementById("mbg-map-search") as HTMLInputElement | null;
            if (el) el.value = "";
          }}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
