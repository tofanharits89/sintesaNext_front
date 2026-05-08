"use client";

import * as React from "react";
import { cn } from "@/lib/utils/utils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  emptyMessage = "Tidak ditemukan.",
  className,
  contentClassName,
  disabled = false,
}: SearchableSelectProps) {
  const selectedOption =
    options.find((option) => option.value === value) ?? null;

  return (
    <Combobox
      items={options}
      value={selectedOption}
      onValueChange={(nextValue) => {
        if (nextValue === undefined || nextValue === null) {
          return;
        }

        onValueChange(nextValue.value);
      }}
      itemToStringValue={(option) => option.label}
      autoHighlight
      disabled={disabled}
    >
      <ComboboxInput
        className={cn(
          "w-full bg-zinc-100 dark:bg-black hover:bg-zinc-200 dark:hover:bg-zinc-950 [&_[data-slot=input-group-button]]:hover:!bg-zinc-200 dark:[&_[data-slot=input-group-button]]:hover:!bg-zinc-950",
          className,
        )}
        placeholder={placeholder}
        aria-label={searchPlaceholder}
        disabled={disabled}
        onFocus={(e) => e.target.select()}
      />
      <ComboboxContent 
        className={cn("!bg-zinc-100 dark:!bg-black", contentClassName)}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(option: SearchableSelectOption) => (
            <ComboboxItem
              key={option.value}
              value={option}
              className="data-highlighted:!bg-zinc-200 dark:data-highlighted:!bg-zinc-950"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
