"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Pilih...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onValueChange(value.filter((v) => v !== optValue));
    } else {
      onValueChange([...value, optValue]);
    }
  };

  const removeOne = (optValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(value.filter((v) => v !== optValue));
  };

  const selectedLabels = value.map(
    (v) => options.find((o) => o.value === v)?.label ?? v
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-auto min-h-9 px-3 py-1.5 font-normal",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
            {selectedLabels.length > 0 ? (
              selectedLabels.map((label, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs px-1.5 py-0 rounded flex items-center gap-1"
                >
                  {label}
                  <span
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer hover:text-destructive"
                    onClick={(e) => removeOne(value[i]!, e)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onValueChange(value.filter((_, idx) => idx !== i));
                      }
                    }}
                  >
                    <X className="h-2.5 w-2.5" />
                  </span>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-[--radix-popover-trigger-width]"
        align="start"
        sideOffset={4}
      >
        {/* Search */}
        <div className="border-b px-3 py-2">
          <input
            className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            placeholder="Cari indikator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Options */}
        <ul className="max-h-60 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground text-center">
              Tidak ditemukan
            </li>
          ) : (
            filtered.map((opt) => {
              const checked = value.includes(opt.value);
              return (
                <li
                  key={opt.value}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    checked && "bg-accent/50"
                  )}
                  onClick={() => toggle(opt.value)}
                >
                  <div
                    className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                      checked
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground"
                    )}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </div>
                  <span>{opt.label}</span>
                </li>
              );
            })
          )}
        </ul>

        {/* Footer clear */}
        {value.length > 0 && (
          <div className="border-t px-3 py-1.5">
            <button
              className="text-xs text-muted-foreground hover:text-destructive w-full text-left"
              onClick={() => onValueChange([])}
            >
              Hapus semua pilihan
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
