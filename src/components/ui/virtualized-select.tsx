"use client";

import React, { useState, useRef, useEffect } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [ListComp, setListComp] = useState<any | null>(null);

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected option label
  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label || "";

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small timeout to ensure the popover is rendered and input is focusable
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Lazy-load react-window only when needed
  useEffect(() => {
    if (isOpen && filteredOptions.length > 10 && !ListComp) {
      import("react-window")
        .then((mod: any) => {
          const L = mod?.FixedSizeList ?? mod?.default?.FixedSizeList ?? null;
          setListComp(() => L);
        })
        .catch(() => setListComp(null));
    }
  }, [isOpen, filteredOptions.length, ListComp]);

  const handleOptionSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  // Render individual option item
  const OptionItem = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const option = filteredOptions[index]!;
    const isSelected = option.value === value;

    return (
      <div
        style={style}
        className={cn(
          "flex items-center justify-between px-3 py-2 cursor-pointer text-sm hover:!bg-zinc-200 dark:hover:!bg-zinc-950 hover:text-accent-foreground",
          isSelected && "bg-accent text-accent-foreground"
        )}
        onClick={() => handleOptionSelect(option.value)}
      >
        <span className="truncate" title={option.label}>
          {option.label}
        </span>
        {isSelected && <Check className="w-4 h-4 flex-shrink-0 ml-2" />}
      </div>
    );
  };

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
          <span
            className={cn("truncate", !selectedLabel && "text-muted-foreground")}
          >
            {selectedLabel || placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 opacity-50 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 w-[var(--radix-popover-trigger-width)] z-[100] !bg-zinc-100 dark:!bg-black border border-border rounded-md shadow-md"
        align="start"
      >
        {/* Search Input */}
        <div className="p-2 border-b">
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground !bg-zinc-100 dark:!bg-black hover:!bg-zinc-200 dark:hover:!bg-zinc-950 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
          />
        </div>

        {/* Options List */}
        {filteredOptions.length > 0 ? (
          <div className="max-h-[200px] overflow-y-auto overflow-x-hidden">
            {filteredOptions.length > 10 && ListComp ? (
              <ListComp
                height={listHeight}
                itemCount={filteredOptions.length}
                itemSize={itemHeight}
                width="100%"
              >
                {OptionItem}
              </ListComp>
            ) : (
              <div className="py-1">
                {filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 cursor-pointer text-sm hover:!bg-zinc-200 dark:hover:!bg-zinc-950 hover:text-accent-foreground",
                      option.value === value && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => handleOptionSelect(option.value)}
                    style={{ height: itemHeight }}
                  >
                    <span className="truncate" title={option.label}>
                      {option.label}
                    </span>
                    {option.value === value && (
                      <Check className="w-4 h-4 flex-shrink-0 ml-2" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Tidak ada data ditemukan.
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

