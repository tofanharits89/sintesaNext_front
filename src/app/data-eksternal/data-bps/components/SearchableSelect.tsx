"use client";

import { useState, useRef, useEffect } from "react";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  onSearch?: (query: string, signal?: AbortSignal) => Promise<SelectOption[]>;
  initialOptions?: SelectOption[];
}

export function SearchableSelect({
  label,
  value,
  onChange,
  disabled,
  isLoading,
  placeholder = `Pilih ${label}`,
  onSearch,
  initialOptions = [],
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<SelectOption[]>(initialOptions);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption?.label || placeholder;

  // Search function with debouncing
  const performSearch = async (query: string) => {
    if (!onSearch || !query.trim()) {
      setOptions(initialOptions);
      setSearched(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setLoading(true);

    try {
      const results = await onSearch(query.trim(), abortController.signal);

      if (!abortController.signal.aborted) {
        setOptions(results);
        setSearched(true);
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        // Error handled silently
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Reset search when popover opens
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setOptions(initialOptions);
      setSearched(false);
    }
  }, [open, initialOptions]);

  const displayLimit = options.length; // Show all items for both domain and variable

  return (
    <div className="mb-4">
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between border border-input bg-background text-sm hover:!bg-accent hover:!text-accent-foreground h-10 min-w-0 rounded-md px-3 py-2 text-left ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
            disabled={disabled || isLoading}
          >
            <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <span className=" truncate">{displayValue}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Cari ${label.toLowerCase()}...`}
              value={searchQuery}
              onValueChange={setSearchQuery}
              disabled={isLoading}
            />
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                  Mencari...
                </div>
              )}
              {!loading && (
                <>
                  <CommandEmpty>
                    {searchQuery ? "Tidak ada hasil" : (searched ? "Tidak ada hasil" : "Ketik untuk mencari")}
                  </CommandEmpty>
                  <CommandGroup>
                    {options.slice(0, displayLimit).map((opt) => (
                      <CommandItem
                        key={opt.value}
                        value={opt.value}
                        keywords={[opt.label]}
                        onSelect={() => {
                          try {
                            onChange(opt.value === value ? null : opt.value);
                          } catch (error) {
                            // Error handled silently
                          }
                          setOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <CheckIcon
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === opt.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {opt.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}