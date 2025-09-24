"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import supplierDatasetRaw from "@/data/carisupplier.json";

type RawSupplierEntry = {
  NAMA_VENDOR?: string | null;
  NPWP_SUPPLIER?: string | null;
};

type SupplierEntry = {
  rawVendor: string;
  npwp: string;
  displayName: string;
  searchVendor: string;
  searchVendorBase: string;
  searchNpwp: string;
};

function normalizeSupplierDataset(rawList: unknown): SupplierEntry[] {
  if (!Array.isArray(rawList)) return [];

  const parsed: SupplierEntry[] = [];

  for (const item of rawList as RawSupplierEntry[]) {
    const npwp = String(item?.NPWP_SUPPLIER ?? "").trim();
    if (!npwp) continue;
    const vendorRaw = String(item?.NAMA_VENDOR ?? "").trim();
    const canonicalName = vendorRaw || npwp;
    const baseName = canonicalName.replace(/\s*-\s*[0-9]+\s*$/, "").trim() || canonicalName;

    parsed.push({
      rawVendor: canonicalName,
      npwp,
      displayName: canonicalName,
      searchVendor: canonicalName.toLowerCase(),
      searchVendorBase: baseName.toLowerCase(),
      searchNpwp: npwp.toLowerCase(),
    });
  }

  return parsed;
}

const SUPPLIER_ENTRIES: SupplierEntry[] = normalizeSupplierDataset(supplierDatasetRaw);
const NPWP_INDEX = new Map<string, SupplierEntry[]>();
const VENDOR_INDEX = new Map<string, SupplierEntry>();
const BASE_VENDOR_INDEX = new Map<string, SupplierEntry>();

for (const entry of SUPPLIER_ENTRIES) {
  const npwpBucket = NPWP_INDEX.get(entry.npwp);
  if (npwpBucket) {
    npwpBucket.push(entry);
  } else {
    NPWP_INDEX.set(entry.npwp, [entry]);
  }

  if (!VENDOR_INDEX.has(entry.searchVendor)) {
    VENDOR_INDEX.set(entry.searchVendor, entry);
  }

  if (!BASE_VENDOR_INDEX.has(entry.searchVendorBase)) {
    BASE_VENDOR_INDEX.set(entry.searchVendorBase, entry);
  }
}

export interface SupplierProfileSearchProps {
  initialQuery?: string;
  placeholder?: string;
  onSearch: (q: { vendor?: string; raw: string }) => void;
}

export function SupplierProfileSearch({ initialQuery = "", placeholder = "Cari Nama Supplier atau NPWP Supplier...", onSearch }: SupplierProfileSearchProps) {
  const [value, setValue] = React.useState(initialQuery);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [ListComp, setListComp] = React.useState<React.ComponentType<any> | null>(null);
  const deferredValue = React.useDeferredValue(value);
  const normalizedQuery = deferredValue.trim().toLowerCase();

  React.useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  const submit = React.useCallback(() => {
    const rawInput = value.trim();

    if (!rawInput) {
      setIsDropdownOpen(false);
      onSearch({ raw: "" });
      return;
    }

    const lower = rawInput.toLowerCase();
    const vendorMatch = VENDOR_INDEX.get(lower) ?? BASE_VENDOR_INDEX.get(lower);
    if (vendorMatch) {
      const vendorName = vendorMatch.displayName;
      setValue(vendorName);
      setIsDropdownOpen(false);
      onSearch({ vendor: vendorName, raw: vendorName });
      return;
    }

    const digits = rawInput.replace(/[^0-9]/g, "");
    if (digits.length >= 10) {
      const matches = NPWP_INDEX.get(digits) ?? [];
      if (matches.length === 1) {
        const vendorName = matches[0].displayName;
        setValue(vendorName);
        setIsDropdownOpen(false);
        onSearch({ vendor: vendorName, raw: vendorName });
        return;
      }

      if (matches.length > 1) {
        setIsDropdownOpen(true);
        return;
      }
    }

    setIsDropdownOpen(false);
    onSearch({ vendor: rawInput, raw: rawInput });
  }, [value, onSearch]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredEntries = React.useMemo(() => {
    if (SUPPLIER_ENTRIES.length === 0) {
      return [] as SupplierEntry[];
    }

    if (normalizedQuery.length < 2 && !initialQuery) {
      return [] as SupplierEntry[];
    }

    const results: SupplierEntry[] = [];
    const limit = 300;
    const query = normalizedQuery;
    const seen = new Set<string>();

    const source = query ? SUPPLIER_ENTRIES : SUPPLIER_ENTRIES.slice(0, limit);

    for (let i = 0; i < source.length && results.length < limit; i++) {
      const entry = source[i];
      if (
        entry.searchVendor.includes(query) ||
        entry.searchVendorBase.includes(query) ||
        entry.searchNpwp.includes(query)
      ) {
        if (!seen.has(entry.displayName)) {
          results.push(entry);
          seen.add(entry.displayName);
        }
      }
    }

    return results;
  }, [normalizedQuery, initialQuery]);

  React.useEffect(() => {
    if (!isDropdownOpen || ListComp || filteredEntries.length <= 25) {
      return;
    }

    let active = true;
    import("react-window")
      .then((mod: any) => {
        if (!active) return;
        const List = mod?.FixedSizeList ?? mod?.default?.FixedSizeList ?? null;
        if (List) {
          setListComp(() => List);
        }
      })
      .catch(() => {
        if (!active) return;
        setListComp(null);
      });

    return () => {
      active = false;
    };
  }, [filteredEntries.length, isDropdownOpen, ListComp]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const handleSuggestionSelect = React.useCallback(
    (entry: SupplierEntry) => {
      const vendorName = entry.displayName;
      setValue(vendorName);
      setIsDropdownOpen(false);
      onSearch({ vendor: vendorName, raw: vendorName });
    },
    [onSearch]
  );

  const showDropdown = isDropdownOpen;
  const ITEM_HEIGHT = 48;
  const listHeight = Math.min(Math.max(filteredEntries.length, 1) * ITEM_HEIGHT, 320);
  const useVirtualizedList = Boolean(ListComp && filteredEntries.length > 25);

  const renderRow = React.useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const entry = filteredEntries[index];
      if (!entry) return null;

      const handleMouseDown = (event: React.MouseEvent) => {
        event.preventDefault();
      };

      return (
        <button
          type="button"
          style={style}
          onMouseDown={handleMouseDown}
          onClick={() => handleSuggestionSelect(entry)}
          className="flex w-full flex-col gap-1 border-b border-border/50 px-3 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-accent hover:text-accent-foreground"
        >
          <span className="font-medium truncate" title={entry.displayName}>
            {entry.displayName}
          </span>
          <span className="text-xs text-muted-foreground">NPWP: {entry.npwp}</span>
        </button>
      );
    },
    [filteredEntries, handleSuggestionSelect]
  );

  return (
    <div className="flex w-full items-center gap-2" ref={containerRef}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => {
            const nextVal = e.target.value;
            setValue(nextVal);
            setIsDropdownOpen(true);
          }}
          onFocus={() => {
            setIsDropdownOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="pl-9 pr-9"
          aria-label="Cari supplier"
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {showDropdown && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-md border border-border bg-popover shadow-lg">
            {filteredEntries.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground">
                Tidak ada vendor ditemukan. Coba kata kunci lain, Shifu.
              </div>
            ) : useVirtualizedList ? (
              ListComp ? (
                <ListComp height={listHeight} itemCount={filteredEntries.length} itemSize={ITEM_HEIGHT} width="100%">
                  {renderRow}
                </ListComp>
              ) : (
                <div className="px-3 py-4 text-sm text-muted-foreground">Menyiapkan daftar...</div>
              )
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {filteredEntries.map((entry) => (
                  <button
                    key={`${entry.npwp}-${entry.rawVendor}`}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionSelect(entry)}
                    className="flex w-full flex-col gap-1 border-b border-border/50 px-3 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="font-medium truncate" title={entry.displayName}>
                      {entry.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">NPWP: {entry.npwp}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Button onClick={submit} variant="secondary" className="shrink-0">
        Cari
      </Button>
    </div>
  );
}

export default SupplierProfileSearch;
