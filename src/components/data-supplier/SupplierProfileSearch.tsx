"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export interface SupplierProfileSearchProps {
  initialQuery?: string;
  placeholder?: string;
  onSearch: (q: { npwp?: string; vendor?: string; raw: string }) => void;
}

function detectQueryType(raw: string): { npwp?: string; vendor?: string } {
  const s = raw.trim();
  if (!s) return {};
  // NPWP heuristic: mostly digits with optional separators
  const digits = s.replace(/[^0-9]/g, "");
  if (digits.length >= 10) {
    return { npwp: digits };
  }
  return { vendor: s };
}

export function SupplierProfileSearch({ initialQuery = "", placeholder = "Cari Nama Supplier atau NPWP Supplier...", onSearch }: SupplierProfileSearchProps) {
  const [value, setValue] = React.useState(initialQuery);

  React.useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  const submit = React.useCallback(() => {
    const payload = detectQueryType(value);
    onSearch({ ...payload, raw: value.trim() });
  }, [value, onSearch]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
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
      </div>
      <Button onClick={submit} variant="secondary" className="shrink-0">
        Cari
      </Button>
    </div>
  );
}

export default SupplierProfileSearch;
