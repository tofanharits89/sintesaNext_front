"use client";

import React, { useState, useRef, useEffect } from "react";
import { FixedSizeList as List } from "react-window";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const selectRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected option label
  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label || "";

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleOptionSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Render individual option item
  const OptionItem = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const option = filteredOptions[index];
    const isSelected = option.value === value;

    return (
      <div
        style={style}
        className={cn(
          "flex items-center justify-between px-3 py-2 cursor-pointer text-sm hover:bg-accent hover:text-accent-foreground",
          isSelected && "bg-accent text-accent-foreground"
        )}
        onClick={() => handleOptionSelect(option.value)}
      >
        <span className="truncate" title={option.label}>{option.label}</span>
        {isSelected && <Check className="w-4 h-4 flex-shrink-0 ml-2" />}
      </div>
    );
  };

  const listHeight = Math.min(maxHeight, filteredOptions.length * itemHeight);

  return (
    <div ref={selectRef} className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={cn(
          "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-xs whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-8",
          isOpen && "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
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

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md">
          {/* Search Input */}
          <div className="p-2 border-b">
            <input
              ref={inputRef}
              type="text"
              placeholder="Cari..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
            />
          </div>

          {/* Options List */}
          {filteredOptions.length > 0 ? (
            <div className="max-h-[200px] overflow-y-auto">
              {filteredOptions.length > 10 ? (
                // Use virtualization for large lists
                <List
                  height={listHeight}
                  itemCount={filteredOptions.length}
                  itemSize={itemHeight}
                  width="100%"
                >
                  {OptionItem}
                </List>
              ) : (
                // Render normally for small lists
                <div className="py-1">
                  {filteredOptions.map((option, index) => (
                    <div
                      key={option.value}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 cursor-pointer text-sm hover:bg-accent hover:text-accent-foreground",
                        option.value === value &&
                          "bg-accent text-accent-foreground"
                      )}
                      onClick={() => handleOptionSelect(option.value)}
                      style={{ height: itemHeight }}
                    >
                      <span className="truncate" title={option.label}>{option.label}</span>
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
        </div>
      )}
    </div>
  );
}
