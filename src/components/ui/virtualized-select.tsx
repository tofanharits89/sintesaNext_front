"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback, CSSProperties, ReactElement } from "react";
import { List, type RowComponentProps } from "react-window";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Option {
  value: string;
  label: string;
}

interface VirtualizedSelectProps {
  options: Option[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxHeight?: number;
  itemHeight?: number;
}

interface RowCustomProps {
  items: Option[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

function OptionRow(props: RowComponentProps<RowCustomProps>): ReactElement | null {
  const { index, style, items, selectedValue, onSelect } = props;
  const option = items[index]!;
  const isSelected = option.value === selectedValue;

  return (
    <div
      style={style}
      className={cn(
        "flex items-center justify-between px-3 py-2 cursor-pointer text-sm hover:!bg-zinc-200 dark:hover:!bg-zinc-950 hover:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground"
      )}
      onClick={() => onSelect(option.value)}
    >
      <span className="truncate" title={option.label}>
        {option.label}
      </span>
      {isSelected && <Check className="w-4 h-4 flex-shrink-0 ml-2" />}
    </div>
  );
}


export function VirtualizedSelect({
  options,
  value,
  onValueChange,
  placeholder = "Pilih...",
  className,
  disabled = false,
  maxHeight = 200,
  itemHeight = 36,
}: VirtualizedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 150);
  }, []);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const filteredOptions = useMemo(() => {
    if (!debouncedSearch) return options;
    const lower = debouncedSearch.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  }, [options, debouncedSearch]);

  const selectedLabel = useMemo(() => {
    return options.find((o) => o.value === value)?.label || "";
  }, [options, value]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleOptionSelect = useCallback(
    (optionValue: string) => {
      onValueChange(optionValue);
      setIsOpen(false);
      setSearchTerm("");
      setDebouncedSearch("");
    },
    [onValueChange]
  );

  const rowProps = useMemo<RowCustomProps>(
    () => ({ items: filteredOptions, selectedValue: value, onSelect: handleOptionSelect }),
    [filteredOptions, value, handleOptionSelect]
  );

  const listHeight = Math.min(maxHeight, filteredOptions.length * itemHeight);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-zinc-100 dark:bg-black hover:!bg-zinc-200 dark:hover:!bg-zinc-950 flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-9",
            isOpen && "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            className
          )}
        >
          <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
            {selectedLabel || placeholder}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)] z-[100] !bg-zinc-100 dark:!bg-black border border-border rounded-md shadow-md"
        align="start"
      >
        <div className="p-2 border-b">
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground !bg-zinc-100 dark:!bg-black hover:!bg-zinc-200 dark:hover:!bg-zinc-950 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
          />
        </div>

        {filteredOptions.length > 0 ? (
          <List<RowCustomProps>
            style={{ height: listHeight }}
            rowCount={filteredOptions.length}
            rowHeight={itemHeight}
            rowComponent={OptionRow}
            rowProps={rowProps}
          />
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Tidak ada data ditemukan.
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
